# Frontend — GadgetZone (Billcom)

Ce document décrit en détail l'application frontend du projet Billcom : stack technique, architecture, design system, composants, animations, state management et intégration avec les services backend. Objectif : donner à un LLM (ou un nouveau développeur) tout le contexte nécessaire pour comprendre le code sans avoir à l'explorer fichier par fichier.

## 1. Vue d'ensemble

Le frontend est une **SPA React** (Vite) qui sert de boutique e-commerce de gadgets technologiques sous la marque **"GadgetZone"** (nom d'affichage produit du projet Billcom — le repo/backend s'appelle Billcom, mais l'UI est brandée GadgetZone). Elle consomme trois microservices backend (user, product, order) via l'API Gateway Nginx, et utilise localStorage pour persister l'auth et le panier.

- Devise affichée : Taka bangladais (৳ / BDT), voir `formatPrice()` dans `store.js`.
- Langue de l'UI : anglais. Le ChatBot (assistant) répond en français ou anglais selon le client.
- Thème : dark par défaut, avec un mode clair togglable (voir §5).

## 2. Stack technique

| Domaine | Choix | Version |
|---|---|---|
| Framework | React | 18.3 |
| Build tool | Vite | 5.2 |
| Routing | react-router-dom | 7.18 |
| State management | Zustand (+ middleware `persist`) | 5.0 |
| Styles | Tailwind CSS v4 (via `@tailwindcss/vite`) + CSS custom properties + styles inline | 4.3 |
| Animations 2D | Framer Motion | 12.40 |
| Animations 3D | Three.js (WebGL brut, pas de react-three-fiber) | 0.184 |
| Icônes | lucide-react | 0.395 |
| Utilitaires classes | clsx | 2.1 |
| Lint | ESLint 9 (flat config) + plugins react / react-hooks / react-refresh | — |
| Conteneurisation | Docker multi-stage (build Node → serve Nginx alpine, non-root) | — |

Pas de TypeScript (fichiers `.jsx`/`.js` uniquement, avec `@types/react` pour l'IDE seulement). Pas de framework de test frontend actuellement configuré.

## 3. Structure des dossiers

```
frontend/
  src/
    main.jsx                 # bootstrap : StrictMode > ThemeProvider > BrowserRouter > App
    App.jsx                  # déclaration des routes (react-router)
    index.css                # design tokens Tailwind v4, thème clair/foncé, classes utilitaires globales
    lib/
      store.js                # 4 stores Zustand : auth, cart, products, orders + données produits fallback
      api.js                  # fonctions fetch "legacy" vers order/user/product-service (peu utilisées, voir §7)
      ThemeContext.jsx         # Context React pour dark/light (persisté en localStorage, attribut data-theme)
      utils.js                 # helpers génériques (cn/clsx etc.)
      flyToCart.js              # animation "vol" d'un élément vers l'icône panier
    hooks/
      useScrollReveal.js        # IntersectionObserver → reveal on scroll
      useCountUp.js              # animation de compteur numérique
      useFrameLoader.js           # précharge une séquence d'images (sprite scroll-driven, voir §8.4)
      usePerformance.js            # détecte prefers-reduced-motion / device faible pour désactiver animations lourdes
    components/
      layout/
        Layout.jsx              # shell de page : Header + <Outlet/> animé + Footer + ChatBot + CustomCursor + ScrollProgress
        Header.jsx                # nav sticky, recherche, panier, auth, toggle thème, menu mobile
        Footer.jsx                 # liens, newsletter, infos de contact
      ecommerce/
        ProductCard.jsx           # carte produit (grille shop/home)
        CartDrawer.jsx              # (drawer panier, si utilisé)
      sections/                    # ~15 sections de la page d'accueil (Hero, FeaturedProducts, DealOfDay, Testimonials, etc.)
      three/
        HeroCanvas.jsx             # scène Three.js du Hero (globe + particules)
      ui/
        Button.jsx, Card.jsx, Badge.jsx, Input.jsx   # primitives UI génériques
      ChatBot.jsx                  # assistant conversationnel (API Groq)
      CustomCursor.jsx              # curseur custom (desktop uniquement)
      ScrollProgress.jsx             # barre de progression de scroll en haut de page
      ScrollProductCanvas.jsx         # séquence d'images pilotée par le scroll (style Apple)
      Logo.jsx                        # logo SVG de la marque
    pages/
      HomePage, ShopPage, ProductPage, CartPage, CheckoutPage, OrderSuccessPage,
      LoginPage, RegisterPage, MyAccountPage, AdminPage, DashboardPage,
      CatalogPage, NotFoundPage
  index.html
  vite.config.js               # plugins react + tailwind, proxy dev vers les 3 services backend
  Dockerfile                   # build multi-stage → Nginx alpine non-root
  nginx.conf                   # config Nginx du conteneur frontend (sert le build statique)
  eslint.config.js             # config ESLint flat (react, react-hooks, react-refresh)
```

## 4. Routing (`App.jsx`)

Toutes les routes sont enfants d'un `<Route element={<Layout/>}>` unique (header/footer communs).

| Path | Page | Protection |
|---|---|---|
| `/` | HomePage | — |
| `/shop` | ShopPage (filtres via query params `q`, `cat`, `badge`, `sort`, `page`) | — |
| `/product/:slug` | ProductPage | — |
| `/cart` | CartPage | — |
| `/checkout` | CheckoutPage | — |
| `/order-success` | OrderSuccessPage | — |
| `/account` | MyAccountPage | — |
| `/login`, `/register` | LoginPage, RegisterPage | — |
| `/admin` | AdminPage | `RequireAdmin` (redirige vers `/login` si non connecté, vers `/` si non-admin) |
| `/dashboard` | DashboardPage | `RequireAdmin` |
| `*` | NotFoundPage | — |

`RequireAdmin` lit `useAuthStore().isLoggedIn()` / `.isAdmin()` (rôle `admin` ou `super_admin`).

## 5. State management — Zustand (`lib/store.js`)

Quatre stores indépendants, tous des hooks Zustand simples (pas de slices combinées) :

### `useAuthStore` (persisté sous la clé `gz-auth`, seul `token` est persisté)
- `login(email, password)` → POST `/api/v1/users/login`, stocke le JWT, puis appelle `fetchProfile()`.
- `register(firstName, lastName, email, password)` → POST `/api/v1/users/register`.
- `fetchProfile()` → GET `/api/v1/users/me` avec `Authorization: Bearer <token>` ; déconnecte automatiquement si le token est invalide.
- `logout()`, `isLoggedIn()`, `isAdmin()`.

### `useCartStore` (persisté sous `gz-cart`, panier entier persisté)
- `addItem(product, qty)`, `updateQty(id, qty)`, `removeItem(id)`, `clear()`.
- Dérivés calculés à la volée : `count()`, `subtotal()`, `shipping()` (gratuit dès ৳5000, sinon ৳150), `total()`.

### `useProductStore` (non persisté)
- Initialisé avec `SAMPLE_PRODUCTS` (15 produits mockés en dur dans `store.js` — smartphones, laptops, audio, cameras, wearables, accessoires) comme **fallback offline**.
- `fetchProducts(params)` → GET `/api/v1/products` avec querystring (q, category, min_price, max_price, badge, in_stock, featured, sort, page, per_page). Si la requête échoue ou renvoie une liste vide, les `SAMPLE_PRODUCTS` restent affichés (pas d'état d'erreur bloquant).
- Sélecteurs : `getBySlug`, `getFeatured` (6 produits `featured:true`), `getNewArrivals` (4 derniers), `getDeal` (premier produit badge `HOT`).

### `useOrderStore` (non persisté)
- `placeOrder(orderData)` → POST `/api/v1/orders` avec un `order_number` généré côté client (`GZ-<timestamp>`).
- `fetchOrders()` → GET `/api/v1/orders/me`, transforme la réponse backend (`items_json` stringifié → array JS).

**Important** : `USER_SERVICE`, `PRODUCT_SERVICE`, `ORDER_SERVICE` dans `store.js` sont des chaînes **vides** (`""`). Tous les appels sont donc des chemins relatifs (`/api/v1/...`), routés par le proxy Nginx du gateway en prod, et par le proxy Vite dev (voir `vite.config.js`) en local. Le fichier `lib/api.js` définit des fonctions similaires mais avec des URLs `USER_SERVICE_URL` etc. également vides — ce fichier semble être une version antérieure/alternative peu utilisée par les composants actuels (la logique vivante est dans `store.js`).

## 6. Thème clair/sombre (`ThemeContext.jsx` + `index.css`)

- Context React simple : état `theme` (`'dark'` par défaut), persisté dans `localStorage['gz-theme']`, appliqué via `document.documentElement.setAttribute('data-theme', theme)`.
- `index.css` définit les tokens sous `:root` (dark) et `[data-theme="light"]` (variables `--gz-bg`, `--gz-surface`, `--gz-text`, `--gz-text2`, `--gz-border`, `--gz-accent2`, etc.).
- Couleur d'accent principale : **ambre `#f59e0b`** (constante dans les deux thèmes, codée en dur dans beaucoup de composants plutôt que via variable CSS).
- Toggle exposé dans le `Header` (icônes Sun/Moon animées avec Framer Motion).
- Tailwind v4 est configuré via `@theme` dans `index.css` (pas de `tailwind.config.js` — nouvelle syntaxe CSS-first de Tailwind v4).

## 7. Communication avec le backend

- Aucune baseURL absolue codée : tout passe par des chemins relatifs `/api/v1/...`.
- En dev (`npm run dev`), Vite proxy ces chemins vers `localhost:8001/8002/8003` (voir `vite.config.js`).
- En prod (Docker/K8s), c'est Nginx (`gateway/nginx.conf`, décrit dans `CLAUDE.md`) qui route `/api/users|products|orders` vers les services.
- Auth : JWT stocké dans le store Zustand persisté (`localStorage`), envoyé en `Authorization: Bearer <token>` sur les requêtes protégées.
- Gestion d'erreur généralisée : `try/catch` silencieux qui garde l'état précédent (produits mockés, panier local) plutôt que de casser l'UI — le frontend est conçu pour rester utilisable même si le backend est down.

## 8. Composants & fonctionnalités notables

### 8.1 `Layout.jsx`
Wrapper de toutes les pages. Charge les produits au montage (`fetchProducts()`), anime les transitions de route avec `AnimatePresence`/`motion.div` (fade + translateY), et monte les composants globaux : `ScrollProgress`, `Header`, `Footer`, `ChatBot`, `CustomCursor`.

### 8.2 `CustomCursor.jsx`
Curseur personnalisé (point + anneau qui suit avec un lag via lerp/`requestAnimationFrame`), activé seulement si `matchMedia('(pointer: fine)')` (donc désactivé sur mobile/tactile). L'anneau grossit/réagit (`classList.add('hovered')`) au survol des éléments interactifs (`a, button, input, select, [role=button], .cat-card, .gz-card, .page-btn`).

### 8.3 `ScrollProgress.jsx`
Barre fine en haut de la fenêtre qui reflète le % de scroll de la page, recalculée à chaque changement de route.

### 8.4 `flyToCart.js` + `ScrollProductCanvas.jsx` / `HeroCanvas.jsx` / `useFrameLoader.js`
- `flyToCart(originEl)` : crée un élément "fantôme" (`.gz-fly-dot`) qui vole de la position du bouton "Add to cart" jusqu'à l'icône panier (`#gz-cart-icon` dans le Header), puis déclenche une classe `gz-cart-bump` sur l'icône. Utilisé par `ProductCard.jsx`.
- `HeroCanvas.jsx` : scène Three.js custom (pas react-three-fiber) en fond du Hero — globe wireframe, particules, anneaux orbitaux, packets de données animés, suit la souris. Désactivée si `usePerformance().shouldReduceMotion` est vrai.
- `ScrollProductCanvas.jsx` : effet "scrollytelling" façon page produit Apple — précharge deux séquences d'images (iPhone, AirPods, ~101 frames chacune via `useFrameLoader`) et dessine la frame correspondant à la position de scroll sur un `<canvas>` 2D, avec des overlays de texte qui fade in/out (Framer Motion `useScroll`/`useTransform`). Section très haute (`h-[700vh]`) avec canvas `sticky`.
- `usePerformance.js` : détecte `prefers-reduced-motion` et/ou un device peu puissant pour désactiver globalement ces animations coûteuses.

### 8.5 `useScrollReveal.js`
Hook générique basé sur `IntersectionObserver` : renvoie `[ref, isVisible]`, utilisé avec des classes CSS `reveal-up` / `is-visible` (définies dans `index.css`) pour des animations d'apparition au scroll sur les grilles produits (ex. `ShopPage.jsx`), avec un délai en cascade (`transitionDelay: i * 60ms`).

### 8.6 `ChatBot.jsx`
Assistant conversationnel flottant (bouton rond en bas à droite → fenêtre de chat).
- Utilise l'API **Groq** (`https://api.groq.com/openai/v1/chat/completions`, modèle `llama-3.3-70b-versatile`), clé lue depuis `import.meta.env.VITE_GROQ_API_KEY`.
- Le prompt système est généré dynamiquement à partir de `SAMPLE_PRODUCTS` et `CATEGORIES` (catalogue complet injecté en contexte), en français, avec des règles de comportement (répondre en FR/EN selon le client, ne jamais révéler la clé API, mentionner discrètement les stocks faibles, etc.).
- Suggestions rapides prédéfinies au premier message. Gestion d'erreurs (clé manquante, erreur API) affichée dans le chat.
- **Note sécurité** : la clé API Groq est exposée côté client (variable `VITE_*`, donc bundlée en clair dans le JS livré au navigateur) — acceptable seulement si la clé a des quotas/restrictions limités côté Groq.

### 8.7 `Header.jsx`
Nav fixe en haut, fond flouté (`backdrop-filter: blur`) qui s'opacifie au scroll. Contient : logo, nav desktop, toggle thème, recherche (barre dépliable), icône panier avec badge de compte (`useCartStore().count()`), menu compte (Sign in/Register ou Account/Admin/Logout selon l'auth), menu mobile hamburger.

### 8.8 `ProductCard.jsx`
Carte produit réutilisée dans les grilles (Shop, Home, etc.) : image avec zoom au survol, badge (NEW/HOT/SALE, HOT avec animation pulse), overlay "Quick View", note en étoiles, prix (+ prix barré si `old_price`), bouton "Add to Cart" qui déclenche `addItem()` + `flyToCart()`.

### 8.9 Pages principales
- **ShopPage** : catalogue filtrable (catégorie, prix max via slider, badge) et triable (newest/rating/price), pagination (9 produits/page), état "aucun résultat", tout piloté par les query params d'URL (`useSearchParams`) donc les filtres sont partageables/bookmarkables.
- **LoginPage / RegisterPage** : formulaires simples liés directement à `useAuthStore`.
- **AdminPage / DashboardPage** : réservées aux rôles admin (voir `RequireAdmin`).
- **NotFoundPage** : 404 custom (illustration + liens de retour).

## 9. Design system (`index.css`)

- Import Tailwind v4 (`@import "tailwindcss"`) + tokens `@theme` (couleurs `gz-*`, polices).
- Polices : **Bricolage Grotesque** (titres, `font-head`) et **DM Sans** (corps, `font-body`).
- Effet de grain de film subtil superposé à toute l'app (`body::before`, SVG `feTurbulence` en `mix-blend-mode: overlay`, opacité 0.05) pour une touche "premium/texturée".
- Scrollbar custom fine, sélection de texte en ambre.
- Focus clavier visible partout (`:focus-visible`, contour ambre) pour l'accessibilité.
- Classes utilitaires globales réutilisées dans quasi tous les composants : `.btn-primary` (bouton ambre avec effet sheen/brillance au survol), `.btn-outline`, `.gz-card`, `.gz-input`, `.gz-container`, `.reveal-up`/`.is-visible`, `.page-btn`, `.cat-card`.
- **Convention de style dominante** : la majorité des composants utilisent des **styles inline (`style={{...}}`)** plutôt que des classes Tailwind pour la mise en forme fine (couleurs, spacing, typographie), Tailwind/CSS étant réservé aux utilitaires de layout (`flex`, `grid`, `hidden md:flex`, etc.) et aux classes globales définies dans `index.css`. C'est un choix de style assumé du projet, pas une incohérence — à respecter si on ajoute de nouveaux composants dans le même esprit visuel.

## 10. Build & déploiement

- `npm run dev` → Vite dev server, port 3000, proxy API vers les 3 services locaux.
- `npm run build` → build de prod dans `dist/` (Vite + Rollup).
- `Dockerfile` : stage 1 build Node 20 alpine (`npm ci` + `npm run build`), stage 2 sert `dist/` avec **Nginx 1.27 alpine**, exécuté en **non-root** (`USER nginx`), avec `HEALTHCHECK` sur `/`.
- Le conteneur frontend est un des 4 services buildés/scannés (Trivy)/smoke-testés dans le pipeline CI/CD (`.github/workflows/ci-cd.yml`), au même titre que les 3 services Python.

## 11. Points d'attention / pièges connus

- **`lib/api.js` vs `lib/store.js`** : deux couches d'accès API existent ; `store.js` est la source de vérité actuelle utilisée par les composants (login, produits, commandes). `api.js` semble être un ancien module ou un helper alternatif moins utilisé — vérifier les imports avant de le modifier ou le supprimer.
- **Produits mockés** : `SAMPLE_PRODUCTS` sert à la fois de fallback offline ET de source de données pour le prompt système du ChatBot — toute modification du catalogue réel côté backend ne se reflète pas automatiquement dans les réponses du ChatBot tant que ces données mockées ne sont pas synchronisées.
- **Clé API Groq côté client** : à garder en tête pour toute revue de sécurité (variable d'env `VITE_GROQ_API_KEY` visible dans le bundle JS final).
- **ESLint bloquant en CI** : `react/no-unescaped-entities` (apostrophes non échappées) et toute erreur ESLint font échouer le job `lint-frontend`, qui bloque le job `build` de toute la pipeline (voir §PHASE6_CICD.md et l'historique récent — un correctif a déjà été nécessaire sur `NotFoundPage.jsx`).
- Pas de tests automatisés frontend à ce jour (contrairement aux services backend qui ont `pytest`).
