# 📊 Explication Détaillée de la Phase 5 — Monitoring & Observabilité

Ce document propose une explication complète et approfondie de la stack d'observabilité et de monitoring mise en place dans le projet **Billcom**, en détaillant l'architecture, le rôle de chaque fichier de configuration, le fonctionnement des commandes et le code de télémétrie associé.

---

## 1. Architecture Générale de la Stack

La stack d'observabilité est segmentée en deux namespaces Kubernetes principaux :

```
WSL2 / Minikube — namespace: monitoring
  ├── kube-prometheus-stack (Helm)
  │     ├── Prometheus          :9090  → NodePort 30090 (Stockage & Scrape des métriques)
  │     ├── Grafana             :3000  → NodePort 30030 (Visualisation)
  │     ├── Alertmanager        :9093  → NodePort 30093 (Gestion/Acheminement des alertes)
  │     ├── node-exporter       (DaemonSet — collecte des métriques OS/Hardware du Node)
  │     └── kube-state-metrics  (métriques d'état des objets Kubernetes)
  └── loki-stack (Helm)
        ├── Loki                :3100  (base de données de centralisation de logs)
        └── Promtail            (DaemonSet — collecte et pousse les logs des pods)

namespace: billcom
  ├── mysql-exporter  :9104  (métriques MySQL)
  └── services FastAPI /metrics  (métriques HTTP standards et custom via prometheus_fastapi_instrumentator)
```

---

## 2. Analyse des Fichiers de Configuration et Déploiements

### 📂 1. Définition du Namespace
* **Fichier :** [namespace.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/namespace.yaml)
* **Description :** Crée un namespace isolé nommé `monitoring` afin d'héberger la stack de supervision séparément de l'application métier `billcom`.

### 📂 2. Configuration Helm Prometheus & Grafana
* **Fichier :** [values-prometheus-stack.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/values-prometheus-stack.yaml)
* **Description :** Personnalise le chart Helm `kube-prometheus-stack` pour s'adapter à Minikube :
  - **Prometheus** :
    - `serviceMonitorSelector`: `{}` désactive le filtre de labels par défaut. Prometheus collecte ainsi les données de tous les objets `ServiceMonitor` du cluster, peu importe leur namespace.
    - Configuration de rétention des données temporelles à **15 jours** ou **8 Go** maximum de stockage.
    - Provisionnement d'un volume persistant de **10 Go** (`storageSpec`).
    - Exposition de l'UI Prometheus en `NodePort` sur le port **30090**.
  - **Alertmanager** :
    - Configuration de routes avec sévérités `critical` et `warning`.
    - Déclaration de destinataires (`receivers`) comme des webhooks Slack ou serveurs SMTP email (commentés par défaut).
    - Exposition en `NodePort` sur le port **30093**.
  - **Grafana** :
    - Mot de passe administrateur fixé à `billcom-grafana-2025`.
    - Exposition en `NodePort` sur le port **30030**.
    - Configuration d'un **Sidecar** (`dashboards.enabled: true`) avec le label `grafana_dashboard: "1"`. Ce sidecar détecte dynamiquement les ConfigMaps de dashboards présents dans tous les namespaces du cluster et les importe directement dans Grafana.
    - Enregistrement des sources de données par défaut : **Prometheus** (`http://prometheus-kube-prometheus-prometheus:9090`) et **Loki** (`http://loki:3100`).
  - **Désactivations** : Désactive les exporteurs liés à un vrai cluster de production multi-nœuds (`kubeEtcd`, `kubeControllerManager` et `kubeScheduler`) pour économiser des ressources sur Minikube.

### 📂 3. Configuration Helm Loki & Promtail
* **Fichier :** [values-loki-stack.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/values-loki-stack.yaml)
* **Description :** Configure le cycle de centralisation des journaux :
  - **Loki** :
    - Fixe une persistance de stockage des logs de **5 Go**.
    - Période de rétention des logs configurée à **72h** (`retention_period: 72h`).
  - **Promtail** :
    - Ciblage restreint au namespace de production `billcom` (`namespaces: names: - billcom`).
    - **Pipeline de parsing JSON** : Les logs des services FastAPI étant structurés en JSON, Promtail extrait automatiquement le niveau de log (`level` à partir du champ `levelname`) et le nom de l'enregistreur (`logger` depuis le champ `name`) pour les ajouter en tant que labels d'index dans Loki.
    - Injecte également les labels Kubernetes essentiels (`app`, `namespace`, `pod`, `container`) sur chaque flux de log envoyé à Loki.

### 📂 4. Les Service Monitors (Scraping)
* **Fichier :** [service-monitors.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/service-monitors.yaml)
* **Description :** Définit 4 objets de type `ServiceMonitor` (CRD fournie par Prometheus Operator) pour indiquer à Prometheus où récupérer les métriques :
  - **`user-service`** : Scrape toutes les 15 secondes sur le port `http` et l'endpoint `/metrics`.
  - **`product-service`** : Scrape toutes les 15 secondes sur le port `http` et l'endpoint `/metrics`.
  - **`order-service`** : Scrape toutes les 15 secondes sur le port `http` et l'endpoint `/metrics`.
  - **`mysql-exporter`** : Scrape toutes les 30 secondes sur le port `http` et l'endpoint `/metrics`.

### 📂 5. MySQL Exporter
* **Fichier :** [mysql-exporter.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/mysql-exporter.yaml)
* **Description :** Assure la collecte des indicateurs de la base de données :
  - Crée un `Secret` Kubernetes contenant le fichier de configuration `my.cnf` avec les informations d'authentification root de MySQL.
  - Déploie un conteneur tiers (`prom/mysqld-exporter:v0.15.1`) configuré pour se connecter à MySQL et exposer les métriques système du SGBD.
  - Expose un service interne sur le port `9104`.

### 📂 6. Règles d'Alerte Prometheus
* **Fichier :** [alert-rules.yaml](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/alert-rules.yaml)
* **Description :** Configure 11 alertes au format PromQL, prêtes à être envoyées vers l'Alertmanager :
  - **HTTP** :
    - `HighErrorRate` (Warning) : Plus de 5 % des requêtes HTTP échouent en 5xx sur une période glissante de 2 min.
    - `HighLatencyP95` (Warning) : Le 95e percentile des requêtes dépasse 2 secondes pendant 3 min.
    - `ServiceDown` (Critical) : Un service ne répond plus aux requêtes de scrap de Prometheus depuis 1 min.
  - **Authentification** :
    - `BruteForceAttempt` (Critical) : Plus de 10 échecs de connexion en 5 min.
    - `HighLoginFailureRate` (Warning) : Le taux global d'échecs de connexion dépasse 0,5 par seconde sur 2 min.
    - `AccountLockoutSurge` (Critical) : Plus de 5 verrouillages de compte (via lockout Redis) détectés en 5 min.
  - **MySQL** :
    - `MySQLTooManyConnections` (Warning) : Plus de 80 connexions actives en 2 min.
    - `MySQLSlowQueries` (Warning) : Plus de 0,1 requête lente par seconde sur 5 min.
    - `MySQLDown` (Critical) : MySQL est indisponible.
  - **Infrastructure/Cluster** :
    - `NodeHighCPU` (Warning) : Charge CPU globale du node Minikube supérieure à 85 % pendant 5 min.
    - `NodeHighMemory` (Critical) : Utilisation RAM globale du node supérieure à 90 % pendant 5 min.
    - `PodCrashLooping` (Critical) : Un pod a redémarré plus de 3 fois au cours des 15 dernières minutes.

### 📂 7. Dashboards Grafana Préconfigurés
* **Fichiers dans le dossier :** [k8s/monitoring/grafana-dashboards/](file:///c:/Users/pc_msi/Documents/billcom/k8s/monitoring/grafana-dashboards/)
* **Description :** Cinq fichiers ConfigMaps contenant les configurations de dashboards importés automatiquement par le sidecar Grafana :
  - **01-application-dashboard.yaml** : Visualisation du trafic HTTP (TPS, répartition des codes d'état 2xx/3xx/4xx/5xx, histogrammes de latences).
  - **02-auth-dashboard.yaml** : Statistiques d'authentification, de création de comptes, logs de brute-force et blocages.
  - **03-mysql-dashboard.yaml** : Performance de la base de données (débit de lecture/écriture, lenteur de requêtes, threads).
  - **04-minikube-dashboard.yaml** : État physique du cluster Minikube (utilisation CPU/RAM des pods, statuts des pods, usage disque).
  - **05-business-dashboard.yaml** : Dashboards orientés métier (nombre de commandes, chiffres d'affaires simulés, répartition des moyens de paiement Stripe/Cash, top 5 des produits consultés).

---

## 3. Rôle et Fonctionnement des Commandes de Déploiement

### Étape 1 : Prérequis Minikube
```bash
minikube start --driver=docker --cpus=4 --memory=6144
```
* **Explication :** Démarre Minikube en augmentant les ressources par défaut. La stack complète de monitoring consommant environ 1,5 Go de RAM à elle seule, il est requis d'allouer au moins 6 Go de RAM et 4 CPU virtuels au cluster.

### Étape 2 : Configuration des dépôts Helm
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```
* **Explication :** Enregistre les répertoires officiels contenant les charts d'installation de Prometheus-operator et de Loki-stack, puis télécharge leurs métadonnées à jour.

### Étape 3 : Installation des Charts Helm
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f k8s/monitoring/values-prometheus-stack.yaml \
  --timeout 10m
```
* **Explication :** Installe toute la suite de monitoring (Prometheus, Alertmanager, Grafana, Node-exporter, Kube-state-metrics) dans le namespace `monitoring` (qui est créé s'il n'existe pas) en appliquant nos configurations personnalisées.

```bash
helm install loki grafana/loki-stack \
  --namespace monitoring \
  -f k8s/monitoring/values-loki-stack.yaml \
  --timeout 5m
```
* **Explication :** Installe Loki (serveur de stockage de logs) et Promtail (agent de collecte des logs de pods) dans le même namespace.

### Étape 4 : Déploiement des Manifests Applicatifs
```bash
kubectl apply -f k8s/monitoring/service-monitors.yaml
kubectl apply -f k8s/monitoring/mysql-exporter.yaml
kubectl apply -f k8s/monitoring/alert-rules.yaml
kubectl apply -f k8s/monitoring/grafana-dashboards/
```
* **Explication :** Applique les configurations personnalisées de scraping, d'export de base de données, les règles d'alerting Prometheus, et charge les 5 dashboards Grafana à l'aide des ConfigMaps.

### Étape 5 : Reconstruction des Images FastAPI avec Instrumentation
```bash
eval $(minikube docker-env)
```
* **Explication :** Configure le terminal local pour que toutes les commandes `docker` exécutées ciblent le démon Docker interne de Minikube au lieu du Docker hôte. Cela évite d'avoir à pousser les images reconstruites sur un registre externe (Docker Hub).

```bash
docker build -t billcom/user-service:latest    ./services/user-service
docker build -t billcom/product-service:latest ./services/product-service
docker build -t billcom/order-service:latest   ./services/order-service
```
* **Explication :** Reconstruit les conteneurs avec les modifications de code Python (FastAPI instrumenté avec l'endpoint `/metrics` et logs JSON structurés).

```bash
kubectl rollout restart deployment/user-service    -n billcom
kubectl rollout restart deployment/product-service -n billcom
kubectl rollout restart deployment/order-service   -n billcom
```
* **Explication :** Force un déploiement progressif (rolling update) pour remplacer les pods existants par les nouveaux pods utilisant les images nouvellement construites.

### Étape 6 : Accès et Vérification
```bash
minikube ip
```
* **Explication :** Fournit l'IP virtuelle de Minikube (par ex. `192.168.49.2`). Les services étant exposés en NodePorts, l'accès se fait aux adresses :
  - Grafana : `http://<minikube-ip>:30030`
  - Prometheus : `http://<minikube-ip>:30090`
  - Alertmanager : `http://<minikube-ip>:30093`

---

## 4. Intégration de la Télémétrie dans le Code Python (FastAPI)

Dans les microservices Python (ex. `user-service`, `product-service`, `order-service`), le code intègre le monitoring de deux manières principales :

### A. Exposition automatique de métriques HTTP standards
```python
from prometheus_fastapi_instrumentator import Instrumentator

# Configure et expose l'endpoint HTTP /metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```
* **Fonctionnement :** Cette bibliothèque intercepte chaque requête transitant par FastAPI et calcule automatiquement la latence, la taille de la requête/réponse et le code d'état HTTP. Ces indicateurs sont exposés sur `/metrics` au format brut compris par Prometheus.

### B. Métriques Métier Personnalisées (Custom Metrics)
Les microservices définissent des compteurs (`Counter`) pour des événements d'affaires spécifiques :
- **user-service** :
  - `auth_login_success_total` (Labels: `role`) : Incrémenté lors d'un login réussi.
  - `auth_login_failure_total` : Incrémenté lors d'un login échoué.
  - `auth_register_total` (Labels: `role`) : Incrémenté à chaque inscription.
  - `auth_login_lockout_total` : Incrémenté à chaque blocage temporaire de compte (brute-force détecté via Redis).
- **product-service** :
  - `product_views_total` (Labels: `product_id`, `category`) : Incrémenté lors de la consultation d'une fiche produit.
- **order-service** :
  - `orders_created_total` (Labels: `payment_method`) : Incrémenté lorsqu'une commande est validée.

**Exemple de code d'incrémentation (User-Service) :**
```python
from prometheus_client import Counter

auth_login_success = Counter(
    "auth_login_success_total",
    "Successful login attempts",
    ["role"],
)

# Lors de l'authentification réussie :
auth_login_success.labels(role=user.role).inc()
```

### C. Logs Structurés en JSON
Les microservices délaissent les logs texte classiques au profit de logs JSON structurés pour faciliter le traitement automatique dans Loki :
```python
from pythonjsonlogger import jsonlogger

log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(levelname)s %(name)s %(message)s %(event)s %(username)s"
)
log_handler.setFormatter(formatter)
logger = logging.getLogger("user-service")
logger.addHandler(log_handler)
```
Ces logs JSON sont capturés par Promtail, qui en extrait le niveau de sévérité et fournit des filtres rapides dans l'interface Grafana.
