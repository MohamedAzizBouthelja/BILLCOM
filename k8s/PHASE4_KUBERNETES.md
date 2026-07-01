# Phase 4 — Kubernetes avec Minikube sur Windows/WSL2

## Architecture globale

```
Windows 11
  └── WSL2 (Ubuntu 24.04)
        ├── Minikube (driver: docker)
        │     └── Cluster Kubernetes (1 nœud)
        │           └── Namespace: billcom
        │                 ├── gateway        (Nginx — SSL, routing)
        │                 ├── frontend       (React + Nginx)
        │                 ├── user-service   (FastAPI :8001)
        │                 ├── product-service(FastAPI :8002)
        │                 ├── order-service  (FastAPI :8003)
        │                 ├── mysql          (MySQL 8.0 + PVC 2Gi)
        │                 └── redis          (Redis 7 + PVC 512Mi)
        └── Docker Desktop (daemon partagé avec WSL2)
```

---

## 1. Démarrage de Minikube sur Windows/WSL2

### Prérequis installés
| Outil | Où | Version |
|-------|----|---------|
| WSL2 | Windows | Ubuntu 24.04 (distro `Ubuntu`) |
| Docker Desktop | Windows | v29.5.3 |
| Minikube | WSL2 Ubuntu | v1.38.1 |
| kubectl | WSL2 Ubuntu | v1.34.1 |

### Activation de l'intégration Docker Desktop ↔ WSL2
Dans Docker Desktop → Settings → Resources → WSL Integration :
- Activer le toggle pour la distro **Ubuntu** (celle où Minikube est installé)
- Cliquer **Apply & Restart**

Sans cette étape, Docker n'est pas accessible depuis WSL2 et Minikube échoue.

### Commande de démarrage
```bash
minikube start --driver=docker --cpus=4 --memory=4096
```

| Option | Explication |
|--------|-------------|
| `--driver=docker` | Utilise Docker comme moteur de virtualisation (plus stable que Hyper-V sur Windows) |
| `--cpus=4` | Alloue 4 CPUs au cluster |
| `--memory=4096` | Alloue 4 Go de RAM au cluster |

### Vérification du cluster
```bash
minikube status        # État de Minikube (host, kubelet, apiserver)
kubectl get nodes      # Nœuds du cluster (doit afficher minikube Ready)
```

---

## 2. Pointer Docker vers le registry Minikube

```bash
eval $(minikube docker-env)
```

**Ce que ça fait :** Cette commande exporte des variables d'environnement (`DOCKER_HOST`, `DOCKER_TLS_VERIFY`, etc.) qui redirigent le client Docker vers le daemon Docker **interne à Minikube** au lieu du Docker Desktop.

**Pourquoi c'est important :** Quand on construit une image avec `docker build`, elle est stockée dans le registry de Minikube directement. Les pods Kubernetes peuvent donc utiliser ces images sans les pousser vers Docker Hub. C'est pour ça qu'on utilise `imagePullPolicy: Never` dans les manifests.

⚠️ **Important :** Cette commande est valable uniquement pour le terminal courant. Il faut la relancer à chaque nouveau terminal.

```bash
echo $DOCKER_HOST    # Vérification : doit afficher tcp://127.0.0.1:XXXXX
```

---

## 3. Build des images Docker

```bash
cd /mnt/c/Users/pc_msi/Documents/billcom

docker build -t billcom/user-service:latest    ./services/user-service
docker build -t billcom/product-service:latest ./services/product-service
docker build -t billcom/order-service:latest   ./services/order-service
docker build -t billcom/frontend:latest        ./frontend
docker build -t billcom/gateway:latest         ./gateway
```

**Résultat :**
```
billcom/frontend:latest         113MB
billcom/gateway:latest          54.5MB
billcom/order-service:latest    223MB
billcom/product-service:latest  218MB
billcom/user-service:latest     219MB
```

---

## 4. Namespace et organisation

### Structure des fichiers créés
```
k8s/
└── base/
    ├── namespace.yaml          # Espace de noms billcom
    ├── secrets.yaml            # Mots de passe MySQL + clé JWT
    ├── configmap.yaml          # Variables d'environnement communes
    ├── mysql.yaml              # BDD MySQL + PVC
    ├── redis.yaml              # Cache Redis + PVC
    ├── user-service.yaml       # Service utilisateurs
    ├── product-service.yaml    # Service produits
    ├── order-service.yaml      # Service commandes
    ├── frontend.yaml           # Application React
    ├── gateway.yaml            # Gateway Nginx
    └── gateway-configmap.yaml  # Config Nginx pour Kubernetes
```

### Ordre de déploiement
```bash
kubectl apply -f k8s/base/namespace.yaml      # 1. Namespace d'abord
kubectl apply -f k8s/base/secrets.yaml        # 2. Secrets
kubectl apply -f k8s/base/configmap.yaml      # 3. ConfigMap
kubectl apply -f k8s/base/mysql.yaml          # 4. Base de données
kubectl apply -f k8s/base/redis.yaml          # 5. Cache
kubectl apply -f k8s/base/user-service.yaml   # 6. Services applicatifs
kubectl apply -f k8s/base/product-service.yaml
kubectl apply -f k8s/base/order-service.yaml
kubectl apply -f k8s/base/frontend.yaml
kubectl apply -f k8s/base/gateway.yaml        # 7. Gateway en dernier
```

---

## 5. Explication de chaque fichier YAML

### namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: billcom
```
**Rôle :** Crée un espace de noms isolé `billcom`. Tous les autres objets Kubernetes (pods, services, secrets) seront créés dans ce namespace. Cela permet d'isoler notre application des autres ressources du cluster.

---

### secrets.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: billcom-secrets
  namespace: billcom
type: Opaque
stringData:
  mysql-root-password: rootpassword
  mysql-user: devuser
  mysql-password: devpassword
  jwt-secret: supersecretkeychangeit
```
**Rôle :** Stocke les informations sensibles de manière sécurisée (encodées en base64 par Kubernetes). Les pods y accèdent via `secretKeyRef` au lieu d'écrire les valeurs en clair dans les manifests. Type `Opaque` = données arbitraires.

---

### configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: billcom-config
  namespace: billcom
data:
  JWT_ALGORITHM: "HS256"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"
  PRODUCT_SERVICE_URL: "http://product-service:8002"
  PYTHONPATH: "/app"
```
**Rôle :** Stocke les variables de configuration non-sensibles. Les pods y accèdent via `configMapKeyRef`. Contrairement aux Secrets, ces données ne sont pas encodées — elles sont destinées à des configurations publiques.

---

### mysql.yaml
```yaml
# PersistentVolumeClaim — stockage persistant
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes: [ReadWriteOnce]   # Un seul pod peut monter ce volume en écriture
  resources:
    requests:
      storage: 2Gi               # 2 Go alloués
---
# Deployment — gère le pod MySQL
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
  containers:
    - name: mysql
      image: mysql:8.0
      env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:         # Lit depuis le Secret (pas en clair)
              name: billcom-secrets
              key: mysql-root-password
      volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql   # Données MySQL persistées dans le PVC
      readinessProbe:                 # Kubernetes attend que MySQL soit prêt
        exec:
          command: ["mysqladmin", "ping", ...]
        initialDelaySeconds: 20
---
# Service — expose MySQL dans le cluster
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
    - port: 3306      # Les autres pods accèdent via "mysql:3306"
```
**Rôle :** Déploie MySQL avec stockage persistant. Le PVC garantit que les données survivent aux redémarrages du pod. Le Service `mysql` permet aux autres pods de se connecter via le nom DNS `mysql:3306`.

---

### redis.yaml
Structure identique à mysql.yaml mais pour Redis :
- Image `redis:7-alpine`
- PVC de 512Mi
- Port 6379
- Service `redis` accessible via `redis:6379`

---

### user-service.yaml / product-service.yaml / order-service.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      initContainers:           # Conteneur d'initialisation — s'exécute AVANT le service
        - name: wait-for-mysql
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z mysql 3306; do echo waiting; sleep 3; done']
          # Boucle jusqu'à ce que le port 3306 de mysql réponde
      containers:
        - name: user-service
          image: billcom/user-service:latest
          imagePullPolicy: Never   # Ne pas chercher sur Docker Hub — image locale Minikube
          env:
            - name: DATABASE_URL
              value: mysql+pymysql://root:rootpassword@mysql:3306/user_db
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:      # Lu depuis le Secret
                  name: billcom-secrets
                  key: jwt-secret
          readinessProbe:
            httpGet:
              path: /health
              port: 8001
```
**Rôle de l'initContainer :** Kubernetes n'a pas de `depends_on` comme Docker Compose. L'initContainer `wait-for-mysql` tourne en premier et boucle tant que MySQL ne répond pas sur le port 3306. Le conteneur principal ne démarre qu'après la réussite de l'initContainer.

**`imagePullPolicy: Never` :** Dit à Kubernetes de ne jamais essayer de télécharger l'image depuis un registry externe — elle est déjà dans le registry local de Minikube.

---

### frontend.yaml
```yaml
Deployment:
  image: billcom/frontend:latest
  containerPort: 80    # Nginx sert les fichiers React buildés

Service:
  port: 80
  targetPort: 80
  type: ClusterIP      # Accessible uniquement depuis l'intérieur du cluster
```

---

### gateway.yaml
```yaml
Deployment:
  image: billcom/gateway:latest
  volumeMounts:
    - mountPath: /etc/nginx/nginx.conf   # Remplace le nginx.conf baked dans l'image
      subPath: nginx.conf
  volumes:
    - configMap:
        name: gateway-nginx-config       # Utilise le ConfigMap Kubernetes

Service:
  type: NodePort        # Expose sur un port fixe du nœud Minikube
  ports:
    - port: 80  → nodePort: 30080
    - port: 443 → nodePort: 30443
```
**Rôle :** Le gateway est le seul point d'entrée. `NodePort` l'expose à l'extérieur du cluster. Le ConfigMap monte un nginx.conf adapté à Kubernetes (noms de services Kubernetes au lieu des noms Docker Compose).

---

### gateway-configmap.yaml
```yaml
data:
  nginx.conf: |
    resolver kube-dns.kube-system.svc.cluster.local valid=10s;
    # ↑ DNS interne Kubernetes (remplace 127.0.0.11 de Docker)

    upstream frontend_app {
      server frontend:80;
      # ↑ Nom du Service Kubernetes (remplace "ecommerce-frontend:3000" de Docker Compose)
    }
```
**Rôle :** Contient la configuration Nginx adaptée à Kubernetes. Monté comme fichier dans le pod gateway, il remplace le nginx.conf baked dans l'image Docker.

---

## 6. Problèmes rencontrés et solutions

### Problème 1 — Docker non disponible dans WSL2
**Erreur :**
```
The command 'docker' could not be found in this WSL 2 distro.
```
**Cause :** L'intégration Docker Desktop n'était pas activée pour la distro `Ubuntu`.

**Solution :** Docker Desktop → Settings → Resources → WSL Integration → activer le toggle **Ubuntu** → Apply & Restart.

---

### Problème 2 — Credential helper incompatible
**Erreur :**
```
error getting credentials - err: fork/exec /usr/bin/docker-credential-desktop.exe: exec format error
```
**Cause :** Le `docker-credential-desktop.exe` est un binaire Windows, il ne peut pas s'exécuter dans l'environnement Linux de Minikube.

**Solution :**
```bash
nano ~/.docker/config.json
# Changer : "credsStore": "desktop.exe"
# En :      "credsStore": ""
```

---

### Problème 3 — Minikube échoue au démarrage (PROVIDER_DOCKER_VERSION_EXIT_1)
**Erreur :**
```
💣 Exiting due to PROVIDER_DOCKER_VERSION_EXIT_1: "docker version" exit status 1
```
**Cause :** Docker n'était pas accessible au moment du démarrage de Minikube (même problème que Problème 1).

**Solution :** Même que Problème 1 — activer l'intégration WSL2 dans Docker Desktop.

---

### Problème 4 — ConfigMap mysql-init-sql introuvable
**Erreur :**
```
MountVolume.SetUp failed for volume "mysql-init": configmap "mysql-init-sql" not found
```
**Cause :** Le manifest `mysql.yaml` référençait un ConfigMap `mysql-init-sql` qui n'avait pas été créé. Ce ConfigMap était censé contenir le script SQL d'initialisation.

**Solution :** Suppression du volume `mysql-init` du manifest MySQL. Les services FastAPI créent leurs tables automatiquement via SQLAlchemy (`Base.metadata.create_all()`), donc le script SQL n'est pas nécessaire.

---

### Problème 5 — Services crashent (Cannot connect to MySQL)
**Erreur :**
```
pymysql.err.OperationalError: (2003, "Can't connect to MySQL server on 'mysql'")
```
**Cause :** Les services démarraient avant que MySQL soit prêt. Docker Compose avait `depends_on` avec `condition: service_healthy`, mais Kubernetes n'a pas d'équivalent natif.

**Solution :** Ajout d'un `initContainer` dans chaque service :
```yaml
initContainers:
  - name: wait-for-mysql
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z mysql 3306; do echo waiting; sleep 3; done']
```
Ce conteneur tourne en boucle jusqu'à ce que le port 3306 soit ouvert, puis le service principal démarre.

---

### Problème 6 — Bases de données inexistantes
**Erreur :**
```
pymysql.err.OperationalError: (1049, "Unknown database 'user_db'")
```
**Cause :** MySQL démarre avec une seule base `ecommerce_db` (créée par la variable `MYSQL_DATABASE`). Les bases `user_db`, `product_db`, `order_db` n'existaient pas.

**Solution :** Création manuelle via kubectl exec :
```bash
kubectl exec -it -n billcom deployment/mysql -- mysql -u root -prootpassword -e "
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS order_db;"
```

---

### Problème 7 — Gateway crash (host not found)
**Erreur :**
```
[emerg] host not found in upstream "ecommerce-frontend:3000" in /etc/nginx/nginx.conf:53
```
**Cause :** Le `nginx.conf` baked dans l'image Docker référençait :
- `ecommerce-frontend:3000` → nom de conteneur Docker Compose
- `resolver 127.0.0.11` → DNS interne Docker

Ces noms n'existent pas dans Kubernetes.

**Solution :** Création d'un ConfigMap `gateway-nginx-config` avec la configuration Nginx corrigée pour Kubernetes :
- `ecommerce-frontend:3000` → `frontend:80` (nom du Service Kubernetes)
- `resolver 127.0.0.11` → `resolver kube-dns.kube-system.svc.cluster.local`

Le ConfigMap est monté dans le pod gateway, remplaçant le nginx.conf de l'image.

---

### Problème 8 — port-forward : connection refused
**Erreur :**
```
curl: (7) Failed to connect to 127.0.0.1 port 33615 after 0 ms: Connection refused
```
**Cause :** La commande `minikube service` crée un tunnel qui nécessite que le terminal reste ouvert. En changeant de terminal, le tunnel s'est fermé.

**Solution :** Utiliser `kubectl port-forward` à la place, plus stable :
```bash
kubectl port-forward -n billcom service/gateway 8080:80 8443:443
```

---

## 7. Accès à l'application

```bash
# Terminal 1 — garder ouvert
kubectl port-forward -n billcom service/gateway 8080:80 8443:443

# Terminal 2 — tester
curl -k https://127.0.0.1:8443/health
curl -k https://127.0.0.1:8443/api/v1/products/
curl -k -X POST https://127.0.0.1:8443/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'
```

---

## 8. Commandes Kubernetes / Minikube utiles

### Cluster
```bash
minikube start --driver=docker --cpus=4 --memory=4096  # Démarrer
minikube stop                                           # Arrêter
minikube status                                         # État
minikube dashboard                                      # Interface web
eval $(minikube docker-env)                             # Pointer Docker vers Minikube
```

### Pods
```bash
kubectl get pods -n billcom                  # Liste des pods
kubectl get pods -n billcom -w               # Watch (mise à jour en temps réel)
kubectl describe pod <nom> -n billcom        # Détails + Events (debug)
kubectl logs -n billcom deployment/<nom>     # Logs d'un déploiement
kubectl logs -n billcom <pod> -f             # Logs en temps réel
kubectl exec -it -n billcom <pod> -- bash    # Shell dans un pod
```

### Déploiements
```bash
kubectl apply -f k8s/base/             # Appliquer tous les fichiers
kubectl rollout restart deployment/<nom> -n billcom   # Redémarrer un déploiement
kubectl get deployments -n billcom     # Liste des déploiements
kubectl get services -n billcom        # Liste des services
kubectl get pvc -n billcom             # PersistentVolumeClaims
```

### Debug
```bash
kubectl describe pod <nom> -n billcom        # Voir les Events (erreurs de montage, etc.)
kubectl get events -n billcom --sort-by=.lastTimestamp  # Historique des événements
kubectl port-forward -n billcom service/gateway 8080:80 8443:443  # Exposer localement
```

---

## 9. Différences Docker Compose vs Kubernetes

| Concept | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Dépendances | `depends_on: condition: service_healthy` | `initContainer` |
| Variables | `environment:` | `ConfigMap` + `Secret` |
| Stockage | `volumes:` (bind mount) | `PersistentVolumeClaim` |
| Réseau | Noms de services Docker | Noms de Services Kubernetes |
| DNS | `127.0.0.11` | `kube-dns.kube-system.svc.cluster.local` |
| Exposition | `ports:` | `NodePort` ou `Ingress` |
| Images locales | Automatique | `imagePullPolicy: Never` |
| Config fichiers | Bind mount direct | `ConfigMap` monté comme volume |
