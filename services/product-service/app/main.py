import logging
import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pythonjsonlogger import jsonlogger
from typing import Optional

from app.config import PORT, HOST, JWT_SECRET, JWT_ALGORITHM
from app.database import engine, Base, get_db, SessionLocal
from app.models import Product, Review
from app.schemas import ProductCreate, ProductResponse, ProductListResponse, ReviewCreate, ReviewResponse

DEFAULT_PRODUCTS = [
    # ── SMARTPHONES (6) ──────────────────────────────────────────────────────
    {"name": "iPhone 15 Pro Max",        "slug": "iphone-15-pro-max",        "description": "Apple flagship with A17 Pro chip, titanium build, and 48MP camera system.",          "price": 149999, "old_price": 164999, "stock": 45,  "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.9, "reviews": 312, "category": "smartphones", "category_name": "Smartphones"},
    {"name": "Samsung Galaxy S24 Ultra", "slug": "galaxy-s24-ultra",          "description": "Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 12GB RAM.",                       "price": 134999, "old_price": 149999, "stock": 30,  "image_url": "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.8, "reviews": 198, "category": "smartphones", "category_name": "Smartphones"},
    {"name": "Google Pixel 8 Pro",       "slug": "google-pixel-8-pro",        "description": "Pure Android with Tensor G3 chip, 50MP camera and 7 years of OS updates.",          "price": 89999,  "old_price": None,   "stock": 60,  "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",  "badge": "",     "featured": False, "rating": 4.7, "reviews": 145, "category": "smartphones", "category_name": "Smartphones"},
    {"name": "OnePlus 12 Pro",           "slug": "oneplus-12-pro",            "description": "Snapdragon 8 Gen 3, 100W SUPERVOOC charging, Hasselblad tuned triple camera.",       "price": 84999,  "old_price": 94999,  "stock": 40,  "image_url": "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.6, "reviews": 87,  "category": "smartphones", "category_name": "Smartphones"},
    {"name": "Xiaomi 14 Ultra",          "slug": "xiaomi-14-ultra",           "description": "Leica Summilux optics, 1-inch sensor, 90W HyperCharge, IP68.",                      "price": 104999, "old_price": None,   "stock": 25,  "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.8, "reviews": 63,  "category": "smartphones", "category_name": "Smartphones"},
    {"name": "iPhone 15 Standard",      "slug": "iphone-15",                 "description": "A16 Bionic, Dynamic Island, USB-C, 48MP main camera — the perfect everyday iPhone.", "price": 99999,  "old_price": 109999, "stock": 75,  "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.7, "reviews": 421, "category": "smartphones", "category_name": "Smartphones"},

    # ── LAPTOPS (6) ──────────────────────────────────────────────────────────
    {"name": "MacBook Air M3",           "slug": "macbook-air-m3",            "description": "Fanless design, up to 18hr battery, stunning Liquid Retina display.",               "price": 139999, "old_price": 154999, "stock": 20,  "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",  "badge": "SALE", "featured": True,  "rating": 4.9, "reviews": 423, "category": "laptops", "category_name": "Laptops"},
    {"name": "Dell XPS 15",              "slug": "dell-xps-15",               "description": "OLED touch display, Intel Core i9, 32GB DDR5, RTX 4060 GPU.",                     "price": 189999, "old_price": None,   "stock": 15,  "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.8, "reviews": 267, "category": "laptops", "category_name": "Laptops"},
    {"name": "ASUS ROG Zephyrus G14",    "slug": "asus-rog-zephyrus-g14",     "description": "AMD Ryzen 9, RTX 4090, 165Hz QHD panel — the ultimate gaming laptop.",            "price": 179999, "old_price": 189999, "stock": 10,  "image_url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.9, "reviews": 189, "category": "laptops", "category_name": "Laptops"},
    {"name": "Lenovo ThinkPad X1 Carbon","slug": "thinkpad-x1-carbon",        "description": "Ultra-light 1.12kg business flagship, Intel Core Ultra 7, 14hr battery, MIL-SPEC.", "price": 164999, "old_price": None,   "stock": 18,  "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",  "badge": "",     "featured": False, "rating": 4.7, "reviews": 134, "category": "laptops", "category_name": "Laptops"},
    {"name": "HP Spectre x360 14",       "slug": "hp-spectre-x360-14",        "description": "2-in-1 OLED touchscreen, Intel Core Ultra 5, 360° hinge, 17hr battery.",          "price": 154999, "old_price": 169999, "stock": 12,  "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",  "badge": "SALE", "featured": True,  "rating": 4.8, "reviews": 98,  "category": "laptops", "category_name": "Laptops"},
    {"name": "Microsoft Surface Pro 9",  "slug": "surface-pro-9",             "description": "Detachable 2-in-1 with Intel Core i7, 13in PixelSense display, LTE option.",      "price": 144999, "old_price": 159999, "stock": 22,  "image_url": "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.6, "reviews": 77,  "category": "laptops", "category_name": "Laptops"},

    # ── AUDIO (5) ────────────────────────────────────────────────────────────
    {"name": "Sony WH-1000XM5",          "slug": "sony-wh-1000xm5",          "description": "Industry-leading noise cancellation, 30hr battery, multipoint connection.",         "price": 34999,  "old_price": 39999,  "stock": 80,  "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.9, "reviews": 876, "category": "audio", "category_name": "Audio"},
    {"name": "Apple AirPods Pro 2",      "slug": "airpods-pro-2",             "description": "Adaptive Transparency, Personalized Spatial Audio, USB-C charging case.",          "price": 29999,  "old_price": None,   "stock": 100, "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",  "badge": "",     "featured": False, "rating": 4.7, "reviews": 654, "category": "audio", "category_name": "Audio"},
    {"name": "JBL Charge 5",             "slug": "jbl-charge-5",              "description": "IP67 waterproof portable speaker with 20hr playtime and integrated power bank.",   "price": 9999,   "old_price": 12999,  "stock": 50,  "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.6, "reviews": 321, "category": "audio", "category_name": "Audio"},
    {"name": "Bose QuietComfort 45",     "slug": "bose-qc45",                 "description": "Legendary Bose NC, 24hr battery, comfortable ear cups, Aware Mode.",               "price": 31999,  "old_price": 36999,  "stock": 60,  "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.8, "reviews": 543, "category": "audio", "category_name": "Audio"},
    {"name": "Sennheiser Momentum 4",    "slug": "sennheiser-momentum-4",     "description": "Audiophile-grade ANC headphones, 60hr battery, foldable design, aptX Adaptive.",  "price": 27999,  "old_price": None,   "stock": 35,  "image_url": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.7, "reviews": 189, "category": "audio", "category_name": "Audio"},

    # ── CAMERAS (4) ──────────────────────────────────────────────────────────
    {"name": "Sony A7 IV Mirrorless",    "slug": "sony-a7-iv",                "description": "33MP full-frame sensor, 4K 60fps video, advanced Real-Time AF system.",           "price": 249999, "old_price": None,   "stock": 8,   "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.9, "reviews": 143, "category": "cameras", "category_name": "Cameras"},
    {"name": "Canon EOS R6 Mark II",     "slug": "canon-eos-r6-mark-ii",      "description": "40fps burst, in-body stabilization, dual card slots, 4K HQ video.",               "price": 219999, "old_price": 234999, "stock": 12,  "image_url": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&q=80",  "badge": "",     "featured": False, "rating": 4.8, "reviews": 97,  "category": "cameras", "category_name": "Cameras"},
    {"name": "GoPro Hero 12 Black",      "slug": "gopro-hero-12-black",       "description": "5.3K60 video, HyperSmooth 6.0 stabilization, 27m waterproof, HDR video.",         "price": 44999,  "old_price": 49999,  "stock": 55,  "image_url": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.7, "reviews": 312, "category": "cameras", "category_name": "Cameras"},
    {"name": "DJI Mini 4 Pro",           "slug": "dji-mini-4-pro",            "description": "249g foldable drone, 4K HDR video, obstacle avoidance, 34min flight time.",       "price": 119999, "old_price": None,   "stock": 20,  "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.8, "reviews": 156, "category": "cameras", "category_name": "Cameras"},

    # ── WEARABLES (4) ────────────────────────────────────────────────────────
    {"name": "Apple Watch Ultra 2",      "slug": "apple-watch-ultra-2",       "description": "Titanium case, 60hr battery, dual-frequency GPS, ocean band.",                    "price": 89999,  "old_price": None,   "stock": 35,  "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.9, "reviews": 512, "category": "wearables", "category_name": "Wearables"},
    {"name": "Samsung Galaxy Watch 6",   "slug": "samsung-galaxy-watch-6",    "description": "Advanced health tracking, sapphire glass, BioActive sensor, Wear OS 4.",         "price": 29999,  "old_price": 34999,  "stock": 55,  "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.7, "reviews": 234, "category": "wearables", "category_name": "Wearables"},
    {"name": "Garmin Fenix 7 Pro",       "slug": "garmin-fenix-7-pro",        "description": "Multi-sport GPS watch, solar charging, 22-day battery, topographic maps.",       "price": 79999,  "old_price": None,   "stock": 18,  "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.8, "reviews": 201, "category": "wearables", "category_name": "Wearables"},
    {"name": "Fitbit Charge 6",          "slug": "fitbit-charge-6",           "description": "ECG app, Google Maps, YouTube Music control, 7-day battery.",                    "price": 14999,  "old_price": 18999,  "stock": 90,  "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.5, "reviews": 378, "category": "wearables", "category_name": "Wearables"},

    # ── ACCESSORIES (5) ──────────────────────────────────────────────────────
    {"name": "Anker 140W GaN Charger",   "slug": "anker-140w-gan-charger",    "description": "Three ports, PowerIQ 4.0, charges MacBook + iPhone + iPad simultaneously.",      "price": 4999,   "old_price": 6499,   "stock": 200, "image_url": "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.8, "reviews": 445, "category": "accessories", "category_name": "Accessories"},
    {"name": "Samsung 45W USB-C Cable",  "slug": "samsung-45w-usb-c-cable",   "description": "Premium braided 2m cable with 45W fast charging and 10Gbps data transfer.",     "price": 999,    "old_price": None,   "stock": 500, "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",  "badge": "",     "featured": False, "rating": 4.5, "reviews": 189, "category": "accessories", "category_name": "Accessories"},
    {"name": "Logitech MX Master 3S",    "slug": "logitech-mx-master-3s",     "description": "8000 DPI quiet click mouse, MagSpeed wheel, USB-C, multi-device Bolt receiver.", "price": 8999,   "old_price": 10999,  "stock": 120, "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.9, "reviews": 732, "category": "accessories", "category_name": "Accessories"},
    {"name": "Keychron K2 Pro",          "slug": "keychron-k2-pro",           "description": "75% QMK/VIA mechanical keyboard, hot-swap, Bluetooth 5.1, RGB backlight.",       "price": 7999,   "old_price": None,   "stock": 85,  "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.8, "reviews": 267, "category": "accessories", "category_name": "Accessories"},
    {"name": "Elgato Key Light Air",     "slug": "elgato-key-light-air",      "description": "45W LED panel, 2800K-7000K, Wi-Fi control via app, ideal for streaming.",        "price": 6499,   "old_price": 7999,   "stock": 60,  "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.6, "reviews": 154, "category": "accessories", "category_name": "Accessories"},

    # ── TABLETS (4) — Nouvelle catégorie ─────────────────────────────────────
    {"name": "iPad Pro M4 13-inch",      "slug": "ipad-pro-m4-13",            "description": "M4 chip, Ultra Retina XDR OLED, 2TB storage option, Apple Pencil Pro support.",  "price": 159999, "old_price": None,   "stock": 25,  "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",  "badge": "NEW",  "featured": True,  "rating": 4.9, "reviews": 234, "category": "tablets", "category_name": "Tablets"},
    {"name": "Samsung Galaxy Tab S9 Ultra","slug": "galaxy-tab-s9-ultra",     "description": "14.6in AMOLED, S Pen included, Snapdragon 8 Gen 2, DeX mode, IP68.",            "price": 129999, "old_price": 144999, "stock": 18,  "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80",  "badge": "SALE", "featured": True,  "rating": 4.8, "reviews": 187, "category": "tablets", "category_name": "Tablets"},
    {"name": "iPad Air M2",              "slug": "ipad-air-m2",               "description": "M2 chip, 11in Liquid Retina, USB-C, Apple Pencil 2 support, 5G option.",         "price": 94999,  "old_price": 104999, "stock": 40,  "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",  "badge": "SALE", "featured": False, "rating": 4.7, "reviews": 312, "category": "tablets", "category_name": "Tablets"},
    {"name": "OnePlus Pad 2",            "slug": "oneplus-pad-2",             "description": "Snapdragon 8 Gen 3, 12.1in 3K 144Hz display, 67W SUPERVOOC, 9510mAh.",          "price": 54999,  "old_price": None,   "stock": 30,  "image_url": "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.6, "reviews": 89,  "category": "tablets", "category_name": "Tablets"},

    # ── GAMING (4) — Nouvelle catégorie ──────────────────────────────────────
    {"name": "PS5 DualSense Controller", "slug": "ps5-dualsense",             "description": "Haptic feedback, adaptive triggers, built-in mic, USB-C, 12hr battery.",         "price": 8999,   "old_price": 10999,  "stock": 150, "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",  "badge": "HOT",  "featured": True,  "rating": 4.8, "reviews": 1243,"category": "gaming", "category_name": "Gaming"},
    {"name": "Xbox Elite Controller S2", "slug": "xbox-elite-controller-s2",  "description": "Swappable components, adjustable tension sticks, rubberized grip, 40hr battery.","price": 14999,  "old_price": None,   "stock": 45,  "image_url": "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=600&q=80",  "badge": "NEW",  "featured": False, "rating": 4.7, "reviews": 567, "category": "gaming", "category_name": "Gaming"},
    {"name": "Logitech G Pro X Superlight 2","slug": "gpro-x-superlight-2",   "description": "60g ultra-lightweight gaming mouse, HERO 2 25K sensor, 95hr battery.",           "price": 11999,  "old_price": 13999,  "stock": 70,  "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",  "badge": "SALE", "featured": True,  "rating": 4.9, "reviews": 445, "category": "gaming", "category_name": "Gaming"},
    {"name": "SteelSeries Arctis Nova Pro","slug": "arctis-nova-pro",          "description": "Hi-Res audio, active noise cancellation, hot-swap battery, multi-system.",       "price": 24999,  "old_price": 28999,  "stock": 40,  "image_url": "https://images.unsplash.com/photo-1599669454699-248893623440?w=600&q=80",  "badge": "HOT",  "featured": False, "rating": 4.8, "reviews": 289, "category": "gaming", "category_name": "Gaming"},
]

log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
log_handler.setFormatter(formatter)
logger = logging.getLogger("product-service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Product Service",
    description="Microservice pour la gestion du catalogue des produits",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

product_views = Counter(
    "product_views_total",
    "Product detail page views",
    ["product_id", "category"],
)

security_agent = HTTPBearer()


@app.on_event("startup")
def seed_default_products():
    db = SessionLocal()
    try:
        existing_slugs = {
            row[0]
            for row in db.query(Product.slug)
            .filter(Product.slug.in_([p["slug"] for p in DEFAULT_PRODUCTS]))
            .all()
        }

        missing = [
            Product(**p)
            for p in DEFAULT_PRODUCTS
            if p["slug"] not in existing_slugs
        ]

        if missing:
            db.add_all(missing)
            db.commit()
            logger.info("Seed produits terminé: %s produits insérés", len(missing))
    finally:
        db.close()


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

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(security_agent)) -> dict:
    return decode_access_token(credentials.credentials)

def require_role(required_role: str):
    def dependency(payload: dict = Depends(get_current_user_payload)) -> dict:
        if payload.get("role") != required_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissions insuffisantes")
        return payload
    return dependency


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "product-service"}

@app.get("/api/v1/products", response_model=ProductListResponse)
def get_products(
    q:         Optional[str]   = Query(None, description="Recherche par nom ou description"),
    category:  Optional[str]   = Query(None, description="Filtrer par catégorie"),
    min_price: Optional[float] = Query(None, ge=0, description="Prix minimum"),
    max_price: Optional[float] = Query(None, ge=0, description="Prix maximum"),
    badge:     Optional[str]   = Query(None, description="Filtrer par badge: NEW, HOT, SALE"),
    in_stock:  Optional[bool]  = Query(None, description="Seulement les produits en stock"),
    featured:  Optional[bool]  = Query(None, description="Seulement les produits vedettes"),
    sort:      str             = Query("newest", description="Tri: newest, price_asc, price_desc, rating, popular"),
    page:      int             = Query(1, ge=1, description="Numéro de page"),
    per_page:  int             = Query(12, ge=1, le=100, description="Produits par page"),
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if q:
        term = f"%{q.lower()}%"
        query = query.filter(
            func.lower(Product.name).like(term) |
            func.lower(Product.description).like(term)
        )
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if badge:
        query = query.filter(Product.badge == badge.upper())
    if in_stock is True:
        query = query.filter(Product.stock > 0)
    if featured is not None:
        query = query.filter(Product.featured == featured)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "popular":
        query = query.order_by(Product.reviews.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {"items": items, "total": total, "page": page, "per_page": per_page, "total_pages": total_pages}

@app.get("/api/v1/products/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    product_views.labels(product_id=str(product.id), category=product.category or "unknown").inc()
    return product

@app.get("/api/v1/products/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    product_views.labels(product_id=str(product_id), category=product.category or "unknown").inc()
    return product

@app.post("/api/v1/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_role("admin"))
):
    if db.query(Product).filter(Product.name == product_data.name).first():
        raise HTTPException(status_code=400, detail="Un produit avec ce nom existe déjà")

    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    logger.info("Produit créé: %s (ID: %s)", new_product.name, new_product.id)
    return new_product


# ── Reviews ────────────────────────────────────────────────────────────────

@app.get("/api/v1/products/{product_id}/reviews", response_model=list[ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()


@app.post("/api/v1/products/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    sub = str(payload.get("user_id") or payload.get("sub") or "")
    username = payload.get("username") or sub or "Utilisateur"
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        user_id = abs(hash(sub)) % (10 ** 9)

    if db.query(Review).filter(Review.product_id == product_id, Review.username == username).first():
        raise HTTPException(status_code=400, detail="Vous avez déjà noté ce produit")

    review = Review(product_id=product_id, user_id=user_id, username=username,
                    rating=review_data.rating, comment=review_data.comment)
    db.add(review)
    db.flush()

    all_ratings = db.query(Review.rating).filter(Review.product_id == product_id).all()
    product.rating = round(sum(r[0] for r in all_ratings) / len(all_ratings), 1)
    product.reviews = len(all_ratings)

    db.commit()
    db.refresh(review)
    logger.info("Review créé: produit=%s note=%s user=%s", product_id, review_data.rating, username)
    return review


@app.delete("/api/v1/products/{product_id}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    product_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    review = db.query(Review).filter(Review.id == review_id, Review.product_id == product_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")

    sub = str(payload.get("user_id") or payload.get("sub") or "")
    role = payload.get("role", "")
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        user_id = abs(hash(sub)) % (10 ** 9)
    if review.user_id != user_id and role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Non autorisé")

    db.delete(review)
    db.flush()

    remaining = db.query(Review.rating).filter(Review.product_id == product_id).all()
    product = db.query(Product).filter(Product.id == product_id).first()
    if remaining:
        product.rating = round(sum(r[0] for r in remaining) / len(remaining), 1)
        product.reviews = len(remaining)
    else:
        product.rating = 0.0
        product.reviews = 0

    db.commit()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
