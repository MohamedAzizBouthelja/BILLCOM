# Démarrage Rapide — Phase 4 & Phase 5

> Ce guide te permet de démarrer toute la stack (Kubernetes + Monitoring)
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
lors des téléchargements d'images Docker ou des index Helm. Ce fix est obligatoire
à chaque redémarrage WSL2.

---

## ÉTAPE 3 — Démarrer Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=4096
```

**Pourquoi ?** Lance (ou relance) le cluster Kubernetes mono-nœud dans Docker Desktop.
Si le cluster existait déjà, cette commande le redémarre sans effacer les déploiements.

---

## ÉTAPE 4 — Corriger le MTU dans le nœud Minikube

```bash
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
```

**Pourquoi ?** Le nœud Minikube hérite du même problème MTU.
Sans ce fix, les pulls d'images Docker échouent dans le cluster (`ImagePullBackOff`).

---

## ÉTAPE 5 — Vérifier que tous les pods sont Running

```bash
kubectl get pods -n billcom
```

Tous les pods doivent être `1/1 Running` ou `2/2 Running`.

```bash
kubectl get pods -n monitoring
```

Tous les pods monitoring doivent aussi être `Running`.

> Si des pods sont en `Pending` ou `CrashLoopBackOff`, attendre 1-2 minutes
> et relancer la commande. MySQL met parfois 1-2 minutes à démarrer.

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

**Pods attendus dans `monitoring` :**
```
alertmanager-*                          2/2   Running
loki-0                                  1/1   Running
loki-promtail-*                         1/1   Running
prometheus-grafana-*                    3/3   Running
prometheus-kube-prometheus-operator-*   1/1   Running
prometheus-kube-prometheus-prometheus-* 2/2   Running
prometheus-kube-state-metrics-*         1/1   Running
prometheus-prometheus-node-exporter-*   1/1   Running
```

---

## ÉTAPE 6 — Lancer les port-forwards

Les services Kubernetes ne sont pas directement accessibles depuis Windows.
Les port-forwards créent des tunnels `localhost` → pod.

Ouvrir **3 terminaux WSL2 séparés** et lancer une commande dans chacun
(laisser chaque terminal ouvert) :

### Terminal 1 — Frontend (l'application)

```bash
kubectl port-forward -n billcom svc/frontend 8080:3000
```

Tunnel : `localhost:8080` → Nginx frontend (port 3000 dans le pod)

### Terminal 2 — Grafana (dashboards de monitoring)

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Tunnel : `localhost:3000` → pod Grafana

### Terminal 3 — Prometheus (métriques brutes)

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Tunnel : `localhost:9090` → pod Prometheus

---

## ÉTAPE 7 — Accéder aux interfaces dans le navigateur Windows

| Interface | URL | Identifiants |
|-----------|-----|-------------|
| **Application Billcom** | http://localhost:8080 | selon ton compte |
| **Grafana** | http://localhost:3000 | `admin` / `billcom-grafana-2025` |
| **Prometheus** | http://localhost:9090 | — |

---

## Résumé en 7 commandes

```bash
# Terminal principal
sudo ip link set dev eth0 mtu 1200
minikube start --driver=docker --cpus=4 --memory=4096
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"
kubectl get pods -n billcom && kubectl get pods -n monitoring

# Terminal 1
kubectl port-forward -n billcom svc/frontend 8080:3000

# Terminal 2
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Terminal 3
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

---

## Problèmes fréquents

### Port déjà utilisé (`address already in use`)

```bash
# Utiliser un port différent, ex : 8090 au lieu de 8080
kubectl port-forward -n billcom svc/frontend 8090:3000
```

> **Important :** si tu changes le port local (ex : `8090`), accède à l'application sur `http://localhost:8090` et non `http://localhost:8080`.

### Grafana CrashLoopBackOff (conflit datasource)

```bash
kubectl patch configmap loki-loki-stack -n monitoring --type=merge -p \
  '{"data":{"loki-stack-datasource.yaml":"apiVersion: 1\ndatasources:\n- name: Loki\n  type: loki\n  access: proxy\n  url: \"http://loki:3100\"\n  version: 1\n  isDefault: false\n  jsonData:\n    {}"}}'

kubectl delete pod -n monitoring -l app.kubernetes.io/name=grafana
```

Attendre 1 minute puis relancer le port-forward Grafana.

### ImagePullBackOff après redémarrage

```bash
# Refaire le fix MTU dans le nœud Minikube
minikube ssh -- "sudo ip link set dev eth0 mtu 1200"

# Supprimer le pod bloqué pour forcer un nouveau pull
kubectl delete pod <nom-du-pod> -n <namespace>
```

### Port-forward qui se déconnecte (`lost connection`)

Le pod a redémarré. Relancer simplement la même commande port-forward.

### Arrêter proprement à la fin de la session

```bash
minikube stop
```

Les déploiements sont conservés — au prochain `minikube start`, tout reprend
sans avoir à tout réinstaller.
