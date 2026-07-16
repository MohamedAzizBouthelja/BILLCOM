# Phase 6 — Pipeline CI/CD : Documentation complète

Ce document explique en détail la pipeline CI/CD mise en place dans [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) : le but de chaque étape, ce qui a été implémenté, les commandes utilisées (et pourquoi), les bugs réels découverts pendant la mise en place, et comment ils ont été corrigés.

---

## Vue d'ensemble

La pipeline s'appelle **DevOps Pipeline** et se déclenche automatiquement :

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

- **`push` sur `main` ou `develop`** : à chaque fois que du code est poussé sur ces branches.
- **`pull_request` vers `main`** : à chaque ouverture/mise à jour d'une Pull Request ciblant `main`.

Elle est composée de **10 jobs** (certains en matrice, donc exécutés plusieurs fois en parallèle) qui correspondent aux 10 étapes du plan initial :

```
lint-python (×3) ─┐
                   ├─→ test (×3) ─┐
lint-frontend ─────┘              ├─→ build (×4) ─→ validate-k8s
security-scan (×3) ────────────────┘
dependency-scan (×3) ─ (parallèle, informatif)
dependency-scan-frontend ─ (parallèle, informatif)
```

**Principe directeur : "fail fast"** — les vérifications les plus rapides et les moins coûteuses (lint) tournent en premier et bloquent la suite si elles échouent. Les étapes plus lentes (build Docker, scan d'image) ne se déclenchent qu'une fois le code validé.

**Registre d'images** : GitHub Container Registry (GHCR), choisi pour ne nécessiter aucun compte externe (authentification automatique via `GITHUB_TOKEN`).

---

## Étape 1 — Lint (flake8 + black + ESLint)

### But
Vérifier le **style** et détecter les erreurs évidentes (imports morts, variables non utilisées, syntaxe suspecte) avant même de lancer les tests — c'est rapide (quelques secondes), donc on préfère échouer ici plutôt qu'après un test de 2 minutes.

### Ce qui a été mis en place
- [.flake8](.flake8) : configuration partagée aux 3 services Python.
  - `max-line-length = 88` (aligné sur Black)
  - `extend-ignore = E203, W503` (Black et Flake8 ne s'accordent pas nativement sur le formatage des slices/opérateurs — c'est la config recommandée officiellement)
  - `per-file-ignores` : `E402` toléré dans `tests/*.py` (les tests modifient `sys.path` avant d'importer `app`, ce qui est volontaire) ; `E501` toléré dans `seed_data.py` (données de catalogue avec URLs longues, voir plus bas)
  - `exclude` : migrations Alembic (code généré), `venv/`, `__pycache__/`
- [frontend/eslint.config.js](frontend/eslint.config.js) : config ESLint "flat config" moderne pour React 18 + Vite, avec les plugins `react`, `react-hooks`, `react-refresh`.

### Commandes utilisées
```bash
# Python — formatage
black --check --diff services/<service>
# --check : ne modifie rien, sort en erreur si un fichier n'est pas formaté
# --diff : affiche ce qui serait changé, utile pour le debug

# Python — style et erreurs
flake8 services/<service>

# Frontend
npm run lint   # -> eslint .
```

### Bugs réels trouvés (pas que du style)
1. **`Link` non importé** dans [AdminPage.jsx](frontend/src/pages/AdminPage.jsx) — le composant `react-router-dom` était utilisé sans son import. Aurait planté à l'exécution.
2. **Hooks React appelés conditionnellement** dans `ScrollProductCanvas.jsx` et `HeroCanvas.jsx` — un `return` précoce (`if (shouldReduceMotion) return ...`) se trouvait *avant* certains appels à `useEffect`/`useTransform`. Cela viole les [Règles des Hooks](https://react.dev/warnings/invalid-hook-call-warning) et peut corrompre l'état de React entre deux rendus. **Fix** : déplacer tous les hooks avant le `return` conditionnel.
3. **`python-dotenv` et `email-validator` absents des `requirements.txt`** des 3 services alors qu'utilisés dans le code (`config.py` fait `from dotenv import load_dotenv`, `schemas.py` utilise `EmailStr` qui nécessite `email-validator`). Ça n'avait jamais été remarqué car un environnement local avait ces paquets installés par ailleurs. **Impact potentiel** : aurait fait planter l'étape 2 (tests) en CI avec `ModuleNotFoundError`.
4. **Lignes trop longues dans `product-service`** : le fichier `seed_data.py` contient ~580 lignes de données produit (descriptions, URLs d'images) qui dépassent naturellement 88 caractères. Plutôt que d'augmenter la limite globale (ce qui aurait affaibli la règle pour du vrai code), ces données ont été extraites dans leur propre fichier avec une exception `per-file-ignores` ciblée.
5. **28 fichiers Python reformatés par Black** — purement cosmétique (espaces, guillemets, retours à la ligne), aucun changement de logique.

---

## Étape 2 — Tests unitaires + Coverage

### But
Vérifier que le code **fonctionne réellement** (pas juste qu'il est bien écrit), et mesurer la **couverture de test** (% de lignes exécutées par au moins un test) avec un seuil minimum de 70%.

### Ce qui a été mis en place
Job `test`, dépendant de `lint-python` (`needs: lint-python`) :

```yaml
env:
  DATABASE_URL: sqlite:///./ci_test.db
  JWT_SECRET: ci-test-secret-key-not-for-production
  JWT_ALGORITHM: HS256
```

### Commandes utilisées
```bash
pip install -r requirements.txt
pip install pytest==8.3.2 pytest-cov==5.0.0 httpx==0.27.2

pytest tests/ -v \
  --cov=app \                    # mesure la couverture du dossier app/
  --cov-report=term-missing \    # affiche les lignes NON couvertes dans le terminal
  --cov-report=xml \             # génère coverage.xml (uploadé en artifact)
  --cov-fail-under=70            # fait échouer la commande si couverture < 70%
```

**Pourquoi SQLite et pas un vrai conteneur MySQL** (contrairement au YAML historique qui prévoyait un `services: mysql:`) : les tests utilisaient déjà SQLite en local via une base séparée créée directement dans les fichiers de test. Réutiliser ce pattern en CI est plus rapide (pas de conteneur à attendre) et suffisant pour tester la logique métier.

### Bug critique découvert : `DATABASE_URL` obligatoire
`app/config.py` a un défaut codé en dur :
```python
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:...@localhost:3306/...")
```
Et `app/main.py` appelle `Base.metadata.create_all(bind=engine)` **à l'import du module** (pas seulement au runtime). En local, un vrai MySQL tournait par hasard sur le port par défaut, donc cette dépendance cachée n'était jamais visible. Sur un runner GitHub Actions (VM vierge, sans MySQL), l'import de `app.main` aurait planté immédiatement. **Fix** : forcer `DATABASE_URL=sqlite:///./ci_test.db` dans l'environnement du job — vérifié en reproduisant exactement ces variables en local avant d'écrire le YAML.

### Autres bugs trouvés et corrigés
1. **`HTTPBearer` renvoie 403, pas 401, si le header `Authorization` est absent** — deux tests (`test_create_product_unauthorized`, `test_create_review_unauthorized`) attendaient `401`. C'est un piège classique de FastAPI : `401` n'est renvoyé que si le code lève explicitement cette erreur (token invalide/expiré) ; `403` ("Not authenticated") est le comportement par défaut de `HTTPBearer` quand aucun token n'est fourni du tout. **Découvert parce que** la vérification locale utilisait une version de FastAPI non figée (différente de `fastapi==0.111.0` pinné dans `requirements.txt`), qui se comportait différemment sur ce point précis.
2. **Tests `product-service`/`order-service` périmés** : écrits avant l'ajout de la pagination (`{items, total, page}` au lieu d'une liste brute), du champ `slug` obligatoire, et des champs `order_number`/`total_price` obligatoires côté commandes. Vérifié que le frontend et les données de seed attendaient déjà ce nouveau format avant de corriger les tests (et non l'API).
3. **Absence de vérification de stock** dans `order-service` : `create_order()` vérifiait que le produit existait, mais jamais que le stock était suffisant — n'importe qui pouvait commander plus que disponible. Ajout d'une vraie vérification (`product.get("stock", 0) < order_data.quantity` → `400 "Stock insuffisant pour ce produit"`).
4. **Couverture insuffisante** : `product-service` et `order-service` étaient à 68% (sous le seuil de 70%), car le système d'avis produits et l'intégration Stripe/cache Redis n'avaient aucun test. Ajout de 15 tests (avis produits : création, doublon rejeté, suppression, recalcul de note moyenne ; Stripe : checkout, vérification de paiement ; cache Redis simulé). Résultat : 85% et 86%.

---

## Étape 3 — Scan de code (Bandit)

### But
Analyser le **code source Python** à la recherche de patterns dangereux (secrets en dur, `eval()`, injections, mauvaise config SSL) — différent du lint (qui vérifie le style) et différent du scan de dépendances (qui vérifie les *librairies*, pas *ton* code).

### Ce qui a été mis en place
```yaml
- name: Install Bandit
  run: pip install bandit==1.9.4
- name: Run Bandit
  run: bandit -r services/${{ matrix.service }}/app
```
Scan limité à `app/` (pas `tests/`, qui contient des patterns "dangereux" volontaires comme des secrets de test en dur).

### Bug d'outillage rencontré
`bandit==1.7.x` (version initialement testée) **plante sur Python 3.12+** avec `AttributeError: module 'ast' has no attribute 'Num'` — l'API `ast.Num` a été supprimée dans les versions récentes de Python et cette vieille version de Bandit ne s'est jamais adaptée. **Fix** : utiliser `bandit==1.9.4`, testé et confirmé compatible.

### Résultats et corrections
5 signalements, tous des faux positifs ou des choix intentionnels — documentés avec des commentaires `# nosec` **ciblés** (par ID de règle, pas une désactivation globale) :

| Règle | Fichier | Explication | Correction |
|---|---|---|---|
| `B104` (bind toutes interfaces) | `config.py` ×3 | `HOST="0.0.0.0"` est nécessaire pour qu'un service dans un conteneur Docker soit joignable | `# nosec B104` avec commentaire |
| `B110` (try/except/pass) | `order-service/main.py` | Fallback volontaire vers la BD si le cache Redis échoue | `# nosec B110` avec commentaire |
| `B105` (mot de passe en dur) | `user-service/main.py` | Faux positif : `"token_type": "bearer"` est une valeur standard OAuth2, pas un secret | `# nosec B105` avec commentaire |

Chaque suppression a été **vérifiée individuellement** (relance de Bandit après coup, confirmation via le compteur `Total potential issues skipped due to specifically being disabled`) pour s'assurer qu'aucun vrai problème n'était masqué par erreur.

---

## Étape 4 — Scan de dépendances (pip-audit + npm audit)

### But
Vérifier que les **versions figées** des librairies utilisées (`requirements.txt`, `package-lock.json`) ne contiennent pas de CVE connues.

### Choix d'outillage
Le plan initial mentionnait **OWASP Dependency-Check**, mais cet outil nécessite une clé API NVD (compte externe à créer) sous peine de scans de 20-30 minutes. À la place : **`pip-audit`** (Python) + **`npm audit`** (déjà intégré à npm) — rapides, sans compte externe, même finalité.

### Commandes utilisées
```bash
pip-audit -r services/<service>/requirements.txt
npm audit --audit-level=moderate
```
Les deux jobs utilisent `continue-on-error: true` : ils tournent et rapportent, mais ne bloquent pas le pipeline.

### Résultats et corrections
Découverte initiale : **32 à 34 CVE** par service, sur 5-6 paquets partagés (`cryptography`, `pyjwt`, `python-dotenv`, `python-multipart`, `starlette`, `requests`).

**Corrigés immédiatement** (bumps sûrs, sans risque de compatibilité, vérifiés par la suite complète de tests après coup) :
- `python-multipart` : `0.0.9` → `0.0.32`
- `python-dotenv` : `1.0.1` → `1.2.2`
- `requests` (order-service) : `2.32.3` → `2.34.2`

**Laissés en informatif** (`cryptography`, `pyjwt`, `starlette`) : leur correction complète nécessite de bumper **FastAPI lui-même**, car `fastapi==0.111.0` impose `starlette<0.38`. C'est un chantier à part (bump de framework + tests de non-régression complets), volontairement hors du périmètre "mise en place de la CI".

---

## Étape 5 — Build Docker (multi-stage optimisé)

### But
Construire les images Docker de façon reproductible, en minimisant leur taille et leur surface d'attaque.

### État de départ
Les Dockerfiles existants étaient déjà multi-stage avec utilisateur non-root — pas repartis de zéro. Améliorations apportées :
- `.dockerignore` : exclusion de `tests/`, `.git`, `.env` du contexte copié dans l'image finale.
- `frontend/Dockerfile` : `npm install` → `npm ci` (utilise exactement `package-lock.json`, plus rapide et reproductible).
- `HEALTHCHECK` ajouté aux 4 images, basé sur les endpoints `/health` déjà existants.

### Bug Docker classique rencontré : IPv6 vs IPv4
```dockerfile
CMD wget --quiet --spider http://localhost:3000/ || exit 1
```
Ce `HEALTHCHECK` échouait avec `Connection refused` **alors que le serveur tournait correctement** (confirmé par `curl` depuis l'hôte). Cause : à l'intérieur du conteneur, `localhost` se résout d'abord en IPv6 (`::1`), mais nginx n'écoute qu'en IPv4. **Fix** : utiliser `127.0.0.1` explicitement dans les 4 `HEALTHCHECK` (3 services Python + frontend).

### Job CI ajouté
```yaml
build:
  needs: [lint-frontend, test, security-scan]
  strategy:
    matrix:
      include:
        - service: user-service
          context: services/user-service
          port: 8001
        # ... (product-service, order-service, frontend)
  steps:
    - uses: docker/setup-buildx-action@v3
    - uses: docker/build-push-action@v6
      with:
        context: ${{ matrix.context }}
        push: false
        load: true   # charge l'image dans le daemon Docker du runner (nécessaire pour Trivy et le smoke test)
        tags: billcom-${{ matrix.service }}:${{ github.sha }}
        cache-from: type=gha,scope=${{ matrix.service }}
        cache-to: type=gha,mode=max,scope=${{ matrix.service }}
```
`cache-from`/`cache-to: type=gha` : utilise le cache de GitHub Actions pour réutiliser les layers Docker inchangés d'un run à l'autre (accélère les builds suivants).

**Décision d'architecture importante** : build (étape 5), scan Trivy (étape 6) et push (étape 7) sont regroupés **dans le même job**, car une image construite dans un job GitHub Actions n'existe plus dans le job suivant (chaque job tourne sur une VM isolée et jetable). Il faut que Trivy et le push réutilisent l'image construite dans les mêmes steps.

---

## Étape 6 — Scan d'image (Trivy)

### But
Contrairement à l'étape 4 (dépendances *déclarées*), Trivy scanne l'**image construite** : il vérifie aussi les paquets **système** de l'image de base (Debian pour `python:3.11-slim`, Alpine pour `nginx`) — OpenSSL, perl, libxml2, etc.

### Découverte importante : les CVE "non corrigibles"
Premier scan : 2-3 `CRITICAL` par image. Mais en creusant, la majorité de ces CVE (paquets `perl-base`, `gzip`, `libacl1` côté Debian) **n'avaient encore aucun correctif publié par Debian/Alpine** (`Fixed Version` vide dans le rapport Trivy). Bloquer la CI dessus l'aurait rendue rouge en permanence, sans qu'on puisse rien y faire.

**Fix** : ajout du flag `--ignore-unfixed`, qui exclut ces CVE sans solution du calcul de blocage — pratique standard de l'industrie.

### Correction réelle appliquée (pas juste un filtre)
Pour les CVE qui **ont** un correctif disponible mais absent de l'image figée :
```dockerfile
# Python (Debian)
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
# Frontend (Alpine)
RUN apk update && apk upgrade --no-cache
```
Ces commandes tirent les derniers correctifs de sécurité disponibles **au moment du build**, indépendamment de la date de gel du tag de l'image de base. Combiné à un bump `nginx:1.25-alpine` → `nginx:1.27-alpine`, le frontend est passé de 20 vulnérabilités à **0**. Résultat final vérifié en local sur les 4 images : **0 CRITICAL**.

### Job CI (2 steps, dans le job `build`)
```yaml
- name: Trivy vulnerability scan (report HIGH+CRITICAL)
  run: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image --severity CRITICAL,HIGH --ignore-unfixed \
    billcom-${{ matrix.service }}:${{ github.sha }}

- name: Trivy vulnerability scan (block on CRITICAL)
  run: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image --severity CRITICAL --ignore-unfixed \
    --exit-code 1 billcom-${{ matrix.service }}:${{ github.sha }}
```
Le premier step **rapporte** (HIGH+CRITICAL) sans bloquer ; le second **bloque** (`--exit-code 1`) uniquement sur du CRITICAL corrigible — fidèle à la demande initiale "bloque si CRITICAL trouvé", mais rendu réellement atteignable.

---

## Étape 7 — Push vers le registre (GHCR)

### But
Publier les images validées (build + scan Trivy réussis) vers un registre accessible, pour pouvoir ensuite les déployer.

### Choix : GitHub Container Registry (GHCR)
Plutôt que Docker Hub — **zéro compte externe à créer**, authentification automatique via le `GITHUB_TOKEN` déjà fourni à chaque job.

### Points techniques
```yaml
permissions:
  contents: read
  packages: write   # nécessaire pour pouvoir publier sur GHCR

- name: Log in to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Compute lowercase image name (contrainte GHCR)
  run: echo "owner_lc=$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')" >> "$GITHUB_OUTPUT"
```
**GHCR exige des noms d'image en minuscules.** Le nom d'utilisateur GitHub (`MohamedAzizBouthelja`) contient des majuscules — sans cette conversion, le push aurait échoué avec une erreur de nom invalide.

```yaml
- name: Tag and push image to GHCR
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: |
    IMAGE=ghcr.io/${{ steps.vars.outputs.owner_lc }}/billcom-${{ matrix.service }}
    docker tag billcom-${{ matrix.service }}:${{ github.sha }} $IMAGE:${{ github.sha }}
    docker tag billcom-${{ matrix.service }}:${{ github.sha }} $IMAGE:latest
    docker push $IMAGE:${{ github.sha }}
    docker push $IMAGE:latest
```
- **Retague l'image déjà construite et scannée** plutôt que de la reconstruire — garantit qu'on publie exactement ce qui a été validé, sans risque de dérive entre le build et le push.
- **`if: github.ref == 'refs/heads/main'`** : ne pousse que sur `main`, jamais sur les Pull Requests (pas de publication de code non mergé).
- Deux tags par image : `${{ github.sha }}` (traçabilité exacte du commit) et `latest` (référence pratique).

### Point d'attention post-déploiement
Les packages GHCR sont **privés par défaut**. Pour les rendre publics (ou pour un déploiement Kubernetes qui doit les tirer), il faut soit changer la visibilité manuellement dans les paramètres du package sur GitHub, soit configurer un `imagePullSecret` Kubernetes.

---

## Étape 8 — Validation des manifests Kubernetes

### But initial vs. réalité
Le plan prévoyait un vrai déploiement (`kubectl apply`) vers Minikube. **Contrainte découverte** : Minikube tourne **localement dans WSL2** sur la machine du développeur (voir [DEMARRAGE_RAPIDE_V2.md](DEMARRAGE_RAPIDE_V2.md)). Un runner GitHub Actions est une VM cloud jetable qui ne peut **physiquement pas** atteindre ce cluster local — ni son API Kubernetes, ni son daemon Docker.

Confirmé en lisant les manifests existants ([k8s/base/user-service.yaml](k8s/base/user-service.yaml)) : `imagePullPolicy: Never`, ce qui suppose que l'image est déjà présente dans le daemon Docker de Minikube (construite localement via `eval $(minikube docker-env)`).

### Décision retenue
Plutôt qu'un vrai déploiement (qui nécessiterait un **runner self-hosted** installé sur la machine du développeur), la CI **valide seulement que les manifests sont corrects** — syntaxe YAML et conformité au schéma Kubernetes — sans tenter de les appliquer. Le déploiement réel reste une étape manuelle.

### Outil : kubeconform
```yaml
- name: Validate manifests (kubeconform, hors-ligne, sans cluster)
  run: |
    docker run --rm -v ${{ github.workspace }}/k8s/base:/k8s \
      ghcr.io/yannh/kubeconform:latest -strict -summary /k8s
```
`kubeconform` valide les manifests contre des schémas JSON Kubernetes **embarqués**, sans avoir besoin d'un cluster réel — exactement adapté à un runner GitHub cloud qui n'a accès à aucun cluster. `-strict` rejette les champs inconnus (fautes de frappe dans les clés YAML). Testé en local avant d'écrire le YAML : 23 ressources dans 12 fichiers, toutes valides.

---

## Étape 9 — Health checks (smoke test des conteneurs)

### But initial vs. réalité
Le plan prévoyait de "vérifier que les pods sont Running" — mais comme il n'y a pas de vrai déploiement Kubernetes en CI (étape 8), il n'y a pas de pods à vérifier depuis GitHub Actions.

### Réinterprétation
Démarrer **réellement** chaque image construite sur le runner (Docker y est disponible nativement) et vérifier que son endpoint `/health` répond correctement — un vrai test de fumée ("smoke test"), pas juste "le build a réussi".

### Bug applicatif majeur découvert : migration Alembic cassée sur base neuve
En testant le démarrage réel des conteneurs (avec une vraie base MySQL, comme en CI), `start.sh` plantait à l'étape `alembic upgrade head` :

```
sqlalchemy.exc.ProgrammingError: (pymysql.err.ProgrammingError)
(1146, "Table 'user_db.users' doesn't exist")
[SQL: CREATE INDEX ix_users_role ON users (`role`)]
```

**Cause racine** (trouvée en lisant les migrations) : `migrations/versions/001_initial_schema.py` a un `upgrade()` **vide** (`pass`) — dans les 3 services. Les tables sont en réalité créées par `Base.metadata.create_all(bind=engine)` dans `app/main.py`, **après** qu'Alembic ait fini de tourner. La migration `002_add_indexes.py`, elle, suppose que la table existe déjà pour y ajouter des index.

Ça n'avait jamais posé problème dans l'environnement de développement existant car ses tables avaient été créées **avant même que la migration 002 n'existe** dans le code — elle ne s'est donc jamais appliquée à une base réellement neuve.

**Correction appliquée** (aux 3 services, vérifiée avec une vraie base MySQL fraîche à chaque étape) :
```python
def upgrade() -> None:
    bind = op.get_bind()
    if not inspect(bind).has_table("users"):
        # Base neuve : create_all() (appelé juste après) créera la table
        # avec ces mêmes index déjà déclarés dans le modèle SQLAlchemy.
        return
    existing = _existing_indexes("users")
    # ... création des index si la table existe déjà
```
Vérifié que les modèles SQLAlchemy ([models.py](services/user-service/app/models.py)) déclarent déjà les mêmes `Index(...)` — donc sur une base neuve, `create_all()` crée tout correctement, indexes compris, rendant la migration 002 explicitement redondante (et donc sans danger à sauter) dans ce cas précis.

En parallèle, ajout de `transaction_per_migration=True` dans les 3 `migrations/env.py` (bonne pratique MySQL : le DDL y provoque un commit implicite, donc grouper plusieurs migrations dans une seule transaction logique n'apporte aucune garantie d'atomicité supplémentaire).

### Job CI
```yaml
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: smoketest
      MYSQL_DATABASE: smoketest_db
    ports:
      - 3306:3306
    options: >-
      --health-cmd="mysqladmin ping -h localhost -u root -psmoketest"
      --health-interval=5s --health-timeout=5s --health-retries=10
```
Un vrai conteneur MySQL éphémère (comme dans le YAML historique), démarré pour la durée du job.

```bash
docker run -d --name smoke-test --network host \
  -e DATABASE_URL="mysql+pymysql://root:smoketest@127.0.0.1:3306/smoketest_db" \
  -e JWT_SECRET="smoke-test-secret-not-for-production" \
  -e PYTHONPATH="/app" \
  billcom-${{ matrix.service }}:${{ github.sha }}
```
- **`--network host`** : fonctionne car les runners GitHub Actions tournent sous Linux (support natif du réseau host, contrairement à Docker Desktop Windows/Mac) — le conteneur atteint directement `127.0.0.1:3306` (le service MySQL).
- Boucle d'attente (jusqu'à 20 tentatives, 3s d'intervalle) sur `docker inspect --format='{{.State.Health.Status}}'`, qui lit directement le `HEALTHCHECK` défini dans le Dockerfile (étape 5) — réutilisation du même mécanisme, pas de logique dupliquée.
- `curl -f "$HEALTH_URL"` en vérification finale directe.
- Nettoyage systématique du conteneur (`if: always()`), qu'il ait réussi ou échoué.

Ce step tourne **avant** le push GHCR (étape 7) : on ne publie jamais une image qui ne démarre pas correctement.

---

## Étape 10 — Notification en cas d'échec

### But
Alerter l'équipe (ou le développeur) automatiquement quand la pipeline échoue.

### Décision retenue
Pas de webhook Slack/Discord configuré — cela nécessiterait un compte/workspace externe. GitHub envoie déjà **automatiquement un email** au propriétaire du repo quand un workflow échoue, sans configuration supplémentaire. Documenté directement dans le YAML :
```yaml
# Étape 10 - Notification d'échec : pas de webhook Slack/Discord configuré.
# GitHub envoie déjà automatiquement un email au propriétaire du repo quand un
# workflow échoue (aucune configuration nécessaire). Si un webhook est ajouté
# plus tard, prévoir un secret (ex: SLACK_WEBHOOK_URL) et un step `if: failure()`
# dans chaque job, ou un job final `needs: [...]` avec `if: failure()`.
```

---

## Récapitulatif des bugs réels trouvés et corrigés

Au-delà de la configuration CI elle-même, la mise en place de cette pipeline a permis de trouver et corriger des bugs qui existaient déjà dans le code, indépendamment de tout ce qu'on ajoutait :

| # | Bug | Où | Gravité |
|---|---|---|---|
| 1 | `Link` non importé | `frontend/src/pages/AdminPage.jsx` | Plantage à l'exécution |
| 2 | Hooks React appelés conditionnellement | `ScrollProductCanvas.jsx`, `HeroCanvas.jsx` | Violation des règles React, comportement indéfini |
| 3 | `python-dotenv`, `email-validator` absents de `requirements.txt` | 3 services | Aurait cassé tout déploiement/CI frais |
| 4 | Aucune vérification de stock à la commande | `order-service` | Survente possible |
| 5 | CVE non corrigées sur dépendances (`python-multipart`, `python-dotenv`, `requests`) | 3 services | Sécurité |
| 6 | Image de base Docker vieillissante (CVE OS) | frontend (nginx:1.25-alpine) | Sécurité |
| 7 | Migration Alembic cassée sur base de données neuve | 3 services (`002_add_indexes.py`) | Bloquant pour tout déploiement from-scratch |

---

## Fichiers créés ou modifiés pour cette phase

- [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) — le pipeline complet
- [.flake8](.flake8) — configuration flake8
- [frontend/eslint.config.js](frontend/eslint.config.js) — configuration ESLint
- `services/*/Dockerfile` — healthcheck, apt/apk upgrade
- `services/*/.dockerignore` — exclusion de `tests/`
- `services/*/migrations/versions/002_add_indexes.py` — fix base neuve
- `services/*/migrations/env.py` — `transaction_per_migration=True`
- `services/*/requirements.txt` — dépendances manquantes + versions patchées
- `services/product-service/app/seed_data.py` — données de seed extraites de `main.py`
- `services/*/tests/test_*.py` — tests corrigés/ajoutés (coverage 70%+)
- `frontend/package.json` — ESLint + dépendances
- `.gitignore` — exclusion `.coverage`, `coverage.xml`, `htmlcov/`
