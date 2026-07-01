# Phase 5 — Monitoring & Observabilité

## Architecture de la stack

```
WSL2 / Minikube — namespace: monitoring
  ├── kube-prometheus-stack (Helm)
  │     ├── Prometheus          :9090  → NodePort 30090
  │     ├── Grafana             :3000  → NodePort 30030
  │     ├── Alertmanager        :9093  → NodePort 30093
  │     ├── node-exporter       (DaemonSet — métriques OS)
  │     └── kube-state-metrics  (métriques K8s)
  └── loki-stack (Helm)
        ├── Loki                :3100  (agrégation des logs)
        └── Promtail            (DaemonSet — collecte logs pods)

namespace: billcom
  ├── mysql-exporter  :9104  (métriques MySQL)
  └── services FastAPI /metrics  (prometheus_fastapi_instrumentator)
```

## Métriques custom ajoutées aux services

| Métrique | Service | Labels | Description |
|----------|---------|--------|-------------|
| `auth_login_success_total` | user-service | `role` | Connexions réussies |
| `auth_login_failure_total` | user-service | — | Échecs de connexion |
| `auth_register_total` | user-service | `role` | Nouvelles inscriptions |
| `orders_created_total` | order-service | `payment_method` | Commandes créées |
| `product_views_total` | product-service | `product_id`, `category` | Vues de fiches produit |

---

## 1. Prérequis

```bash
# Dans WSL2 — vérifier que Minikube tourne avec assez de ressources
minikube start --driver=docker --cpus=4 --memory=6144
minikube status

# Ajouter les dépôts Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

> **Mémoire** : la stack de monitoring consomme ~1,5 Go de RAM.
> Si votre Minikube était déjà démarré avec 4 Go, augmentez à 6 Go :
> `minikube stop && minikube start --driver=docker --cpus=4 --memory=6144`

---

## 2. Créer le namespace monitoring

```bash
kubectl apply -f k8s/monitoring/namespace.yaml
```

---

## 3. Installer kube-prometheus-stack

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f k8s/monitoring/values-prometheus-stack.yaml \
  --timeout 10m

# Vérifier que tout tourne
kubectl get pods -n monitoring
```

Pods attendus :
```
prometheus-grafana-*                    Running
prometheus-kube-prometheus-operator-*  Running
prometheus-kube-prometheus-prometheus-* Running
prometheus-kube-prometheus-alertmanager-* Running
prometheus-kube-state-metrics-*         Running
prometheus-prometheus-node-exporter-*   Running
```

---

## 4. Installer Loki + Promtail

```bash
helm install loki grafana/loki-stack \
  --namespace monitoring \
  -f k8s/monitoring/values-loki-stack.yaml \
  --timeout 5m

kubectl get pods -n monitoring | grep loki
```

---

## 5. Déployer les manifests billcom

```bash
# ServiceMonitors (dits à Prometheus où scraper)
kubectl apply -f k8s/monitoring/service-monitors.yaml

# MySQL exporter dans le namespace billcom
kubectl apply -f k8s/monitoring/mysql-exporter.yaml

# Règles d'alerte
kubectl apply -f k8s/monitoring/alert-rules.yaml

# Dashboards Grafana (ConfigMaps auto-chargés par le sidecar)
kubectl apply -f k8s/monitoring/grafana-dashboards/
```

---

## 6. Rebuilder les images FastAPI (métriques custom)

```bash
# Dans WSL2, pointez Docker vers le registry Minikube
eval $(minikube docker-env)

docker build -t billcom/user-service:latest    ./services/user-service
docker build -t billcom/product-service:latest ./services/product-service
docker build -t billcom/order-service:latest   ./services/order-service

# Redémarrer les deployments pour prendre les nouvelles images
kubectl rollout restart deployment/user-service    -n billcom
kubectl rollout restart deployment/product-service -n billcom
kubectl rollout restart deployment/order-service   -n billcom

kubectl rollout status deployment/user-service    -n billcom
kubectl rollout status deployment/product-service -n billcom
kubectl rollout status deployment/order-service   -n billcom
```

---

## 7. Accéder aux UIs

```bash
# Récupérer l'IP de Minikube
minikube ip   # ex: 192.168.49.2
```

| Interface | URL | Credentials |
|-----------|-----|-------------|
| Grafana | `http://<minikube-ip>:30030` | `admin` / `billcom-grafana-2025` |
| Prometheus | `http://<minikube-ip>:30090` | — |
| Alertmanager | `http://<minikube-ip>:30093` | — |

**Ou via minikube service (ouvre le navigateur automatiquement) :**
```bash
minikube service prometheus-grafana -n monitoring
minikube service prometheus-kube-prometheus-prometheus -n monitoring
```

---

## 8. Vérifier la collecte de métriques

### Prometheus scrape targets
Dans Prometheus UI → **Status > Targets** :
- `billcom/user-service` → UP
- `billcom/product-service` → UP
- `billcom/order-service` → UP
- `billcom/mysql-exporter` → UP

### Tester les métriques custom dans Prometheus
```promql
# Connexions réussies par rôle
auth_login_success_total{namespace="billcom"}

# Commandes créées
orders_created_total{namespace="billcom"}

# Produits les plus vus (top 5 sur 1h)
topk(5, sum(increase(product_views_total{namespace="billcom"}[1h])) by (product_id))

# Taux d'erreur HTTP
rate(http_request_duration_seconds_count{namespace="billcom", status_code=~"5.."}[5m])
```

### Vérifier les logs Loki dans Grafana
Grafana → **Explore** → Source: **Loki**
```logql
{namespace="billcom", app="user-service"} | json
{namespace="billcom"} |= "ERROR"
{namespace="billcom", app="order-service"} | json | level="ERROR"
```

---

## 9. Dashboards Grafana disponibles

Les 5 dashboards sont dans le dossier **Billcom** (auto-provisionné) :

| Dashboard | UID | Contenu |
|-----------|-----|---------|
| Application | `billcom-application` | req/sec, latence P50/P95/P99, taux d'erreur par service |
| Auth & Sécurité | `billcom-auth` | logins/inscriptions par rôle, brute-force, taux d'échec |
| MySQL | `billcom-mysql` | connexions, queries/sec, slow queries, InnoDB buffer pool |
| Minikube / Infra | `billcom-minikube` | CPU/RAM/disque node, CPU+RAM par namespace, état pods |
| Business KPIs | `billcom-business` | commandes/heure, top produits, répartition paiements |

---

## 10. Configurer les alertes (email ou Slack)

Editer [k8s/monitoring/values-prometheus-stack.yaml](values-prometheus-stack.yaml), section `alertmanager.config.receivers` :

**Slack :**
```yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
        channel: '#alerts-billcom'
        send_resolved: true
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
```

**Email :**
```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@billcom.local'
  smtp_auth_username: 'you@gmail.com'
  smtp_auth_password: 'your-app-password'

receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'ops@billcom.local'
        send_resolved: true
```

Puis appliquer :
```bash
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f k8s/monitoring/values-prometheus-stack.yaml
```

---

## 11. Alertes configurées

| Alerte | Seuil | Sévérité |
|--------|-------|----------|
| `HighErrorRate` | > 5% d'erreurs 5xx sur 2m | warning |
| `HighLatencyP95` | P95 > 2s sur 3m | warning |
| `ServiceDown` | service injoignable 1m | critical |
| `BruteForceAttempt` | > 10 échecs login en 5m | critical |
| `HighLoginFailureRate` | > 0,5 échecs/s sur 2m | warning |
| `MySQLTooManyConnections` | > 80 connexions 2m | warning |
| `MySQLSlowQueries` | > 0,1 slow query/s 5m | warning |
| `MySQLDown` | mysql_up == 0 | critical |
| `NodeHighCPU` | CPU > 85% sur 5m | warning |
| `NodeHighMemory` | RAM > 90% sur 5m | critical |
| `PodCrashLooping` | > 3 restarts en 15m | critical |

---

## 12. Structure des fichiers

```
k8s/monitoring/
├── namespace.yaml                          # Namespace monitoring
├── service-monitors.yaml                   # ServiceMonitor CRDs (scraping)
├── mysql-exporter.yaml                     # mysqld-exporter dans billcom
├── alert-rules.yaml                        # PrometheusRule — 11 alertes
├── values-prometheus-stack.yaml            # Helm values — Prometheus + Grafana + Alertmanager
├── values-loki-stack.yaml                  # Helm values — Loki + Promtail
└── grafana-dashboards/
    ├── 01-application-dashboard.yaml       # HTTP métriques par service
    ├── 02-auth-dashboard.yaml              # Auth, rôles, brute-force
    ├── 03-mysql-dashboard.yaml             # MySQL performance
    ├── 04-minikube-dashboard.yaml          # Infra K8s / node
    └── 05-business-dashboard.yaml          # Commandes, produits, KPIs
```

---

## 13. Désinstallation

```bash
helm uninstall prometheus -n monitoring
helm uninstall loki       -n monitoring
kubectl delete -f k8s/monitoring/mysql-exporter.yaml
kubectl delete -f k8s/monitoring/service-monitors.yaml
kubectl delete -f k8s/monitoring/alert-rules.yaml
kubectl delete -f k8s/monitoring/grafana-dashboards/
kubectl delete namespace monitoring
```
