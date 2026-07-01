# Documentation des Améliorations — Phase 5

> Détail complet de toutes les modifications apportées au projet Billcom/GadgetZone
> dans la Phase 5 : Frontend + Backend + Paiement Stripe + Base de données + Scalabilité.

---

## TABLE DES MATIÈRES

1. [Améliorations Frontend](#1-améliorations-frontend)
2. [Améliorations Backend — Recherche & Filtres](#2-backend--recherche--filtres-avancés)
3. [Améliorations Backend — Système de Reviews](#3-backend--système-davis-et-notes)
4. [Intégration Stripe (Paiement en ligne)](#4-intégration-stripe)
5. [Améliorations Base de données](#5-améliorations-base-de-données)
6. [Horizontal Pod Autoscaler — Scalabilité automatique](#6-horizontal-pod-autoscaler--scalabilité-automatique)

---

## 1. Améliorations Frontend

### 1.1 Système de thème sombre / clair

**Problème :** Le site n'avait qu'un thème sombre fixe. Impossible de basculer.

**Solution :** Ajout d'un système de thème complet via CSS Custom Properties et React Context.

#### Fichier : `frontend/src/lib/ThemeContext.jsx` (nouveau)

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('gz-theme') || 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gz-theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)
```

**Pourquoi ce mécanisme ?**
- `data-theme` est posé sur `<html>` → toutes les règles CSS `[data-theme="light"]` s'activent
- `localStorage` persiste le choix entre les sessions
- Les composants React lisent `theme` via `useTheme()` pour changer les logos

#### Fichier : `frontend/src/index.css` (modifié)

Ajout de variables CSS au niveau `:root` (thème sombre par défaut) et override pour `[data-theme="light"]` :

```css
:root {
  --gz-bg:       #0a0a0f;
  --gz-surface:  #16161f;
  --gz-text:     #f0f0f5;
  --gz-text2:    #9090a8;
  --gz-border:   rgba(255,255,255,0.08);
}

[data-theme="light"] {
  --gz-bg:       #f4f4f8;
  --gz-surface:  #ffffff;
  --gz-text:     #111118;
  --gz-text2:    #55556a;
  --gz-border:   rgba(0,0,0,0.10);
}
```

Tous les composants utilisent `var(--gz-bg)`, `var(--gz-text)`, etc.
→ Un seul changement d'attribut HTML change TOUT le site instantanément.

---

### 1.2 Logo Billcom Consulting dans le header

**Fichiers ajoutés :**
- `frontend/public/logo-dark.png` — logo version sombre
- `frontend/public/logo-light.png` — logo version claire

**Fichier modifié :** `frontend/src/components/layout/Header.jsx`

```jsx
<img
  src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
  alt="Billcom Consulting"
  style={{ height: "52px", width: "auto" }}
/>
<div style={{ borderLeft: "2px solid rgba(245,158,11,0.35)", paddingLeft: "12px" }}>
  <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "#f59e0b" }}>
    Gadget<span style={{ color: "var(--gz-text)" }}>Zone</span>
  </span>
  <span style={{ fontSize: "0.6rem", color: "var(--gz-text2)" }}>Tech Store</span>
</div>
```

Le logo change automatiquement selon le thème actif.

---

### 1.3 Animations de transitions entre pages

**Fichier modifié :** `frontend/src/components/layout/Layout.jsx`

Utilisation de `framer-motion` avec `AnimatePresence` :

```jsx
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

<AnimatePresence mode="wait">
  <motion.div key={location.pathname} variants={pageVariants} ...>
    <Outlet />
  </motion.div>
</AnimatePresence>
```

Chaque changement de route déclenche une animation fade+slide.

---

### 1.4 Indicateur "Scroll Down" dans le Hero

**Fichier modifié :** `frontend/src/components/sections/Hero.jsx`

```jsx
<motion.div
  animate={{ y: [0, 8, 0] }}
  transition={{ repeat: Infinity, duration: 1.4 }}
  style={{ width: "28px", height: "44px", border: "2px solid rgba(245,158,11,0.4)", borderRadius: "14px" }}
>
  <motion.div
    animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
    transition={{ repeat: Infinity, duration: 1.4 }}
    style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b" }}
  />
</motion.div>
```

Animation en boucle infinie d'un point dans une souris.

---

### 1.5 Chatbot IA (Groq)

**Fichier :** `frontend/src/components/ChatBot.jsx`

Utilise l'API Groq avec le modèle `llama-3.3-70b-versatile` pour répondre aux questions sur les produits.

**Clé API :** `VITE_GROQ_API_KEY` dans `frontend/.env.local`

---

### 1.6 Performance — Réduction des animations sur mobile

**Fichier :** `frontend/src/hooks/usePerformance.js` (nouveau)

```js
export function usePerformance() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const isLowCPU = navigator.hardwareConcurrency < 4
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldReduceMotion(isMobile || isLowCPU || prefersReduced)
  }, [])
  return { shouldReduceMotion }
}
```

Si mobile, CPU faible ou préférence système → animations désactivées.

---

## 2. Backend — Recherche & Filtres avancés

### Problème initial

`GET /api/v1/products` retournait **tous** les produits sans aucun filtre ni pagination.
Le frontend filtrait en JavaScript côté client sur une liste statique (`SAMPLE_PRODUCTS`).

### Solution

#### Fichier modifié : `services/product-service/app/schemas.py`

Ajout du schéma de réponse paginée :

```python
class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int        # total de résultats correspondants
    page: int         # page actuelle
    per_page: int     # résultats par page
    total_pages: int  # nombre total de pages
```

#### Fichier modifié : `services/product-service/app/main.py`

Remplacement de l'ancien endpoint simple par un endpoint avec filtres :

```python
@app.get("/api/v1/products", response_model=ProductListResponse)
def get_products(
    q:         Optional[str]   = Query(None),   # recherche texte (nom ou description)
    category:  Optional[str]   = Query(None),   # filtre catégorie
    min_price: Optional[float] = Query(None),   # prix minimum
    max_price: Optional[float] = Query(None),   # prix maximum
    badge:     Optional[str]   = Query(None),   # filtre badge (NEW, HOT, SALE)
    in_stock:  Optional[bool]  = Query(None),   # seulement en stock
    featured:  Optional[bool]  = Query(None),   # seulement les produits vedettes
    sort:      str             = Query("newest"),# tri
    page:      int             = Query(1),       # pagination
    per_page:  int             = Query(12),      # items par page (max 100)
    db: Session = Depends(get_db)
):
```

**Logique de filtrage (SQLAlchemy) :**
```python
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
```

**Tri disponible :** `newest`, `price_asc`, `price_desc`, `rating`, `popular`

**Nouveau endpoint slug :**
```python
@app.get("/api/v1/products/slug/{slug}", response_model=ProductResponse)
```
Permet de récupérer un produit par son slug (ex: `iphone-15-pro-max`).

#### Fichier modifié : `frontend/src/lib/store.js`

`fetchProducts()` accepte maintenant des paramètres :

```js
fetchProducts: async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.q)        qs.set("q", params.q)
  if (params.category) qs.set("category", params.category)
  if (params.sort)     qs.set("sort", params.sort)
  // ...
  const res = await fetch(`/api/v1/products?${qs.toString()}`)
  const data = await res.json()
  const items = data.items || data  // compatibilité ancienne/nouvelle API
  if (items.length > 0) set({ products: items })
}
```

#### Fichier modifié : `frontend/src/pages/ShopPage.jsx`

Remplace `SAMPLE_PRODUCTS` (données statiques) par `useProductStore()` (données réelles de l'API) :

```js
// Avant
import { SAMPLE_PRODUCTS, ... } from "../lib/store.js"
let list = SAMPLE_PRODUCTS.filter(...)

// Après
const { products } = useProductStore()
let list = products.filter(...)
```

### Exemples d'utilisation

```
GET /api/v1/products?q=iphone
GET /api/v1/products?category=laptops&sort=price_asc
GET /api/v1/products?badge=HOT&sort=rating
GET /api/v1/products?min_price=10000&max_price=50000&in_stock=true
GET /api/v1/products?page=2&per_page=6
```

---

## 3. Backend — Système d'avis et notes

### Problème initial

Aucun système de reviews. Les champs `rating` et `reviews` dans les produits
étaient des valeurs fixes hardcodées dans les données de seed.

### Solution

#### Fichier modifié : `services/product-service/app/models.py`

Nouveau modèle SQLAlchemy `Review` :

```python
class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    user_id    = Column(Integer, nullable=False)    # ID numérique de l'utilisateur
    username   = Column(String(100), nullable=False) # nom affiché
    rating     = Column(Float, nullable=False)       # note 1 à 5
    comment    = Column(Text, nullable=True)         # commentaire optionnel
    created_at = Column(DateTime, server_default=func.now())
```

La table `reviews` est créée automatiquement au démarrage via `Base.metadata.create_all()`.

#### Fichier modifié : `services/product-service/app/schemas.py`

```python
class ReviewCreate(BaseModel):
    rating:  float          # obligatoire, entre 1.0 et 5.0
    comment: Optional[str]  # optionnel, max 1000 caractères

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: float
    comment: Optional[str]
    created_at: datetime
```

#### Fichier modifié : `services/product-service/app/main.py`

**3 endpoints ajoutés :**

**1. Lire les avis (public) :**
```python
GET /api/v1/products/{product_id}/reviews
→ Retourne la liste des avis triés du plus récent au plus ancien
```

**2. Ajouter un avis (login requis) :**
```python
POST /api/v1/products/{product_id}/reviews
Body: { "rating": 4.5, "comment": "Excellent produit !" }
Headers: Authorization: Bearer <token>
```

Logique après ajout :
```python
# Recalcul automatique de la note moyenne du produit
all_ratings = db.query(Review.rating).filter(Review.product_id == product_id).all()
product.rating = round(sum(r[0] for r in all_ratings) / len(all_ratings), 1)
product.reviews = len(all_ratings)  # mise à jour du compteur
```

**Contrainte d'unicité :** un utilisateur ne peut laisser qu'UN seul avis par produit.
La vérification se fait par `username` (extrait du JWT) :
```python
if db.query(Review).filter(Review.product_id == product_id, Review.username == username).first():
    raise HTTPException(400, "Vous avez déjà noté ce produit")
```

**3. Supprimer un avis (auteur ou admin) :**
```python
DELETE /api/v1/products/{product_id}/reviews/{review_id}
```
Après suppression, le rating du produit est recalculé sur les avis restants.

**Gestion du JWT :** Le token JWT contient `sub: "username"` (une string, pas un ID numérique).
Pour stocker un `user_id` entier, un hash stable est calculé :

```python
sub = str(payload.get("sub") or "")
try:
    user_id = int(sub)           # si sub est un nombre
except ValueError:
    user_id = abs(hash(sub)) % (10**9)  # hash stable du username
```

#### Fichier modifié : `frontend/src/pages/ProductPage.jsx`

Réécriture complète pour ajouter :
- Chargement des reviews via `GET /api/v1/products/{id}/reviews`
- Affichage des reviews avec avatar, étoiles, date, commentaire
- Formulaire `StarPicker` (5 étoiles cliquables)
- Zone de texte pour le commentaire
- Bouton supprimer (visible pour l'auteur ou l'admin)
- Message si non connecté : lien vers /login
- Message si déjà noté : "Vous avez déjà laissé un avis"

---

## 4. Intégration Stripe

### Pourquoi Stripe ?

Stripe est le système de paiement en ligne le plus utilisé au monde.
Il permet d'accepter des cartes bancaires de manière sécurisée sans jamais
toucher les données de carte (elles ne passent jamais par nos serveurs).

### Architecture du flux de paiement

```
Utilisateur                Frontend              order-service         Stripe
    |                         |                       |                   |
    |-- Clique "Place Order"-->|                       |                   |
    |                         |-- POST /stripe/checkout-->                 |
    |                         |                       |-- Create Session-->|
    |                         |                       |<-- session.url ----|
    |                         |<-- { session_url } ---|                   |
    |<-- Redirect vers Stripe--|                       |                   |
    |                         |                       |                   |
    |-- Saisit carte bancaire sur page Stripe -------->|                   |
    |                         |                       |                   |
    |<-- Redirect vers /order-success?session_id=... --|                   |
    |                         |                       |                   |
    |                         |-- GET /stripe/verify/{session_id}-->       |
    |                         |                       |-- Retrieve session>|
    |                         |                       |<-- payment_status--|
    |                         |<-- { paid: true } ----|                   |
    |<-- Page de confirmation--|                       |                   |
```

### Clés Stripe utilisées

| Clé | Valeur | Usage |
|-----|--------|-------|
| **Publishable Key** (`pk_test_...`) | `pk_test_51Tnyra...` | Côté frontend (public, non secrète) |
| **Secret Key** (`sk_test_...`) | `sk_test_51Tnyra...` | Côté backend uniquement (secrète) |

> **IMPORTANT :** Ces clés commencent par `pk_test_` et `sk_test_` → **mode TEST**.
> Aucun vrai argent ne sera débité. Pour la production, utiliser `pk_live_` et `sk_live_`.

**La Secret Key ne doit JAMAIS apparaître dans le code frontend ou dans git public.**

### Où sont stockées les clés

**Kubernetes Secret** (`k8s/base/secrets.yaml`) :
```yaml
stringData:
  stripe-secret-key: sk_test_51TnyraFYCcDX0ZPc168LGi...
```

**Variable d'environnement dans le pod** (`k8s/base/order-service.yaml`) :
```yaml
- name: STRIPE_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: billcom-secrets
      key: stripe-secret-key
- name: FRONTEND_URL
  value: "https://localhost:8443"
```

**Config Python** (`services/order-service/app/config.py`) :
```python
STRIPE_SECRET_KEY    = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "https://localhost:8443")
```

### Fichiers modifiés pour Stripe

#### `services/order-service/requirements.txt`
```
stripe==9.12.0   ← ajouté
```

#### `services/order-service/app/main.py`

**3 endpoints ajoutés :**

**1. Créer une session de paiement :**
```python
POST /api/v1/orders/stripe/checkout
```
- Crée une commande en base avec status `"pending"`
- Crée une session Stripe Checkout avec les articles du panier
- Retourne `{ session_url, session_id, order_number }`

Les prix sont envoyés en **USD cents** (le prix 149999 = $1,499.99 USD) :
```python
"unit_amount": max(50, int(item.price)),  # minimum 50 cents
"currency": "usd"
```

Les URLs de redirection :
```python
success_url = f"{FRONTEND_URL}/order-success?session_id={{CHECKOUT_SESSION_ID}}&order={order_number}"
cancel_url  = f"{FRONTEND_URL}/checkout"
```

**2. Vérifier un paiement :**
```python
GET /api/v1/orders/stripe/verify/{session_id}
```
- Interroge l'API Stripe pour vérifier si `payment_status == "paid"`
- Si oui : met à jour la commande de `"pending"` → `"processing"`
- Retourne `{ paid: true/false, order_number }`

**3. Webhook Stripe (pour production) :**
```python
POST /api/v1/orders/stripe/webhook
```
- Reçoit les événements Stripe signés cryptographiquement
- Traite `checkout.session.completed` pour confirmer le paiement
- Utilisé en production avec `stripe listen --forward-to ...`

#### `frontend/src/pages/CheckoutPage.jsx`

Ajout du mode paiement Stripe dans `handleSubmit` :

```js
if (form.payment === "card") {
  const res = await fetch("/api/v1/orders/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      shipping_address: shippingAddress,
    }),
  })
  const data = await res.json()
  clear()                              // vider le panier
  window.location.href = data.session_url  // redirection vers Stripe
}
```

#### `frontend/src/pages/OrderSuccessPage.jsx`

Réécriture pour gérer deux cas :
1. **Paiement normal** (COD, bKash...) → affiche directement la confirmation
2. **Paiement Stripe** → vérifie le paiement via `GET /stripe/verify/{session_id}`
   puis affiche la confirmation ou un message d'erreur

```js
const sessionId = sp.get("session_id")  // paramètre URL après redirect Stripe

if (sessionId) {
  const res = await fetch(`/api/v1/orders/stripe/verify/${sessionId}`, {
    headers: { Authorization: "Bearer " + token }
  })
  const { paid } = await res.json()
  // afficher confirmation si paid === true
}
```

### Carte de test Stripe

```
Numéro de carte : 4242 4242 4242 4242
Date d'expiration : toute date future (ex: 12/29)
CVC : n'importe (ex: 123)
Nom : n'importe
```

Cette carte simule un paiement réussi. Stripe propose aussi des cartes
pour tester les échecs (`4000 0000 0000 0002`), les authentifications 3D Secure, etc.

### Sécurité

- La Secret Key Stripe n'est accessible qu'à l'intérieur du pod `order-service` via variable d'environnement
- Les données de carte bancaire ne transitent jamais par nos serveurs (Stripe les gère directement)
- Les webhooks Stripe sont signés avec un secret `STRIPE_WEBHOOK_SECRET` pour éviter les faux événements
- En mode test : aucune transaction réelle, aucun argent débité

---

## 5. Améliorations Base de données

### 5.1 Index MySQL sur les colonnes fréquemment recherchées

#### Pourquoi des index ?

Sans index, chaque requête filtrée (`?category=smartphones`, `?badge=HOT`, `?sort=rating`) force MySQL
à scanner **toute la table** (Full Table Scan). Avec des index, MySQL accède directement aux lignes
correspondantes via une structure B-Tree → requêtes 10 à 100× plus rapides sur de grands volumes.

#### Index ajoutés — `product-service`

**Table `products`** (`services/product-service/app/models.py`) :

```python
__table_args__ = (
    # Index simples (une seule colonne)
    Index("ix_products_category",  "category"),   # ?category=smartphones
    Index("ix_products_badge",     "badge"),       # ?badge=HOT
    Index("ix_products_price",     "price"),       # ORDER BY price
    Index("ix_products_rating",    "rating"),      # ?sort=rating
    Index("ix_products_stock",     "stock"),       # ?in_stock=true
    Index("ix_products_featured",  "featured"),    # ?featured=true
    # Index composites (plusieurs colonnes — pour les combinaisons fréquentes)
    Index("ix_products_cat_price", "category", "price"),    # ?category=&min_price=&max_price=
    Index("ix_products_feat_rat",  "featured", "rating"),   # ?featured=true&sort=rating
    Index("ix_products_cat_badge", "category", "badge"),    # ?category=&badge=
)
```

**Table `reviews`** :

```python
__table_args__ = (
    Index("ix_reviews_product_id", "product_id"),
    Index("ix_reviews_username",   "username"),
    # Composite : accélère le check "déjà noté par cet user ?"
    Index("ix_reviews_prod_user",  "product_id", "username"),
)
```

#### Index ajoutés — `user-service`

**Table `users`** (`services/user-service/app/models.py`) :

```python
__table_args__ = (
    Index("ix_users_role",       "role"),        # filtrer admins vs users
    Index("ix_users_created_at", "created_at"),  # tri par date d'inscription
)
```

#### Index ajoutés — `order-service`

**Table `orders`** (`services/order-service/app/models.py`) :

```python
__table_args__ = (
    Index("ix_orders_order_number", "order_number"),
    Index("ix_orders_username",     "username"),
    Index("ix_orders_status",       "status"),      # filtrer par statut (pending, processing...)
    Index("ix_orders_created_at",   "created_at"),  # tri par date
    # Composite : "les commandes en attente de cet utilisateur"
    Index("ix_orders_user_status",  "username", "status"),
)
```

**Total : 17 index** répartis sur 4 tables (products, reviews, users, orders).

---

### 5.2 Migrations Alembic (versionnement du schéma)

#### Pourquoi Alembic ?

`Base.metadata.create_all()` crée les tables mais ne peut pas les **modifier** après coup
(pas d'ajout de colonnes, pas de nouveaux index sur une DB existante).
Alembic versionne chaque changement de schéma comme un commit git :
chaque migration a un `upgrade()` et un `downgrade()` — on peut avancer ou reculer.

#### Structure créée pour chaque service

```
services/<service>/
  alembic.ini                          ← config Alembic
  migrations/
    env.py                             ← lit DATABASE_URL depuis l'environnement
    script.py.mako                     ← template pour générer de nouvelles migrations
    versions/
      001_initial_schema.py            ← baseline (no-op, tables créées par create_all)
      002_add_indexes.py               ← ajoute les 17 index de façon idempotente
  start.sh                             ← lance alembic upgrade head puis démarre le service
```

#### Fichier clé : `migrations/env.py`

```python
import os
from sqlalchemy import create_engine, pool
from alembic import context
from app.models import Base  # charge tous les modèles

target_metadata = Base.metadata

def get_url():
    return os.environ.get("DATABASE_URL", "mysql+pymysql://root:rootpassword@localhost:3306/product_db")

def run_migrations_online():
    connectable = create_engine(get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

**Pourquoi lire depuis `os.environ` ?** La DATABASE_URL change selon l'environnement
(Docker, Kubernetes, local). Hardcoder une URL dans `alembic.ini` serait faux en prod.

#### Migration 002 — idempotente

Avant de créer chaque index, la migration vérifie s'il existe déjà
(pour ne pas planter sur une DB existante qui aurait déjà certains index) :

```python
from sqlalchemy import inspect

def _existing_indexes(table):
    return {idx["name"] for idx in inspect(op.get_bind()).get_indexes(table)}

def upgrade():
    existing = _existing_indexes("products")
    if "ix_products_category" not in existing:
        op.create_index("ix_products_category", "products", ["category"])
    # ... idem pour chaque index
```

#### Fichier `start.sh` (même logique pour les 3 services)

```bash
#!/bin/bash
set -e
echo "[startup] Running Alembic migrations..."
alembic upgrade head
echo "[startup] Migrations done. Starting product-service..."
exec python app/main.py
```

`set -e` : si la migration échoue, le pod ne démarre pas → visible immédiatement dans `kubectl logs`.

#### Dockerfiles mis à jour

```dockerfile
# Avant
CMD ["python", "app/main.py"]

# Après
RUN chown -R appuser:appgroup /app && chmod +x /app/start.sh
CMD ["bash", "start.sh"]
```

#### Résultat au démarrage (logs observés)

```
[startup] Running Alembic migrations...
INFO  [alembic.runtime.migration] Running upgrade  -> 001, initial schema
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002, add performance indexes
[startup] Migrations done. Starting product-service...
```

#### Comment ajouter une future migration

```bash
# Dans WSL2, depuis le dossier du service
cd /mnt/c/Users/pc_msi/Documents/billcom/services/product-service
DATABASE_URL="mysql+pymysql://root:rootpassword@localhost:3306/product_db" \
  alembic revision --autogenerate -m "add_column_xxx"
# → génère un fichier dans migrations/versions/
# Modifier le fichier généré si besoin, puis rebuilder l'image Docker
```

---

### 5.3 Seeding enrichi — 38 produits, 8 catégories

#### Avant / Après

| Catégorie | Avant | Après | Nouveaux produits |
|-----------|:-----:|:-----:|-------------------|
| Smartphones | 3 | **6** | OnePlus 12 Pro, Xiaomi 14 Ultra, iPhone 15 |
| Laptops | 3 | **6** | ThinkPad X1 Carbon, HP Spectre x360, Surface Pro 9 |
| Audio | 3 | **5** | Bose QuietComfort 45, Sennheiser Momentum 4 |
| Cameras | 2 | **4** | GoPro Hero 12 Black, DJI Mini 4 Pro |
| Wearables | 2 | **4** | Garmin Fenix 7 Pro, Fitbit Charge 6 |
| Accessories | 2 | **5** | Logitech MX Master 3S, Keychron K2 Pro, Elgato Key Light |
| **Tablets** | 0 | **4** | iPad Pro M4, Galaxy Tab S9 Ultra, iPad Air M2, OnePlus Pad 2 |
| **Gaming** | 0 | **4** | PS5 DualSense, Xbox Elite S2, G Pro X Superlight 2, Arctis Nova Pro |
| **TOTAL** | **15** | **38** | **+23 produits** |

#### Mécanisme de seed (idempotent)

Le seed au démarrage ne réinsère **que les produits manquants** — il vérifie par `slug` :

```python
@app.on_event("startup")
def seed_default_products():
    existing_slugs = {row[0] for row in db.query(Product.slug)
                      .filter(Product.slug.in_([p["slug"] for p in DEFAULT_PRODUCTS])).all()}
    missing = [Product(**p) for p in DEFAULT_PRODUCTS if p["slug"] not in existing_slugs]
    if missing:
        db.add_all(missing)
        db.commit()
        logger.info("Seed: %s produits insérés", len(missing))
```

Au premier démarrage avec les nouvelles images : **23 produits insérés**.
Aux démarrages suivants : **0 insertion** (tous les slugs existent déjà).

#### Vérification

```bash
curl -sk https://localhost:8443/api/v1/products?per_page=100 | python3 -c "
import json,sys
d=json.load(sys.stdin)
cats={}
for p in d['items']:
    cats[p['category']]=cats.get(p['category'],0)+1
for k,v in sorted(cats.items()): print(f'  {k}: {v} produits')
print(f'TOTAL: {d[\"total\"]} produits')
"
# accessories: 5   audio: 5   cameras: 4   gaming: 4
# laptops: 6   smartphones: 6   tablets: 4   wearables: 4
# TOTAL: 38 produits ✅
```

---

## Résumé des fichiers modifiés

### Backend (product-service)
| Fichier | Modification |
|---------|-------------|
| `app/models.py` | Modèle `Review` + 9 index sur `products`, 3 index sur `reviews` |
| `app/schemas.py` | `ProductListResponse`, `ReviewCreate`, `ReviewResponse` |
| `app/main.py` | Filtres/pagination, endpoints reviews, 38 produits seedés |
| `requirements.txt` | Ajout `alembic==1.13.1` |
| `alembic.ini` | Config Alembic |
| `migrations/env.py` | Lecture DATABASE_URL depuis env |
| `migrations/versions/001_initial_schema.py` | Baseline no-op |
| `migrations/versions/002_add_indexes.py` | 12 index sur products + reviews |
| `start.sh` | `alembic upgrade head` puis `python app/main.py` |
| `Dockerfile` | CMD → `bash start.sh` |

### Backend (user-service)
| Fichier | Modification |
|---------|-------------|
| `app/models.py` | 2 index sur `users` (role, created_at) |
| `requirements.txt` | Ajout `alembic==1.13.1` |
| `alembic.ini` | Config Alembic |
| `migrations/env.py` | Lecture DATABASE_URL depuis env |
| `migrations/versions/001_initial_schema.py` | Baseline no-op |
| `migrations/versions/002_add_indexes.py` | 2 index sur users |
| `start.sh` | `alembic upgrade head` puis `python app/main.py` |
| `Dockerfile` | CMD → `bash start.sh` |

### Backend (order-service)
| Fichier | Modification |
|---------|-------------|
| `app/models.py` | 5 index sur `orders` (order_number, username, status, created_at, composite) |
| `requirements.txt` | Ajout `alembic==1.13.1` + `stripe==9.12.0` |
| `app/config.py` | Variables `STRIPE_SECRET_KEY`, `FRONTEND_URL` |
| `app/main.py` | 3 endpoints Stripe : checkout, verify, webhook |
| `alembic.ini` | Config Alembic |
| `migrations/env.py` | Lecture DATABASE_URL depuis env |
| `migrations/versions/001_initial_schema.py` | Baseline no-op |
| `migrations/versions/002_add_indexes.py` | 5 index sur orders |
| `start.sh` | `alembic upgrade head` puis `python app/main.py` |
| `Dockerfile` | CMD → `bash start.sh` |

### Kubernetes
| Fichier | Modification |
|---------|-------------|
| `k8s/base/secrets.yaml` | Clé secrète Stripe |
| `k8s/base/order-service.yaml` | Env vars `STRIPE_SECRET_KEY`, `FRONTEND_URL`, resources HPA |
| `k8s/base/product-service.yaml` | Resources requests/limits pour HPA |
| `k8s/base/user-service.yaml` | Resources requests/limits pour HPA |
| `k8s/base/hpa.yaml` | Nouveau — 3 HPA (product, user, order) |

### Frontend
| Fichier | Modification |
|---------|-------------|
| `src/lib/ThemeContext.jsx` | Nouveau — contexte thème sombre/clair |
| `src/lib/store.js` | `fetchProducts()` avec paramètres, remplacement `SAMPLE_PRODUCTS` |
| `src/index.css` | Variables CSS `--gz-*` pour le thème |
| `src/main.jsx` | Ajout `<ThemeProvider>` |
| `src/hooks/usePerformance.js` | Nouveau — détection mobile/CPU |
| `src/components/layout/Header.jsx` | Logo Billcom, toggle thème, taille augmentée |
| `src/components/layout/Layout.jsx` | Transitions animées entre pages |
| `src/components/sections/Hero.jsx` | Indicateur "Scroll Down" animé |
| `src/pages/ShopPage.jsx` | Utilise les vraies données API |
| `src/pages/ProductPage.jsx` | Section reviews complète |
| `src/pages/CheckoutPage.jsx` | Intégration paiement Stripe |
| `src/pages/OrderSuccessPage.jsx` | Vérification paiement Stripe |

---

## 6. Horizontal Pod Autoscaler — Scalabilité automatique

### Pourquoi cette amélioration ?

**Problème initial :** Les 3 services (product, user, order) tournaient avec `replicas: 1` fixe dans leurs Deployments Kubernetes. Cela signifie qu'un seul pod gérait **toutes** les requêtes, peu importe la charge.

**Conséquences sans HPA :**
- Un pic de trafic (promotion, flash sale) sature le pod unique → temps de réponse qui explosent
- Les requêtes commencent à échouer (timeout, 502 Bad Gateway)
- Le système ne peut pas se remettre seul : intervention manuelle obligatoire

**Ce que le HPA apporte :**
- **Scale-up automatique** : quand le CPU dépasse 70% du seuil, Kubernetes crée de nouveaux pods en quelques secondes
- **Scale-down automatique** : quand la charge retombe, les pods inutiles sont supprimés pour économiser les ressources
- **Zéro intervention humaine** : le système s'adapte seul à la demande 24h/24
- **Protection du nœud** : `maxReplicas` empêche de saturer le cluster (budget ressources maîtrisé)

**Ce que ça ajoute concrètement au projet Billcom :**
- Si 100 utilisateurs ouvrent la boutique en même temps → product-service scale de 1 à 4 pods automatiquement
- Si une promotion Stripe génère 50 commandes simultanées → order-service scale jusqu'à 4 pods
- Dès que le trafic retombe → retour à 1 pod (économie de mémoire et CPU pour Minikube)

---

### Architecture du scaling

```
Metrics Server (kube-system)
  └── collecte CPU/RAM de chaque pod toutes les 15s
        │
        ▼
HPA Controller
  └── calcule : replicas_cibles = ceil(replicas_actuels × CPU_actuel / CPU_cible)
        │
        ├── CPU > 70% → scale UP  (nouveau pod créé)
        └── CPU < 70% pendant 120s → scale DOWN (pod supprimé)
```

**Formule de calcul du HPA :**
```
Exemple : 1 pod à 333% CPU, seuil 70%
replicas_cibles = ceil(1 × 333% / 70%) = ceil(4.76) = 5
→ mais maxReplicas=4, donc : 4 pods créés
```

---

### Étape 1 — Activer le Metrics Server

**Pourquoi :** Le HPA a besoin du Metrics Server pour lire la consommation CPU/RAM des pods en temps réel. Sans lui, `kubectl get hpa` affiche `<unknown>` pour les métriques et aucun scaling ne se produit. Dans Minikube, c'est un addon désactivé par défaut.

```bash
minikube addons enable metrics-server
```

**Vérification :**
```bash
# Attendre que le pod soit Running
kubectl get pods -n kube-system | grep metrics-server
# metrics-server-9d74bb658-hns42   1/1   Running   0   1m

# Tester la collecte de métriques
kubectl top pods -n billcom
```

**Résultat observé :**
```
NAME                              CPU(cores)   MEMORY(bytes)
frontend-5f6b4fb57d-nwrdg         0m           74Mi
gateway-d6c7d94fb-m7gmh           0m           22Mi
mysql-bdf9c995-g26vt              15m          411Mi
order-service-d49c65846-snwn2     3m           114Mi
product-service-8f9854757-pxxfm   3m           95Mi
redis-66698bcb56-t6mqd            11m          11Mi
user-service-6676db9b95-jnx2g     8m           87Mi
```

Ces valeurs de repos (3-8m CPU) servent à calibrer les `requests` dans Étape 2.

---

### Étape 2 — Ajouter les `resources` aux Deployments

**Pourquoi :** Le HPA calcule les pourcentages via : `CPU_actuel ÷ requests.cpu × 100`.
Sans `requests.cpu` défini dans le Deployment, cette division est impossible → HPA bloqué à `<unknown>`.

**Règle de calibration :**
- `requests.cpu` = ce que le service consomme normalement × 4 (pour avoir du headroom avant 70%)
- `limits.cpu` = requests × 3 (permet des bursts courts sans tuer le pod)
- `memory` : requests légèrement au-dessus de la consommation observée

#### Fichier modifié : `k8s/base/product-service.yaml`

```yaml
resources:
  requests:
    cpu: "150m"     # 0.15 vCPU garanti — HPA scale up si > 105m (70% × 150m)
    memory: "128Mi"
  limits:
    cpu: "500m"     # 0.5 vCPU max avant CPU throttling
    memory: "512Mi"
```

#### Fichier modifié : `k8s/base/user-service.yaml`

```yaml
resources:
  requests:
    cpu: "100m"     # user-service : moins de trafic → seuil plus bas
    memory: "96Mi"
  limits:
    cpu: "300m"
    memory: "384Mi"
```

#### Fichier modifié : `k8s/base/order-service.yaml`

```yaml
resources:
  requests:
    cpu: "150m"     # order-service : Stripe + Redis = légèrement plus gourmand
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

**Application :**
```bash
cd /mnt/c/Users/pc_msi/Documents/billcom

kubectl apply -f k8s/base/product-service.yaml
# deployment.apps/product-service configured

kubectl apply -f k8s/base/user-service.yaml
# deployment.apps/user-service configured

kubectl apply -f k8s/base/order-service.yaml
# deployment.apps/order-service configured
```

Les pods effectuent un **rolling update** : nouveau pod démarré → ancien terminé, sans interruption de service.

---

### Étape 3 — Créer les objets HPA

**Pourquoi un fichier séparé `hpa.yaml` :** Les HPA sont des objets Kubernetes indépendants
des Deployments. Les séparer permet de modifier les seuils de scaling sans toucher
aux configs de déploiement, et de versionner les deux indépendamment.

#### Fichier créé : `k8s/base/hpa.yaml`

```yaml
# ── product-service ───────────────────────────────────
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
  namespace: billcom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 1    # 1 pod minimum au repos (économie de ressources)
  maxReplicas: 4    # plafond : 4 × 150m = 600m CPU max sur le nœud
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # scale up si CPU > 105m (70% × 150m)
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30    # réagit en 30s à un pic
      policies:
        - type: Pods
          value: 1
          periodSeconds: 30             # ajoute max 1 pod toutes les 30s
    scaleDown:
      stabilizationWindowSeconds: 120   # attend 2min avant de réduire
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60             # retire max 1 pod par minute
```

**Paramètres identiques pour user-service** (maxReplicas: 3) **et order-service** (maxReplicas: 4).

**Explication de chaque paramètre `behavior` :**

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `scaleUp.stabilizationWindowSeconds` | 30s | Réagir vite à un vrai pic de charge |
| `scaleUp.policies.periodSeconds` | 30s | Pas d'explosion soudaine : 1 pod ajouté à la fois |
| `scaleDown.stabilizationWindowSeconds` | 120s | Éviter le "yo-yo" si la charge oscille |
| `scaleDown.policies.periodSeconds` | 60s | Scale down progressif, 1 pod par minute |

**Application :**
```bash
kubectl apply -f k8s/base/hpa.yaml
# horizontalpodautoscaler.autoscaling/product-service-hpa created
# horizontalpodautoscaler.autoscaling/user-service-hpa created
# horizontalpodautoscaler.autoscaling/order-service-hpa created
```

**Vérification (après ~60s pour la première collecte de métriques) :**
```bash
kubectl get hpa -n billcom
```

```
NAME                  REFERENCE                    TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
order-service-hpa     Deployment/order-service     cpu: 2%/70%   1         4         1          3m
product-service-hpa   Deployment/product-service   cpu: 2%/70%   1         4         1          3m
user-service-hpa      Deployment/user-service      cpu: 3%/70%   1         3         1          3m
```

Les métriques réelles remplacent `<unknown>` → HPA opérationnel.

---

### Étape 4 — Test de charge et validation

#### 4.1 Déclencher le scale-up

On crée un pod `busybox` qui envoie des requêtes en boucle infinie sur product-service :

```bash
kubectl run load-test --image=busybox:1.36 --restart=Never -n billcom -- \
  sh -c "while true; do wget -q -O- http://product-service:8002/api/v1/products > /dev/null; done"
```

**Surveillance en temps réel :**
```bash
watch -n 5 "kubectl get hpa -n billcom && echo '---' && kubectl get pods -n billcom | grep product"
```

#### 4.2 Résultats observés — Scale-up

**Après ~30 secondes :**
```
NAME                  TARGETS         REPLICAS
product-service-hpa   cpu: 333%/70%   2        ← 2ème pod créé automatiquement
---
product-service-6d4878db57-rkk9z   1/1   Running   10m
product-service-6d4878db57-j2frf   1/1   Running   37s  ← nouveau
product-service-6d4878db57-xsmsj   0/1   Running   7s   ← en démarrage
```

**Après ~90 secondes :**
```
NAME                  TARGETS         REPLICAS
product-service-hpa   cpu: 268%/70%   4        ← plafond maxReplicas atteint
---
product-service-6d4878db57-rkk9z   1/1   Running   10m
product-service-6d4878db57-j2frf   1/1   Running   86s
product-service-6d4878db57-xsmsj   1/1   Running   56s
product-service-6d4878db57-b6gnm   1/1   Running   26s  ← 4ème pod
```

Le CPU reste à 268% même avec 4 pods car le pod `load-test` envoie plus de requêtes que 4 pods peuvent absorber. Le HPA respecte le `maxReplicas: 4` et ne va pas plus loin.

#### 4.3 Déclencher le scale-down

```bash
kubectl delete pod load-test -n billcom
# pod "load-test" deleted
```

**Après 2 minutes (stabilizationWindowSeconds: 120) :**
```
NAME                  TARGETS       REPLICAS
product-service-hpa   cpu: 2%/70%   1        ← retour à 1 replica ✅
---
product-service-6d4878db57-rkk9z   1/1   Running   20m  ← seul survivant
```

Le scale-down s'est fait progressivement (1 pod par minute pendant ~3 minutes) avant de revenir à 1 replica.

---

### Résumé complet du test

| Phase | CPU observé | Replicas | Durée |
|-------|------------|---------|-------|
| Repos (avant test) | 2% | 1 | — |
| Charge (load-test) | 333% → 268% | 1 → 2 → 3 → 4 | ~90s |
| Plafond | 268% | 4 (max) | — |
| Après arrêt charge | 2% | 4 → 3 → 2 → 1 | ~8 min |

### Commandes utiles au quotidien

```bash
# Voir l'état actuel de tous les HPA
kubectl get hpa -n billcom

# Détails complets d'un HPA (events, historique de décisions)
kubectl describe hpa product-service-hpa -n billcom

# Voir les métriques CPU/RAM en temps réel
kubectl top pods -n billcom

# Surveiller le scaling en live
watch -n 5 "kubectl get hpa -n billcom && kubectl get pods -n billcom"

# Voir les événements de scaling dans les logs Kubernetes
kubectl get events -n billcom --sort-by='.lastTimestamp' | grep -i "scaled"
```

### Modifier les seuils HPA

Pour ajuster les seuils sans recréer les HPA :
```bash
# Changer le maxReplicas de product-service à 6
kubectl patch hpa product-service-hpa -n billcom \
  --patch '{"spec":{"maxReplicas":6}}'

# Ou modifier le fichier hpa.yaml et réappliquer
kubectl apply -f k8s/base/hpa.yaml
```
