# Guide Complet — Phase 4 (Kubernetes) & Phase 5 (Monitoring)
## Billcom sur Minikube + WSL2

Ce guide couvre toutes les étapes depuis le démarrage de Minikube jusqu'à
l'accès au frontend, Grafana et Prometheus via localhost.

---

## Prérequis installés une seule fois

| Outil | Version | Installation |
|-------|---------|-------------|
| Docker Desktop | ≥ 4.x | Avec intégration WSL2 activée |
| kubectl | ≥ 1.28 | `sudo snap install kubectl --classic` |
| Minikube | ≥ 1.32 | `curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube` |
| Helm | ≥ 3.14 | `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \| bash` |

> **Docker Desktop WSL2** : Settings → Resources → WSL Integration → activer Ubuntu

---

## ÉTAPE 1 — Corriger le MTU WSL2 (obligatoire à chaque session)

```bash
sudo ip link set dev eth0 mtu 1200
```

**Pourquoi ?** WSL2 utilise par défaut MTU=1500, ce qui cause des timeouts lors
du téléchargement de grosses images Docker ou des index Helm (>1 Mo). Réduire
à 1200 corrige les coupures réseau à l'intérieur de WSL2.

---

## ÉTAPE 2 — Démarrer Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=4096
```

**Pourquoi ?**
- `--driver=docker` : utilise Docker Desktop comme hyperviseur (pas de VM supplémentaire)
- `--cpus=4` : alloue 4 CPUs au nœud Kubernetes
- `--memory=4096` : 4 Go RAM (minimum pour faire tourner l'appli + monitoring)

```bash
minikube status
```

Vérifie que le cluster est `Running` et que l'API server répond.

---

## ÉTAPE 3 — Corriger le MTU dans Minikube (obligatoire à chaque session)

```bash
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
```

**Pourquoi ?** Le nœud Minikube (container Docker) hérite du MTU de WSL2.
Sans ce fix, les pulls d'images Docker depuis internet échouent à l'intérieur
du cluster (ImagePullBackOff).

---

## ÉTAPE 4 — Pointer Docker vers le registry Minikube

```bash
eval $(minikube docker-env)
```

**Pourquoi ?** Par défaut, `docker build` pousse les images dans le registry
Docker Desktop (hôte Windows). Cette commande redirige les variables
d'environnement Docker pour que les builds aillent dans le registry interne
de Minikube. Ainsi `imagePullPolicy: Never` dans les manifests k8s peut
trouver les images localement sans passer par Docker Hub.

> **Attention** : cette commande ne persiste que dans le terminal courant.
> Relancer dans chaque nouveau terminal WSL2.

---

## ÉTAPE 5 — Builder les images Docker (Phase 4)

```bash
cd /mnt/c/Users/pc_msi/Documents/billcom
```

Se placer à la racine du projet.

```bash
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/user-service:latest    ./services/user-service
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/product-service:latest ./services/product-service
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/order-service:latest   ./services/order-service
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/frontend:latest        ./frontend
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/gateway:latest         ./gateway
```

**Pourquoi `DOCKER_CONFIG=/tmp/docker-config` ?**
Après `eval $(minikube docker-env)`, le credential helper Docker pointe vers
`docker-credential-desktop.exe` (binaire Windows). Ce binaire est inaccessible
depuis WSL2 et fait planter le build. En pointant vers un répertoire vide,
Docker ignore le credential helper et utilise un accès anonyme, ce qui suffit
pour des images locales.

```bash
docker images | grep billcom
```

Vérifie que les 5 images sont bien présentes dans le registry Minikube.

---

## ÉTAPE 6 — Déployer l'application Billcom (Phase 4)

```bash
kubectl apply -f k8s/base/namespace.yaml
```

Crée le namespace `billcom` qui isole toutes les ressources de l'application.

```bash
kubectl apply -f k8s/base/secrets.yaml
kubectl apply -f k8s/base/configmap.yaml
```

Déploie les secrets (JWT secret) et les ConfigMaps (variables d'environnement
partagées) avant les pods qui en dépendent.

```bash
kubectl apply -f k8s/base/mysql.yaml
```

Déploie MySQL avec un PersistentVolumeClaim (stockage persistant) et un
Service ClusterIP accessible sous le nom DNS `mysql` dans le namespace.

```bash
kubectl apply -f k8s/base/redis.yaml
```

Déploie Redis utilisé par l'order-service pour le caching. Accessible sous
`redis` dans le namespace.

```bash
kubectl apply -f k8s/base/user-service.yaml
kubectl apply -f k8s/base/product-service.yaml
kubectl apply -f k8s/base/order-service.yaml
```

Déploie les 3 microservices FastAPI avec leurs Services et leurs annotations
Prometheus (`prometheus.io/scrape: "true"`).

```bash
kubectl apply -f k8s/base/frontend.yaml
```

Déploie le frontend React/Nginx (port 3000) avec son Service ClusterIP.

```bash
kubectl apply -f k8s/base/gateway-configmap.yaml
kubectl apply -f k8s/base/gateway.yaml
```

Déploie le gateway Nginx qui route les requêtes `/api/users|products|orders`
vers les microservices. Exposé en NodePort 30080 (HTTP) et 30443 (HTTPS).

```bash
kubectl get pods -n billcom
```

Attendre que tous les pods soient `Running` et `1/1` ou `2/2` (avec initContainer).
Cela peut prendre 2-3 minutes pour MySQL.

**Pods attendus :**
```
NAME                               READY   STATUS    
frontend-*                         1/1     Running
gateway-*                          1/1     Running
mysql-*                            1/1     Running
order-service-*                    1/1     Running
product-service-*                  1/1     Running
redis-*                            1/1     Running
user-service-*                     1/1     Running
```

---

## ÉTAPE 7 — Ajouter les dépôts Helm (Phase 5)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

**Pourquoi ?** Helm est le gestionnaire de paquets Kubernetes. Ces commandes
enregistrent les dépôts officiels de Prometheus/Grafana et téléchargent l'index
des charts disponibles. Nécessaire une seule fois par machine.

---

## ÉTAPE 8 — Créer le namespace monitoring

```bash
kubectl apply -f k8s/monitoring/namespace.yaml
```

Crée le namespace `monitoring` séparé du namespace `billcom` pour isoler toute
la stack d'observabilité.

---

## ÉTAPE 9 — Installer kube-prometheus-stack (Prometheus + Grafana + Alertmanager)

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f k8s/monitoring/values-prometheus-stack.yaml \
  --timeout 10m
```

**Pourquoi ce chart ?** `kube-prometheus-stack` installe en une commande :
- **Prometheus** : scrape les métriques de tous les services
- **Grafana** : visualisation des métriques et dashboards
- **Alertmanager** : gestion des alertes
- **node-exporter** : métriques CPU/RAM/disque du nœud
- **kube-state-metrics** : métriques des objets Kubernetes (pods, deployments...)

Le fichier `values-prometheus-stack.yaml` configure :
- NodePorts pour l'accès direct (Prometheus: 30090, Grafana: 30030, Alertmanager: 30093)
- Sidecar Grafana pour charger automatiquement les dashboards depuis des ConfigMaps
- Scraping de tous les ServiceMonitors de tous les namespaces

```bash
kubectl get pods -n monitoring
```

Attendre que tous les pods soient `Running`. Peut prendre 3-5 minutes.

---

## ÉTAPE 10 — Installer Loki + Promtail (agrégation des logs)

```bash
# Télécharger le chart localement (contourne les timeouts réseau WSL2)
curl -L -o /tmp/loki-stack.tgz \
  https://github.com/grafana/helm-charts/releases/download/loki-stack-2.10.3/loki-stack-2.10.3.tgz

helm install loki /tmp/loki-stack.tgz \
  --namespace monitoring \
  -f k8s/monitoring/values-loki-stack.yaml \
  --timeout 5m
```

**Pourquoi Loki ?** Loki est l'équivalent de Prometheus mais pour les logs.
Promtail (DaemonSet sur chaque nœud) collecte les logs des pods et les envoie
à Loki. Grafana peut ensuite afficher les logs avec des requêtes LogQL.

Le chart est téléchargé localement car le `helm install` direct depuis l'URL
peut timeout avec le MTU réduit de WSL2.

```bash
kubectl get pods -n monitoring | grep loki
```

Vérifier que `loki-0` et `loki-promtail-*` sont `Running`.

---

## ÉTAPE 11 — Déployer les manifests de monitoring Billcom

```bash
kubectl apply -f k8s/monitoring/service-monitors.yaml
```

Crée les **ServiceMonitors** (objets Prometheus Operator) qui indiquent à
Prometheus où scraper les métriques : user-service, product-service,
order-service et mysql-exporter. Sans ces objets, Prometheus ne saurait pas
que ces services existent.

```bash
kubectl apply -f k8s/monitoring/mysql-exporter.yaml
```

Déploie **mysqld-exporter** dans le namespace `billcom`. Il se connecte à
MySQL et expose des métriques (connexions, queries/sec, slow queries, InnoDB)
sur `/metrics:9104` que Prometheus peut scraper.

```bash
kubectl apply -f k8s/monitoring/alert-rules.yaml
```

Crée les **PrometheusRule** : 11 règles d'alerte configurées pour détecter
les erreurs HTTP, les latences élevées, les tentatives de brute-force,
les problèmes MySQL et les crashloops de pods.

```bash
kubectl apply -f k8s/monitoring/grafana-dashboards/
```

Déploie les 5 dashboards Grafana sous forme de **ConfigMaps** labelisés
`grafana_dashboard: "1"`. Le sidecar Grafana détecte automatiquement ces
ConfigMaps et les charge dans le dossier "Billcom" sans redémarrage.

---

## ÉTAPE 12 — Builder et redéployer avec métriques custom (Phase 5)

Les services FastAPI ont des métriques custom Prometheus :
- `auth_login_success_total` / `auth_login_failure_total` (user-service)
- `orders_created_total` (order-service)
- `product_views_total` (product-service)

Il faut rebuilder les images pour que les nouveaux compteurs soient actifs :

```bash
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/user-service:latest    ./services/user-service
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/product-service:latest ./services/product-service
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/order-service:latest   ./services/order-service
```

```bash
kubectl rollout restart deployment/user-service    -n billcom
kubectl rollout restart deployment/product-service -n billcom
kubectl rollout restart deployment/order-service   -n billcom
```

**Pourquoi rollout restart ?** Kubernetes ne redémarre pas automatiquement
un pod si l'image a le même tag (`:latest`). Cette commande force le redémarrage
pour charger la nouvelle image buildée.

```bash
kubectl rollout status deployment/user-service    -n billcom
kubectl rollout status deployment/product-service -n billcom
kubectl rollout status deployment/order-service   -n billcom
```

Attend que chaque rollout soit terminé avant de continuer.

---

## ÉTAPE 13 — Vérifier que tout tourne

```bash
kubectl get pods -n billcom
```

Tous les pods `billcom` doivent être `Running`.

```bash
kubectl get pods -n monitoring
```

Tous les pods `monitoring` doivent être `Running`.

**Pods monitoring attendus :**
```
alertmanager-prometheus-kube-prometheus-alertmanager-*   2/2   Running
loki-0                                                   1/1   Running
loki-promtail-*                                          1/1   Running
mysql-exporter-*                                         1/1   Running
prometheus-grafana-*                                     3/3   Running
prometheus-kube-prometheus-operator-*                    1/1   Running
prometheus-kube-prometheus-prometheus-*                  2/2   Running
prometheus-kube-state-metrics-*                          1/1   Running
prometheus-prometheus-node-exporter-*                    1/1   Running
```

---

## ÉTAPE 14 — Port-forwarding (accès depuis Windows)

Minikube tourne dans WSL2, qui est une VM isolée. Les NodePorts de Minikube
ne sont pas directement accessibles depuis le navigateur Windows. Le
**port-forward** crée un tunnel TCP entre `localhost` Windows → WSL2 → pod K8s.

Ouvrir **3 terminaux WSL2 séparés** (ou utiliser `&` pour mettre en arrière-plan) :

### Terminal 1 — Grafana

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Tunnel : `localhost:3000` → Service Grafana (port 80) → pod Grafana (port 3000)

Accès : **http://localhost:3000**
Credentials : `admin` / `billcom-grafana-2025`

### Terminal 2 — Prometheus

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Tunnel : `localhost:9090` → Service Prometheus → pod Prometheus (port 9090)

Accès : **http://localhost:9090**

### Terminal 3 — Frontend

```bash
kubectl port-forward -n billcom pod/$(kubectl get pod -n billcom -l app=frontend -o jsonpath='{.items[0].metadata.name}') 8080:3000
```

Tunnel : `localhost:8080` → pod frontend (Nginx port 3000)

Accès : **http://localhost:8080**

> **Pourquoi cibler le pod directement et pas le Service ?**
> Le Service frontend déclare `port: 3000 → targetPort: 3000`. Le port-forward
> via le Service fonctionne aussi :
> `kubectl port-forward -n billcom svc/frontend 8080:3000`

### (Optionnel) Terminal 4 — Alertmanager

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

Accès : **http://localhost:9093**

---

## ÉTAPE 15 — Vérifier les targets Prometheus

Dans Prometheus UI → **Status → Targets** :

| Target | État attendu |
|--------|-------------|
| `billcom/user-service` | UP |
| `billcom/product-service` | UP |
| `billcom/order-service` | UP |
| `billcom/mysql-exporter` | UP |
| `monitoring/alertmanager` | UP |
| `monitoring/grafana` | UP |
| `kube-system/coredns` | UP |
| `default/apiserver` | UP |
| `kubelet` | UP |

---

## ÉTAPE 16 — Dashboards Grafana disponibles

Dans Grafana → **Dashboards → Billcom** :

| Dashboard | Contenu |
|-----------|---------|
| **Billcom — Application** | Requêtes/sec, Latence P50/P95/P99, Taux d'erreur par service, État des services |
| **Billcom — Auth & Sécurité** | Connexions réussies/échouées par rôle, détection brute-force (fenêtre 5m) |
| **Billcom — MySQL** | Connexions actives, queries/sec, slow queries, InnoDB buffer pool hit rate |
| **Billcom — Minikube / Infra** | CPU/RAM du nœud, CPU/RAM par namespace, état des pods |
| **Billcom — Business KPIs** | Commandes/heure par méthode de paiement, top produits vus, nouveaux utilisateurs |

---

## Récapitulatif des URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:8080 | — |
| **Grafana** | http://localhost:3000 | admin / billcom-grafana-2025 |
| **Prometheus** | http://localhost:9090 | — |
| **Alertmanager** | http://localhost:9093 | — |

---

## Commandes utiles au quotidien

```bash
# Voir tous les pods
kubectl get pods -n billcom
kubectl get pods -n monitoring

# Logs d'un service
kubectl logs -n billcom deployment/user-service --tail=50 -f

# Redémarrer un service après modification de code
DOCKER_CONFIG=/tmp/docker-config docker build -t billcom/user-service:latest ./services/user-service
kubectl rollout restart deployment/user-service -n billcom

# Vérifier les ServiceMonitors (scraping Prometheus)
kubectl get servicemonitors -n billcom

# Voir les alertes actives
kubectl get prometheusrules -n billcom

# Arrêter Minikube proprement
minikube stop
```

---

## Dépannage rapide

| Problème | Cause | Solution |
|----------|-------|---------|
| `ImagePullBackOff` | MTU Minikube | `minikube ssh -- "sudo ip link set dev eth0 mtu 1200"` puis `kubectl delete pod <pod>` |
| `helm repo update` timeout | MTU WSL2 | `sudo ip link set dev eth0 mtu 1200` |
| Grafana CrashLoopBackOff "Only one datasource default" | Deux datasources isDefault:true | `kubectl patch configmap loki-loki-stack -n monitoring --type=merge -p '{"data":{"loki-stack-datasource.yaml":"apiVersion: 1\ndatasources:\n- name: Loki\n  type: loki\n  access: proxy\n  url: \"http://loki:3100\"\n  version: 1\n  isDefault: false\n  jsonData:\n    {}"}}' && kubectl delete pod -n monitoring -l app.kubernetes.io/name=grafana` |
| `docker build` échoue avec `exec format error` | credential helper Windows | Préfixer avec `DOCKER_CONFIG=/tmp/docker-config` |
| Port-forward `Connection refused` frontend | Nginx écoute sur 3000, pas 80 | `kubectl port-forward ... 8080:3000` (cibler port 3000) |
| Grafana port-forward `lost connection` | Pod redémarré | Relancer `kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80` |

---

## Architecture déployée

```
Windows Browser
      │
      ├── localhost:8080  ──port-forward──►  pod/frontend (Nginx:3000)
      │                                           └── /usr/share/nginx/html (React build)
      │
      ├── localhost:3000  ──port-forward──►  svc/prometheus-grafana → pod Grafana:3000
      │
      └── localhost:9090  ──port-forward──►  svc/prometheus → pod Prometheus:9090


WSL2 / Minikube — namespace: billcom
  ├── gateway (Nginx)          NodePort 30080/30443
  │     ├── /api/users    →  user-service:8001
  │     ├── /api/products →  product-service:8002
  │     └── /api/orders   →  order-service:8003
  ├── frontend (Nginx:3000)
  ├── mysql (MySQL:3306)
  ├── redis (Redis:6379)
  └── mysql-exporter (:9104)  ← scraped by Prometheus

WSL2 / Minikube — namespace: monitoring
  ├── Prometheus        :9090  → scrape toutes les 15s
  ├── Grafana           :3000  → 5 dashboards Billcom
  ├── Alertmanager      :9093  → 11 règles d'alerte
  ├── node-exporter     :9100  → métriques OS nœud
  ├── kube-state-metrics:8080  → métriques objets K8s
  ├── Loki              :3100  → agrégation logs
  └── Promtail          (DaemonSet) → collecte logs pods
```
