import json
import logging
import jwt
import requests
import redis
import stripe
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pythonjsonlogger import jsonlogger
from typing import List, Optional
from pydantic import BaseModel

from app.config import (
    PORT,
    HOST,
    JWT_SECRET,
    JWT_ALGORITHM,
    REDIS_HOST,
    REDIS_PORT,
    PRODUCT_SERVICE_URL,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    FRONTEND_URL,
)
from app.database import engine, Base, get_db
from app.models import Order
from app.schemas import OrderCreate, OrderResponse

stripe.api_key = STRIPE_SECRET_KEY

log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
log_handler.setFormatter(formatter)
logger = logging.getLogger("order-service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

Base.metadata.create_all(bind=engine)

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_connect_timeout=2,
    )
    redis_client.ping()
    logger.info("Connexion à Redis établie avec succès")
except Exception as e:
    redis_client = None
    logger.warning("Connexion à Redis échouée: %s. Le caching sera désactivé.", e)

app = FastAPI(
    title="Order Service",
    description="Microservice pour la création et le suivi des commandes",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

orders_created = Counter(
    "orders_created_total",
    "Total orders created",
    ["payment_method"],
)

security_agent = HTTPBearer()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security_agent),
) -> dict:
    return decode_access_token(credentials.credentials)


def require_role(required_role: str):
    def dependency(payload: dict = Depends(get_current_user_payload)) -> dict:
        if payload.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes",
            )
        return payload

    return dependency


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "order-service"}


def _fetch_product(product_id: int) -> dict:
    """Fetch a product from product-service. Raises HTTPException on any
    failure — callers rely on this to price orders, so an unreachable
    product-service must fail the order rather than silently trusting
    client-supplied data (that's the vulnerability this closes)."""
    try:
        response = requests.get(
            f"{PRODUCT_SERVICE_URL}/api/v1/products/{product_id}", timeout=3
        )
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=502, detail="Impossible de vérifier le prix du produit"
        )
    if response.status_code == 404:
        raise HTTPException(status_code=400, detail=f"Produit {product_id} introuvable")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502, detail="Impossible de vérifier le prix du produit"
        )
    return response.json()


@app.post(
    "/api/v1/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    username = payload.get("sub")

    # Price integrity: never trust order_data.total_price from the client —
    # recompute it from product-service's real prices/stock. Without this, a
    # tampered request could set an arbitrary total for any order.
    line_items = (
        order_data.items
        if isinstance(order_data.items, list) and order_data.items
        else (
            [{"id": order_data.product_id, "quantity": order_data.quantity or 1}]
            if order_data.product_id
            else []
        )
    )
    if not line_items:
        raise HTTPException(status_code=400, detail="Commande vide")

    verified_total = 0.0
    for item in line_items:
        item_id = item.get("id") if isinstance(item, dict) else None
        item_qty = (item.get("quantity") or 1) if isinstance(item, dict) else 1
        if not item_id:
            raise HTTPException(status_code=400, detail="Article de commande invalide")
        product = _fetch_product(item_id)
        if product.get("stock", 0) < item_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product.get('name', 'ce produit')}",
            )
        verified_total += product["price"] * item_qty

    new_order = Order(
        order_number=order_data.order_number,
        username=username,
        product_id=order_data.product_id,
        quantity=order_data.quantity,
        items_json=json.dumps(order_data.items) if order_data.items else None,
        total_price=verified_total,
        payment_method=order_data.payment_method,
        shipping_address=order_data.shipping_address,
        status="pending",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    orders_created.labels(payment_method=order_data.payment_method or "unknown").inc()
    logger.info("Commande créée: %s pour %s", new_order.order_number, username)
    return new_order


@app.get("/api/v1/orders/me", response_model=list[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)
):
    username = payload.get("sub")
    return (
        db.query(Order)
        .filter(Order.username == username)
        .order_by(Order.created_at.desc())
        .all()
    )


@app.get("/api/v1/orders/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    username = payload.get("sub")
    role = payload.get("role")

    if redis_client:
        try:
            cached = redis_client.get(f"order:{order_id}")
            if cached:
                order_data = json.loads(cached)
                if role != "admin" and order_data["username"] != username:
                    raise HTTPException(
                        status_code=403, detail="Accès non autorisé à cette commande"
                    )
                return order_data
        except HTTPException:
            raise
        except Exception:  # nosec B110 - fallback vers la BD si le cache Redis échoue
            pass

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if role != "admin" and order.username != username:
        raise HTTPException(
            status_code=403, detail="Accès non autorisé à cette commande"
        )

    return order


@app.get("/api/v1/orders", response_model=list[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db), payload: dict = Depends(require_role("admin"))
):
    logger.info("Admin %s demande toutes les commandes", payload.get("sub"))
    return db.query(Order).all()


# ── Stripe ─────────────────────────────────────────────────────────────────


class StripeItem(BaseModel):
    product_id: int
    name: str
    price: float  # display fallback only — never used to compute the charge
    quantity: int
    image_url: Optional[str] = None


class StripeCheckoutRequest(BaseModel):
    items: List[StripeItem]
    shipping_address: str
    payment_method: str = "card"


@app.post("/api/v1/orders/stripe/checkout")
def create_stripe_checkout(
    data: StripeCheckoutRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe non configuré")

    username = payload.get("sub", "guest")
    order_number = "GZ-" + str(int(__import__("time").time() * 1000))

    # Price integrity: re-fetch each product's real price/stock from
    # product-service instead of trusting item.price — otherwise a tampered
    # request could pay a fraction of the real cost via Stripe.
    verified = []
    total_price = 0.0
    for item in data.items:
        product = _fetch_product(item.product_id)
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product.get('name', item.name)}",
            )
        verified.append(
            {"product": product, "quantity": item.quantity, "image_url": item.image_url}
        )
        total_price += product["price"] * item.quantity

    new_order = Order(
        order_number=order_number,
        username=username,
        items_json=json.dumps([i.model_dump() for i in data.items]),
        total_price=total_price,
        payment_method="stripe",
        shipping_address=data.shipping_address,
        status="pending",
    )
    db.add(new_order)
    db.commit()

    line_items = []
    for v in verified:
        product = v["product"]
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": product["name"],
                        **(
                            {"images": [v["image_url"]]}
                            if v["image_url"] and v["image_url"].startswith("http")
                            else {}
                        ),
                    },
                    "unit_amount": max(50, int(product["price"])),
                },
                "quantity": v["quantity"],
            }
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=(
                f"{FRONTEND_URL}/order-success"
                f"?session_id={{CHECKOUT_SESSION_ID}}&order={order_number}"
            ),
            cancel_url=f"{FRONTEND_URL}/checkout",
            metadata={"order_number": order_number, "username": username},
        )
    except stripe.error.StripeError as e:
        logger.error(
            "Erreur Stripe pour commande %s: %s", order_number, e.user_message or str(e)
        )
        raise HTTPException(status_code=502, detail=e.user_message or "Erreur Stripe")

    logger.info("Stripe session créée: %s pour commande %s", session.id, order_number)
    return {
        "session_url": session.url,
        "session_id": session.id,
        "order_number": order_number,
    }


@app.get("/api/v1/orders/stripe/verify/{session_id}")
def verify_stripe_payment(
    session_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe non configuré")

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=e.user_message or "Erreur Stripe")
    order_number = session.metadata.get("order_number")

    if session.payment_status == "paid":
        order = db.query(Order).filter(Order.order_number == order_number).first()
        if order and order.status == "pending":
            order.status = "processing"
            db.commit()
            logger.info("Paiement confirmé pour commande %s", order_number)
        return {"paid": True, "order_number": order_number}

    return {"paid": False, "order_number": order_number}


@app.post("/api/v1/orders/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Signature invalide")

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        order_number = session_obj.get("metadata", {}).get("order_number")
        if order_number:
            order = db.query(Order).filter(Order.order_number == order_number).first()
            if order:
                order.status = "processing"
                db.commit()
                logger.info("Webhook: commande %s → processing", order_number)

    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
