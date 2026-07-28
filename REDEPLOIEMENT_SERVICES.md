# Redéploiement après modification — par service

Ce fichier regroupe uniquement les commandes à lancer **après avoir modifié le code**
d'un service, pour le reconstruire et le redéployer sur minikube. Pour le démarrage
complet d'une session (MTU, `minikube start`, port-forwards...), voir `DEMARRAGE_RAPIDE_V2.md`.

**Prérequis avant toute commande de ce fichier** (une fois par session WSL2) :
```bash
cd /mnt/c/Users/pc_msi/Documents/billcom
eval $(minikube docker-env)
```

---

## ⚠️ Deux problèmes récurrents à connaître

### 1. `docker-credential-desktop.exe: exec format error`

Docker Desktop réinjecte périodiquement une config de credential helper Windows
illisible depuis WSL2. **Fix permanent** (à faire une seule fois) :
```bash
echo "sed -i '/credsStore/d' ~/.docker/config.json 2>/dev/null" >> ~/.bashrc
```
Si l'erreur revient quand même avant que le fix soit en place :
```bash
sed -i '/credsStore/d' ~/.docker/config.json
```

### 2. Timeout `apt-get` vers `deb.debian.org` (services Python uniquement)

Le réseau interne du bridge Docker de minikube a un MTU différent de celui du
nœud — ça bloque `apt-get` pendant le build des images Python (`user-service`,
`product-service`, `order-service`), pas le frontend (Alpine/Node, pas d'apt-get).
**Fix** : ajouter `DOCKER_BUILDKIT=1 ... --network=host` à ces 3 builds (déjà
inclus dans les commandes ci-dessous).

---

## Frontend

```bash
docker build -t billcom/frontend:latest ./frontend
kubectl rollout restart deployment/frontend -n billcom
```

## user-service

```bash
DOCKER_BUILDKIT=1 docker build --network=host -t billcom/user-service:latest ./services/user-service
kubectl rollout restart deployment/user-service -n billcom
```

## product-service

```bash
DOCKER_BUILDKIT=1 docker build --network=host -t billcom/product-service:latest ./services/product-service
kubectl rollout restart deployment/product-service -n billcom
```

## order-service

```bash
DOCKER_BUILDKIT=1 docker build --network=host -t billcom/order-service:latest ./services/order-service
kubectl rollout restart deployment/order-service -n billcom
```

## gateway (Nginx)

```bash
docker build -t billcom/gateway:latest ./gateway
kubectl rollout restart deployment/gateway -n billcom
```

---

## Plusieurs services modifiés en même temps

Build tout ce qui a changé, puis restart uniquement ce qui a été rebuild — pas
besoin de redémarrer un service que tu n'as pas touché.

```bash
docker build -t billcom/frontend:latest ./frontend
DOCKER_BUILDKIT=1 docker build --network=host -t billcom/user-service:latest ./services/user-service
DOCKER_BUILDKIT=1 docker build --network=host -t billcom/order-service:latest ./services/order-service

kubectl rollout restart deployment/frontend -n billcom
kubectl rollout restart deployment/user-service -n billcom
kubectl rollout restart deployment/order-service -n billcom
```

---

## Vérifier

```bash
kubectl get pods -n billcom -w
```

Attendre que tout repasse à `1/1 Running` (Ctrl+C pour sortir du mode `-w`).

---

## ⚠️ Cas particulier : tu as modifié un fichier dans `k8s/base/`

Ce dossier est piloté par **ArgoCD** (voir `PHASE8_GITOPS.md`), pas par toi.
`selfHeal: true` est actif : un `kubectl apply` manuel sur ces fichiers sera
**automatiquement annulé** par ArgoCD quelques secondes après, puisque le
cluster est reconfiguré pour toujours correspondre à ce qu'il y a sur Git.

**La bonne façon de faire** :
```bash
git add k8s/base/<fichier-modifié>.yaml
git commit -m "..."
git push
```
ArgoCD détecte le changement (polling automatique, ou forcer avec la commande
ci-dessous) et l'applique tout seul — pas de `kubectl apply` à faire.

```bash
# Forcer une resynchronisation immédiate au lieu d'attendre le polling
kubectl patch application billcom-platform -n argocd \
  --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

Ceci ne concerne que les manifestes K8s (replicas, ressources, config...). Un
changement de **code** applicatif suit toujours le chemin normal de ce fichier
(build + `rollout restart`) — ArgoCD ne reconstruit pas d'images.
