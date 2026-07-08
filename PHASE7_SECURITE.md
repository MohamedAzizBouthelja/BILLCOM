# Phase 7 — Sécurité / DevSecOps : Documentation complète

Ce document détaille la mise en place de la sécurité applicative, infrastructure et réseau du projet : ce qui existait déjà, ce qui a été ajouté, pourquoi, les bugs réels découverts en le faisant, et comment les vérifier.

---

## Vue d'ensemble

La sécurité est traitée par couche, du plus proche de l'utilisateur (authentification) au plus proche du cluster (réseau) :

```
7.1 Authentification  → bcrypt, rate limiting Nginx, lockout Redis, logs, alertes
7.2 MySQL              → 1 utilisateur + 1 base par service (Zero Trust au niveau DB)
7.3 Containers         → securityContext (non-root, read-only, capabilities)
7.4 Réseau             → NetworkPolicies deny-all + règles explicites
7.5 Récapitulatif      → ce document
```

**Principe directeur** : chaque contrôle a été vérifié en le faisant réellement tourner (`docker compose up` + `curl`/`docker exec`), pas seulement écrit — sauf 7.4 (NetworkPolicies), où aucun cluster minikube n'était disponible pour ce test : validation limitée au schéma (`kubeconform`) et au raisonnement sur le graphe de trafic réel du code.

**État des lieux avant cette phase** (audit du code existant) :
- `bcrypt` était déjà utilisé pour le hachage des mots de passe ([auth.py](services/user-service/app/auth.py)).
- Le rate limiting Nginx existait déjà, mais générique sur tout `/api/v1/users` (pas spécifique au login).
- Aucun lockout de compte, aucun `securityContext`, aucune `NetworkPolicy`.
- **Tous les services utilisaient `root` sur MySQL** (docker-compose *et* Kubernetes), et pointaient même vers un MySQL différent selon l'environnement (voir 7.2).

---

## 7.1 — Sécurité de l'authentification

### 7.1a — Hachage des mots de passe (déjà en place)

[services/user-service/app/auth.py](services/user-service/app/auth.py) utilise `bcrypt.hashpw`/`bcrypt.checkpw` directement (pas `passlib`, mais équivalent en sécurité — même algorithme). Rien à ajouter.

### 7.1b — Rate limiting Nginx spécifique à `/login`

**But** : la zone `auth_limit` (10 r/s) couvrait tout `/api/v1/users` (register, login, `/me`, liste admin) — un attaquant qui martèle `/login` consommait le même quota qu'un usage normal du reste de l'API, donc ni assez strict pour bloquer un brute-force ciblé, ni assez précis pour ne pas gêner le trafic légitime.

**Ce qui a été mis en place** dans [gateway/nginx.conf](gateway/nginx.conf) :
```nginx
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=10r/s;
...
location = /api/v1/users/login {
    limit_req zone=login_limit burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://user_service;
}
```
Exact-match `location =` évaluée avant la `location /api/v1/users` générique (peu importe l'ordre de déclaration, Nginx priorise les exact-match). `burst=5` (contre 20 pour la zone générale) et `limit_req_status 429` (au lieu du 503 par défaut) pour un signal explicite et facilement filtrable dans les logs/alertes.

Le ConfigMap Kubernetes équivalent ([k8s/base/gateway-configmap.yaml](k8s/base/gateway-configmap.yaml)) avait dérivé de `gateway/nginx.conf` (pas de redirect HTTPS, pas de headers de sécurité sur le futur port HTTP) — resynchronisé pour ne pas perdre cette protection en Kubernetes.

**Vérifié** : `nginx -t` dans un vrai conteneur (avec `--add-host` pour simuler la résolution DNS des upstreams).

### 7.1c — Lockout Redis après 5 échecs

**But** : le rate limiting Nginx (7.1b) limite le *débit* de requêtes, pas le nombre de tentatives sur *un compte donné* — un attaquant patient (en dessous du seuil de rate limit) pouvait toujours brute-forcer un mot de passe sans jamais être bloqué.

**Ce qui a été mis en place** dans [services/user-service/app/main.py](services/user-service/app/main.py) : un client Redis (pattern copié tel quel d'[order-service](services/order-service/app/main.py), qui l'utilisait déjà pour son cache — fail-open si Redis est indisponible, cohérent avec le choix déjà fait pour le cache de commandes).

```python
lockout_key = f"login_lockout:{username}"
# Avant toute requête DB / vérification bcrypt :
if attempts_in_redis >= LOGIN_MAX_ATTEMPTS:      # 5, configurable
    return 429 avec header Retry-After=<ttl restant>
# Sur échec :
redis_client.incr(lockout_key)
if c'est le 1er échec: redis_client.expire(lockout_key, 900)  # 15 min
# Sur succès :
redis_client.delete(lockout_key)
```

Le check de lockout est fait **avant** la requête MySQL et la vérification bcrypt (coûteuse), pour ne pas payer ce coût sur un compte déjà verrouillé.

`user-service` n'avait **aucune dépendance Redis** avant cette phase (`depends_on: redis` existait dans `docker-compose.yml` mais n'était jamais utilisé par le code) — ajout de `redis==5.0.4` à [requirements.txt](services/user-service/requirements.txt) et de `REDIS_HOST`/`REDIS_PORT` dans `docker-compose.yml` et [k8s/base/user-service.yaml](k8s/base/user-service.yaml).

**Vérifié en réel** : `docker compose up` avec un volume MySQL neuf, register + 5 échecs de login consécutifs via `curl`, 6ᵉ tentative → `429` avec `Retry-After: 852` (≈ 900s − temps écoulé). Logs confirmés (voir 7.1d).

### 7.1d — Logs de sécurité structurés

**Ce qui a été mis en place** : les logs JSON existants (`python-json-logger`) recevaient déjà les échecs de login, mais sans structure exploitable (juste un message texte). Ajout d'un champ `event` (`AUTH_SUCCESS` / `AUTH_FAILURE` / `AUTH_LOCKOUT`) et `username` sur chaque tentative :
```json
{"asctime": "...", "levelname": "WARNING", "message": "Compte verrouillé après trop d'échecs de connexion", "event": "AUTH_LOCKOUT", "username": "phase7test"}
```
Exploitable directement par Loki/Grafana (déjà en place depuis la Phase 5) pour filtrer/agréger par type d'événement.

**Point vérifié avant d'écrire le code** : `python-json-logger` n'échoue pas si un log sans `extra={...}` est émis alors que le format string déclare des champs `event`/`username` — ils sortent juste à `null`. Testé directement en Python avant l'intégration, pour éviter une régression silencieuse sur tous les logs existants qui ne passent pas ces champs.

### 7.1e — Alerte Grafana (>10 échecs / 5 min)

**Déjà en place** : `BruteForceAttempt` dans [k8s/monitoring/alert-rules.yaml](k8s/monitoring/alert-rules.yaml) correspond exactement à la spec (`increase(auth_login_failure_total[5m]) > 10`, severity critical). Rien à ajouter pour la demande initiale.

**Ajouté en complément**, sur le nouveau compteur `auth_login_lockout_total` (7.1c) :
```yaml
- alert: AccountLockoutSurge
  expr: increase(auth_login_lockout_total{namespace="billcom"}[5m]) > 5
  labels: {severity: critical}
```
Distingue un pic de trafic légitime raté (beaucoup d'échecs, mais dispersés sur des comptes différents ou sous le seuil de lockout) d'un brute-force réellement ciblé (plusieurs comptes verrouillés en peu de temps).

---

## 7.2 — Sécurité MySQL

### But

Chaque service ne doit pouvoir accéder qu'à ses propres données — pas de compte partagé, encore moins `root`, entre `user-service`, `product-service` et `order-service`.

### Bug découvert avant de commencer

`db-init/init.sql` créait une base `ecommerce_db` unique avec un compte `devuser` — **mais aucun service ne s'y connectait**. Les `DATABASE_URL` de tous les services pointaient déjà vers `user_db`/`product_db`/`order_db` (cohérent avec [CLAUDE.md](CLAUDE.md)), mais :
- en **docker-compose**, vers `root@host.docker.internal:3306` — un MySQL installé sur la machine hôte, **différent** du conteneur `mysql` du même `docker-compose.yml` ;
- en **Kubernetes**, vers `root@mysql:3306` en clair dans le manifeste (pas de Secret), sur des bases (`user_db` etc.) que rien ne créait jamais (`MYSQL_DATABASE: ecommerce_db` ne crée que `ecommerce_db`).

`db-init/init.sql` était donc du code mort : il initialisait une base et un compte qu'aucun service n'utilisait. Décision (validée avec l'utilisateur) : corriger `docker-compose.yml` pour qu'il utilise réellement son propre conteneur MySQL, et appliquer la séparation par service aux deux environnements.

### Ce qui a été mis en place

**`db-init/`** — `init.sql` remplacé par deux fichiers exécutés dans l'ordre par l'entrypoint MySQL officiel :
- [01-databases.sql](db-init/01-databases.sql) : crée `user_db`, `product_db`, `order_db` (vides — les tables sont créées par Alembic/SQLAlchemy au démarrage de chaque service, comme avant).
- [02-create-users.sh](db-init/02-create-users.sh) : crée `user_svc`/`product_svc`/`order_svc`, chacun avec `GRANT ALL` sur sa seule base. Un `.sh` (pas un `.sql`) car il a besoin de lire les mots de passe depuis les variables d'environnement du conteneur (substitution shell `${VAR}`, impossible dans un `.sql` brut).

**`docker-compose.yml`** :
- `mysql` : nouvelles variables `USER_SVC_PASSWORD`/`PRODUCT_SVC_PASSWORD`/`ORDER_SVC_PASSWORD`, suppression de `MYSQL_USER`/`MYSQL_PASSWORD`/`MYSQL_DATABASE` (le compte `devuser` unique n'existe plus).
- Les 3 services : `DATABASE_URL` pointe maintenant vers `mysql:3306` (le conteneur du compose) avec leur compte dédié, plus `depends_on: mysql: condition: service_healthy`.

**Kubernetes** :
- [k8s/base/mysql-init-configmap.yaml](k8s/base/mysql-init-configmap.yaml) : équivalent de `db-init/` monté sur `/docker-entrypoint-initdb.d` (K8s n'a pas de bind-mount de dossier local, donc ConfigMap).
- [k8s/base/secrets.yaml](k8s/base/secrets.yaml) : ajout de `user-svc-password`/`product-svc-password`/`order-svc-password` (consommés par le pod mysql) et de `user-service-database-url`/`product-service-database-url`/`order-service-database-url` (chaînes de connexion complètes, consommées directement par les Deployments applicatifs).
- Les 3 Deployments (`user-service.yaml`, `product-service.yaml`, `order-service.yaml`) : `DATABASE_URL` passe d'une valeur `root:rootpassword` en clair à un `secretKeyRef`.

### Bugs trouvés en testant

1. **Volume Docker déjà initialisé** : les scripts `docker-entrypoint-initdb.d` ne s'exécutent qu'au tout premier démarrage sur un volume vide. Le volume `mysql-data` local contenait déjà l'ancienne `ecommerce_db` d'un run précédent → recréation du volume nécessaire (confirmé avec l'utilisateur avant de le faire, perte de données de dev non utilisées de toute façon).
2. **Probes MySQL en Kubernetes utilisaient `$(MYSQL_ROOT_PASSWORD)`** (syntaxe de substitution Kubernetes) dans une probe `exec` — cette syntaxe ne s'applique qu'à `command`/`args` d'un conteneur, **pas** aux probes, qui exécutent la commande littéralement. Corrigé en `sh -c 'mysqladmin ping ... -p"$MYSQL_ROOT_PASSWORD"'`, où c'est le shell lancé *dans* le conteneur qui fait l'expansion depuis l'environnement réel.

**Vérifié en réel** (docker-compose) : volume recréé, logs confirmant l'exécution des deux scripts d'init, `SHOW GRANTS` confirmant l'isolation par base, puis `user-service` démarré dessus (migrations Alembic + register + login + lockout, voir 7.1c) sans toucher à `root`.

---

## 7.3 — Sécurité des containers (securityContext)

### But

Limiter ce qu'un conteneur compromis peut faire : pas de root, pas de capacités Linux inutiles, pas d'écriture sur le système de fichiers du conteneur.

### Ce qui a été mis en place

| Deployment | `runAsUser` | `readOnlyRootFilesystem` | `capabilities` |
|---|---|---|---|
| user/product/order-service | 1000 (`appuser`, déjà dans les Dockerfiles) | `true` | `drop: [ALL]` |
| frontend, gateway | 101 (`nginx`, utilisateur intégré à l'image de base) | `true` | `drop: [ALL]` |
| mysql | — (root au démarrage, requis) | — | `drop: [ALL]` + `add: [SETUID, SETGID, CHOWN, DAC_OVERRIDE]` |

Chaque ligne a été **testée avec l'image réellement construite**, `--read-only` et le bon `--user`, avant d'écrire le YAML — pas déduite de la théorie :

- **Python (user/product/order-service)** : fonctionne tel quel (migrations Alembic incluses), même sans `/tmp` monté. Un `emptyDir` sur `/tmp` a quand même été ajouté par prudence/cohérence.
- **nginx (frontend, gateway)** : `/var/cache/nginx` et `/run` sont root-only dans l'image `nginx:alpine` de base → `mkdir() failed (13: Permission denied)` au démarrage tant qu'ils ne sont pas soit chownés au build (`RUN chown -R nginx:nginx /var/cache/nginx /run`, appliqué aux deux Dockerfiles), soit montés en `emptyDir` en Kubernetes (les deux ont été faits : le premier pour que `docker-compose` fonctionne sans configuration additionnelle, le second parce qu'un `readOnlyRootFilesystem: true` rend le chown du build inutile — tout le système de fichiers de l'image est de toute façon en lecture seule à l'exécution).
- **mysql** : `runAsNonRoot: true` fait **échouer silencieusement** l'application de `MYSQL_ROOT_PASSWORD` (log : *"root@localhost is created with an empty password"*) — l'image officielle a besoin de démarrer root pour chown le volume de données puis dropper ses privilèges en interne (`gosu`). Testé aussi `capabilities: drop: [ALL]` pur (même en restant root) : casse `mysqld --help` (`setgid: Operation not permitted`). Les 4 capabilities remises (`SETUID`, `SETGID`, `CHOWN`, `DAC_OVERRIDE`) sont le minimum vérifié empiriquement pour que l'entrypoint officiel fonctionne.

### Bug trouvé et corrigé : gateway ne pouvait plus bind les ports 80/443

Un processus non-root ne peut pas se lier à un port <1024 sur un cluster K8s classique (`net.ipv4.ip_unprivileged_port_start` = 1024 par défaut). *Note : sur cet environnement Docker Desktop/WSL2 précis, un test direct a montré que le bind sur le port 80 réussissait quand même en non-root — ce sysctl y est visiblement assoupli. Comportement non garanti sur un vrai nœud K8s/minikube, donc traité comme s'il ne l'était pas.*

**Fix** : le conteneur écoute en interne sur des ports non privilégiés (**8080/8443** au lieu de 80/443) ; le mapping externe reste inchangé (`docker-compose` : `"80:8080"`/`"443:8443"` ; K8s : `Service.port: 80/443` → `targetPort: 8080/8443`). Transparent pour les clients — seul le port *interne* au conteneur change.

**Bug additionnel trouvé en testant** : `key.pem` (certificat TLS auto-signé, généré au build) est créé `600 root` par `openssl` — illisible par le nouvel utilisateur non-root au runtime. Corrigé par un `chown nginx:nginx` + `chmod 400` dans le Dockerfile juste après la génération.

**Vérifié en réel** : stack complète (`docker compose up`), `docker exec ... id` confirmant `uid=101(nginx)`/`uid=1000(appuser)` sur les 5 conteneurs applicatifs, puis parcours complet via HTTPS à travers le gateway : `/health`, register, login, liste produits, frontend — tous `200`.

---

## 7.4 — Network Policies (Zero Trust)

### But

Par défaut, tous les pods d'un namespace Kubernetes peuvent se joindre entre eux. Le principe Zero Trust inverse cette logique : tout est bloqué, puis chaque flux légitime est autorisé explicitement.

### Ce qui a été mis en place

[k8s/base/network-policies.yaml](k8s/base/network-policies.yaml) — 9 `NetworkPolicy` :
- `deny-all` : bloque tout Ingress/Egress dans le namespace `billcom`.
- `allow-dns-egress` : sans elle, plus aucun pod ne peut résoudre `mysql`, `redis`, etc. — le `deny-all` bloque aussi le DNS (CoreDNS, namespace `kube-system`) si on ne le rouvre pas explicitement. Piège classique, trouvé en amont plutôt qu'en debug après coup.
- Une policy par workload (`gateway`, `frontend`, `user-service`, `product-service`, `order-service`, `mysql`, `redis`), construite à partir du **graphe de trafic réel du code** (pas juste des 3 services évidents) :
  - `order-service` appelle `product-service` directement (`PRODUCT_SERVICE_URL`, vérification stock/prix à la commande) — ce que [CLAUDE.md](CLAUDE.md) ne documentait pas ("Services are isolated — they do not call each other").
  - `order-service` appelle Stripe en externe (paiement) → une règle egress dédiée `port 443` vers l'extérieur du cluster, sans quoi le paiement casserait silencieusement sous Zero Trust.
  - Le namespace `monitoring` (Prometheus, mysqld-exporter) a besoin d'un accès entrant vers les 3 services applicatifs (`/metrics`) et vers `mysql`.

### Limites connues (pas de cluster disponible pour tester)

Contrairement aux sections précédentes, **ces règles n'ont pas pu être testées sur un vrai cluster** (aucun profil minikube actif pendant cette phase) — seulement validées au schéma (`kubeconform`, 33/33 ressources valides) et vérifiées par relecture du code pour établir le graphe de trafic. Deux points à surveiller lors du prochain déploiement réel :
1. **Le CNI par défaut de minikube n'applique pas les `NetworkPolicy`** — il faut démarrer avec `minikube start --cni=calico` (ou équivalent) pour qu'elles aient un effet.
2. **Probes kubelet** : les `readinessProbe`/`livenessProbe` en `httpGet` (user/product/order-service) sont émises depuis l'IP du node, pas depuis un pod — selon le CNI, elles peuvent ne pas être automatiquement exemptées d'un `deny-all` ingress. Si des pods restent bloqués en `NotReady` après application des policies, c'est le premier suspect.

---

## Récapitulatif sécurité par couche

| Couche | Mécanisme | Protège contre | Quand | État |
|---|---|---|---|---|
| Auth | JWT + bcrypt | Accès non autorisés | Chaque requête | ✅ déjà en place |
| Auth (brute-force) | Rate limiting Nginx + lockout Redis | Credential stuffing / brute-force | Chaque tentative de login | ✅ ajouté (7.1b/c) |
| RBAC App | FastAPI `Depends` | Routes admin/user | Runtime | ✅ déjà en place |
| Code | Bandit | Vulnérabilités Python (secrets en dur, eval, etc.) | CI, avant build | ✅ déjà en place (Phase 6) |
| Code | SonarQube | Qualité/sécurité statique approfondie | CI | ❌ hors périmètre (nécessite un compte externe, comme OWASP Dependency-Check en Phase 6) |
| Image | Trivy | CVE dans l'OS et les libs de l'image | CI, après build | ✅ déjà en place (Phase 6) |
| Runtime K8s | Falco | Comportements suspects en production | Prod, 24/7 | ❌ hors périmètre de cette phase (non demandé dans 7.1-7.5) |
| Réseau | NetworkPolicies | Mouvements latéraux | Cluster | ✅ ajouté (7.4) — non testé faute de cluster |
| DB | Secrets K8s + comptes dédiés par service | Fuite/abus de credentials MySQL | Deployment | ✅ ajouté (7.2) |
| Containers | securityContext (non-root, read-only, capabilities) | Escalade de privilèges depuis un conteneur compromis | Déploiement | ✅ ajouté (7.3) |
| Nginx | Rate limiting | Brute-force / déni de service applicatif | Production | ✅ déjà en place, durci (7.1b) |

---

## Bugs réels trouvés et corrigés (au-delà de la demande initiale)

| # | Bug | Où | Gravité |
|---|---|---|---|
| 1 | `docker-compose` pointait vers un MySQL hôte différent du conteneur `mysql` du même fichier | `docker-compose.yml` | Confusion totale sur quelle base est réellement utilisée |
| 2 | `db-init/init.sql` initialisait une base (`ecommerce_db`) et un compte (`devuser`) que plus aucun service n'utilisait | `db-init/init.sql` | Code mort trompeur |
| 3 | Probes MySQL K8s utilisaient `$(VAR)`, qui ne s'applique pas aux probes `exec` | `k8s/base/mysql.yaml` | Probes auraient échoué avec le vrai mot de passe |
| 4 | `key.pem` généré `600 root`, illisible par le nouvel utilisateur non-root du conteneur | `gateway/Dockerfile` | Gateway n'aurait pas démarré (TLS) |
| 5 | `/var/cache/nginx` et `/run` root-only dans l'image `nginx:alpine` de base | `gateway/Dockerfile`, `frontend/Dockerfile` | Conteneur non-root n'aurait pas démarré |
| 6 | ConfigMap K8s du gateway avait dérivé du `nginx.conf` réel (pas de rate-limit login, pas de redirect HTTPS) | `k8s/base/gateway-configmap.yaml` | Protection brute-force absente en K8s malgré sa présence en local |
| 7 | `order-service` appelle `product-service` et Stripe en externe, non documenté dans `CLAUDE.md` ("services isolés") | découvert en construisant le graphe de trafic pour 7.4 | Des NetworkPolicies basées sur la doc auraient cassé la vérification de stock et le paiement |

---

## Fichiers créés ou modifiés pour cette phase

- [gateway/nginx.conf](gateway/nginx.conf), [gateway/Dockerfile](gateway/Dockerfile) — rate limiting login, ports non privilégiés, permissions certs/cache
- [frontend/Dockerfile](frontend/Dockerfile) — utilisateur non-root, permissions cache
- [services/user-service/app/main.py](services/user-service/app/main.py), [config.py](services/user-service/app/config.py), [requirements.txt](services/user-service/requirements.txt) — lockout Redis, logs structurés
- [db-init/01-databases.sql](db-init/01-databases.sql), [db-init/02-create-users.sh](db-init/02-create-users.sh) — remplacent `db-init/init.sql`
- [docker-compose.yml](docker-compose.yml) — MySQL par service, ports gateway, Redis user-service
- [k8s/base/secrets.yaml](k8s/base/secrets.yaml), [k8s/base/mysql-init-configmap.yaml](k8s/base/mysql-init-configmap.yaml), [k8s/base/mysql.yaml](k8s/base/mysql.yaml) — MySQL par service + securityContext
- [k8s/base/user-service.yaml](k8s/base/user-service.yaml), [product-service.yaml](k8s/base/product-service.yaml), [order-service.yaml](k8s/base/order-service.yaml) — DATABASE_URL via Secret, securityContext
- [k8s/base/frontend.yaml](k8s/base/frontend.yaml), [gateway.yaml](k8s/base/gateway.yaml), [gateway-configmap.yaml](k8s/base/gateway-configmap.yaml) — securityContext, ports, resynchronisation
- [k8s/base/network-policies.yaml](k8s/base/network-policies.yaml) — nouveau, Zero Trust
- [k8s/monitoring/alert-rules.yaml](k8s/monitoring/alert-rules.yaml) — alerte `AccountLockoutSurge`
