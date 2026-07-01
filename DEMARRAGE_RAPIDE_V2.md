# Démarrage Rapide — Phase 5 (Stack complète) — V2

> Ce guide te permet de démarrer toute la stack (Kubernetes + Monitoring + Stripe)
> de façon autonome à chaque nouvelle session.

---

## Prérequis (déjà installés)

- Docker Desktop ouvert avec intégration WSL2 activée
- WSL2 (Ubuntu) actif
- Minikube, kubectl, Helm installés

---

## ÉTAPE 1 — Ouvrir WSL2 et se placer dans le projet

```bash
cd /mnt/c/Users/pc_msi/Documents/billcom
```

---

## ÉTAPE 2 — Corriger le MTU (obligatoire à chaque session)

```bash
sudo ip link set dev eth0 mtu 1200
```

**Pourquoi ?** WSL2 a un MTU de 1500 par défaut, ce qui provoque des timeouts
lors des téléchargements d'images Docker. Ce fix est obligatoire à chaque redémarrage WSL2.

---

## ÉTAPE 3 — Démarrer Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=4096
```

---

## ÉTAPE 4 — Corriger le MTU dans le nœud Minikube

```bash
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
```

---

## ÉTAPE 5 — Pointer Docker vers Minikube

```bash
eval $(minikube docker-env)
```

**Pourquoi ?** Sans cette commande, les `docker build` construisent les images
dans Docker Desktop et non dans Minikube — les pods ne les trouveront pas.

---

## ÉTAPE 6 — Rebuild toutes les images (si code modifié)

> Sauter cette étape si le code n'a pas changé depuis la dernière session.

```bash
# Frontend — build dans PowerShell Windows d'abord :
#   cd C:\Users\pc_msi\Documents\billcom\frontend
#   npm run build

# Puis dans WSL2 :
docker build -f - -t billcom/frontend:latest /mnt/c/Users/pc_msi/Documents/billcom <<'EOF'
FROM nginx:1.25-alpine
COPY frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EOF

docker build -t billcom/user-service:latest \
  /mnt/c/Users/pc_msi/Documents/billcom/services/user-service

docker build -t billcom/product-service:latest \
  /mnt/c/Users/pc_msi/Documents/billcom/services/product-service

docker build -t billcom/order-service:latest \
  /mnt/c/Users/pc_msi/Documents/billcom/services/order-service
```

---

## ÉTAPE 7 — Appliquer les manifests Kubernetes

```bash
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/secrets.yaml
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/mysql.yaml
kubectl apply -f k8s/base/redis.yaml
kubectl apply -f k8s/base/user-service.yaml
kubectl apply -f k8s/base/product-service.yaml
kubectl apply -f k8s/base/order-service.yaml
kubectl apply -f k8s/base/gateway-configmap.yaml
kubectl apply -f k8s/base/gateway.yaml
kubectl apply -f k8s/base/frontend.yaml
```

---

## ÉTAPE 8 — Vérifier que tous les pods sont Running

```bash
kubectl get pods -n billcom
```

Attendre que tous soient `1/1 Running` (MySQL peut prendre 1-2 minutes).

**Pods attendus dans `billcom` :**
```
frontend-*          1/1   Running
gateway-*           1/1   Running
mysql-*             1/1   Running
mysql-exporter-*    1/1   Running
order-service-*     1/1   Running
product-service-*   1/1   Running
redis-*             1/1   Running
user-service-*      1/1   Running
```

```bash
kubectl get pods -n monitoring
```

**Pods attendus dans `monitoring` :**
```
alertmanager-*                            2/2   Running
loki-0                                    1/1   Running
prometheus-grafana-*                      3/3   Running
prometheus-kube-prometheus-operator-*     1/1   Running
prometheus-kube-prometheus-prometheus-*   2/2   Running
```

---

## ÉTAPE 9 — Lancer les port-forwards

Ouvrir **3 terminaux WSL2 séparés**, une commande par terminal :

### Terminal 1 — Gateway HTTPS (l'application complète)

```bash
kubectl port-forward -n billcom svc/gateway 8443:443
```

Tunnel : `https://localhost:8443` → toute la stack via nginx

### Terminal 2 — Grafana (dashboards monitoring)

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

### Terminal 3 — Prometheus (métriques brutes)

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

---

## ÉTAPE 10 — Accéder aux interfaces

| Interface | URL | Identifiants |
|-----------|-----|-------------|
| **Application GadgetZone** | https://localhost:8443 | `admin@billcom.com` / `admin123` |
| **Grafana** | http://localhost:3000 | `admin` / `billcom-grafana-2025` |
| **Prometheus** | http://localhost:9090 | — |

> Le navigateur affichera un avertissement SSL (certificat auto-signé).
> Clique sur **Avancé → Continuer vers localhost**.

---

## Résumé en 1 bloc (session rapide — sans rebuild)

```bash
# Dans WSL2
sudo ip link set dev eth0 mtu 1200
minikube start --driver=docker --cpus=4 --memory=4096
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
eval $(minikube docker-env)
kubectl get pods -n billcom

# Terminal 1 — Application
kubectl port-forward -n billcom svc/gateway 8443:443

# Terminal 2 — Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Terminal 3 — Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

---

## Fonctionnalités disponibles (Phase 5)

| Fonctionnalité | Endpoint |
|----------------|----------|
| Recherche produits | `GET /api/v1/products?q=iphone&category=smartphones&sort=rating` |
| Filtres avancés | `GET /api/v1/products?min_price=10000&max_price=100000&badge=HOT` |
| Avis produits (lecture) | `GET /api/v1/products/{id}/reviews` |
| Ajouter un avis | `POST /api/v1/products/{id}/reviews` (login requis) |
| Paiement Stripe | `POST /api/v1/orders/stripe/checkout` (login requis) |
| Vérifier paiement | `GET /api/v1/orders/stripe/verify/{session_id}` |

**Carte de test Stripe :**
```
Numéro : 4242 4242 4242 4242
Date   : toute date future (ex: 12/29)
CVC    : n'importe (ex: 123)
```

---

## Problèmes fréquents

### Port 8443 déjà utilisé

```bash
pkill -f "port-forward.*8443"
sleep 1
kubectl port-forward -n billcom svc/gateway 8443:443
```

### Token JWT expiré sur le site

Se déconnecter et se reconnecter sur `https://localhost:8443`
avec `admin@billcom.com` / `admin123`.

### Pod en CrashLoopBackOff

```bash
kubectl logs <nom-du-pod> -n billcom --tail=30
kubectl delete pod <nom-du-pod> -n billcom
```

### ImagePullBackOff après redémarrage

```bash
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
eval $(minikube docker-env)
# Rebuilder l'image concernée, puis :
kubectl rollout restart deployment/<nom> -n billcom
```

### Port-forward qui se déconnecte

Le pod a redémarré. Relancer la même commande dans le terminal.

### Grafana CrashLoopBackOff (conflit datasource)

```bash
kubectl patch configmap loki-loki-stack -n monitoring --type=merge -p \
  '{"data":{"loki-stack-datasource.yaml":"apiVersion: 1\ndatasources:\n- name: Loki\n  type: loki\n  access: proxy\n  url: \"http://loki:3100\"\n  version: 1\n  isDefault: false\n  jsonData:\n    {}"}}'
kubectl delete pod -n monitoring -l app.kubernetes.io/name=grafana
```

---

## Arrêt propre en fin de session

```bash
minikube stop
```

Les déploiements sont conservés — au prochain `minikube start`, tout reprend
sans réinstaller.
