# Phase 8 — GitOps avec ArgoCD : Documentation complète

Ce document détaille la mise en place d'ArgoCD pour synchroniser automatiquement le cluster minikube avec le dépôt Git : ce qui a été installé, les bugs réels rencontrés en déployant nos manifestes des Phases 4-7 via ArgoCD (nombreux — c'était le premier vrai déploiement K8s complet de ce projet), et comment `selfHeal`/`prune` ont été vérifiés en conditions réelles.

---

## Vue d'ensemble

```
8.1 Installation ArgoCD  → namespace argocd, CRDs, contrôleurs
8.2 Application ArgoCD   → pointe sur k8s/base, sync automated (prune + selfHeal)
8.3 Déploiement réel      → tous les bugs trouvés en déployant les Phases 4-7 pour de vrai
8.4 Vérification          → selfHeal et prune testés en conditions réelles
```

**Principe directeur, comme pour les phases précédentes** : tout ce qui pouvait être testé en réel l'a été (installation, sync, rollout, selfHeal, prune, parcours applicatif complet via le gateway). Seule exception : les `NetworkPolicy` de la Phase 7 n'ont **pas** pu être vérifiées avec un CNI qui les applique (voir 8.3).

**Décisions prises avant de commencer** (avec l'utilisateur) :
- Le cluster minikube existant de 12 jours (utilisé pour les Phases 4-6) est **conservé**, pas recréé.
- L'`Application` ArgoCD ne couvre que `k8s/base` (Deployments, Services, Secrets, ConfigMaps, NetworkPolicies, HPA) — le stack de monitoring (`k8s/monitoring/`, installé via Helm) reste géré manuellement, car un mélange de manifestes bruts et de fichiers de valeurs Helm ne se prête pas à une `Application` "répertoire YAML" simple.
- `syncPolicy.automated` avec `prune: true` et `selfHeal: true` activés dès le départ (conforme à la demande initiale).

---

## 8.1 — Installation d'ArgoCD

### Ce qui a été fait

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Bug : CRD `applicationsets.argoproj.io` trop volumineux

```
The CustomResourceDefinition "applicationsets.argoproj.io" is invalid: metadata.annotations: Too long: may not be more than 262144 bytes
```

`kubectl apply` (client-side) stocke le manifeste complet dans l'annotation `kubectl.kubernetes.io/last-applied-configuration` pour ses diffs à 3 voies — ce CRD précis est trop gros et dépasse la limite de 256 KiB d'etcd pour une annotation. Non bloquant pour notre usage (on utilise une `Application` simple, pas d'`ApplicationSet`), mais corrigé par hygiène :

```bash
kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
Le mode `--server-side` ne repose pas sur cette annotation (ownership des champs géré côté serveur), donc pas de limite de taille. Trois avertissements de conflit sont apparus ensuite (`conflict with "kubectl-client-side-apply"` sur un champ d'env var et sur `.spec.ingress`) — bénins : juste une divergence de propriétaire de champ entre le premier apply client-side et le server-side apply qui a suivi, rien de cassé.

**Vérifié** : les 7 pods ArgoCD (`application-controller`, `applicationset-controller`, `dex-server`, `notifications-controller`, `redis`, `repo-server`, `server`) `Running 1/1`.

---

## 8.2 — Ressource `Application`

### Ce qui a été mis en place

[argocd/application.yaml](argocd/application.yaml), adapté au vrai dépôt/namespace (l'exemple de l'énoncé utilisait des placeholders génériques) :

```yaml
spec:
  source:
    repoURL: https://github.com/MohamedAzizBouthelja/BILLCOM.git
    targetRevision: main
    path: k8s/base
  destination:
    server: https://kubernetes.default.svc
    namespace: billcom
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Appliqué avec un simple `kubectl apply -f argocd/application.yaml` — cette ressource elle-même est commitée dans le dépôt (cohérent avec l'esprit GitOps : même la définition de ce qu'ArgoCD surveille est versionnée).

---

## 8.3 — Déploiement réel : tous les bugs trouvés

C'était le premier déploiement complet du cluster K8s de ce projet piloté de bout en bout (le cluster de 12 jours n'avait jamais eu tous les composants des Phases 4-7 réellement synchronisés ensemble). Beaucoup de bugs réels sont sortis — dans l'ordre où ils ont été trouvés et corrigés.

### Bug 1 : réseau dégradé à l'intérieur de minikube (build d'images)

Construire les images directement avec `eval $(minikube docker-env)` faisait planter `apt-get install` en boucle (`Connection timed out` vers `deb.debian.org`, téléchargements tronqués et retentés indéfiniment). Diagnostic : ping et DNS fonctionnaient depuis le nœud minikube, seuls les téléchargements HTTP volumineux échouaient — signature d'un problème de MTU/PMTU en amont (VPN, pare-feu d'entreprise) difficile à corriger à la source.

**Contournement** : construire les images sur le daemon Docker de l'**hôte** (celui utilisé sans souci pendant toute la Phase 7), puis les transférer avec `minikube image load <image>` — un transfert local qui ne dépend pas du réseau interne de minikube.

### Bug 2 : pas de Calico sur le cluster existant

Le cluster de 12 jours utilise le CNI par défaut de minikube (`kindnet`), qui n'applique pas les `NetworkPolicy`. Redémarrer avec `--cni=calico` sur un profil **existant** ne l'installe pas rétroactivement — seule une recréation complète (`minikube delete` + `minikube start --cni=calico`) le permettrait. Décision (avec l'utilisateur) : garder le cluster existant plutôt que de le recréer. **Conséquence : les NetworkPolicies de la Phase 7 restent non vérifiées en conditions réelles** (déjà documenté comme limitation connue dans `PHASE7_SECURITE.md`, confirmé ici plutôt que résolu).

### Bug 3 : `mysql`/`redis` — RollingUpdate + PVC ReadWriteOnce

Premier vrai rollout via ArgoCD : le Deployment `mysql` utilisait la stratégie par défaut (`RollingUpdate`), qui crée le nouveau pod **avant** de tuer l'ancien. Avec un PVC `ReadWriteOnce` à réplica unique, les deux pods se sont retrouvés sur le même nœud (minikube = un seul nœud) à essayer d'ouvrir les mêmes fichiers InnoDB :
```
[ERROR] [MY-012574] [InnoDB] Unable to lock ./ibdata1 error: 11
```
**Fix** ([k8s/base/mysql.yaml](k8s/base/mysql.yaml), [redis.yaml](k8s/base/redis.yaml)) : `strategy: { type: Recreate }` — tue l'ancien pod avant de créer le nouveau, aucun chevauchement possible sur le volume.

### Bug 4 : gateway — `Permission denied` sur `key.pem` sous minikube

Le certificat TLS auto-signé (`chown nginx:nginx` + `chmod 400`, qui fonctionnait parfaitement en Docker Compose — vérifié en Phase 7) était refusé en lecture sous minikube/containerd : `cannot load certificate key ... Permission denied`. Cause exacte non isolée (le MTU du nœud minikube et de l'hôte WSL2 étaient identiques, donc pas un mismatch simple ; probablement une interaction UID/runtime spécifique à ce containerd). **Fix pragmatique** : `chmod 444` au lieu de `400` — acceptable puisqu'il s'agit d'un certificat de développement auto-signé, pas d'une clé sensible de production.

### Bug 5 : rechargement d'image minikube — cache non rafraîchi

Après avoir corrigé le Dockerfile du gateway, `minikube image load billcom/gateway:latest` ne remplaçait pas l'image déjà en cache dans minikube (même tag, contenu différent) : le pod continuait à utiliser l'ancienne image buguée. Il a fallu :
1. `kubectl scale deployment gateway --replicas=0` puis attendre la suppression réelle du pod (`kubectl wait --for=delete`), sans quoi `docker rmi` échoue (`unable to remove ... container ... is using its referenced image`, même après un `scale --replicas=0` si on ne laisse pas le temps au conteneur de vraiment disparaître) ;
2. `minikube ssh -- docker rmi -f billcom/gateway:latest` pour forcer la suppression du cache ;
3. `minikube image load` puis `kubectl scale --replicas=1`.

### Bug 6 : comptes MySQL manquants sur le volume existant

Comme anticipé dans `PHASE7_SECURITE.md` : les scripts d'init (`01-databases.sql`/`02-create-users.sh`) ne s'exécutent qu'au premier démarrage sur un volume **vide** — le volume `mysql-pvc` de 12 jours en avait déjà un. Résultat : `user_svc`/`product_svc`/`order_svc` n'existaient pas, tous les nouveaux pods applicatifs plantaient sur `Access denied for user 'user_svc'@'...' (using password: YES)`.

**Fix** : une vraie migration one-shot, exécutée directement sur l'instance existante (ce que Git/ArgoCD ne peuvent pas gérer — ils pilotent l'infrastructure, pas les données) :
```bash
kubectl exec -n billcom <pod-mysql> -- mysql -u root -prootpassword -e "
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE USER IF NOT EXISTS 'user_svc'@'%' IDENTIFIED BY 'userpass_k8s';
GRANT ALL PRIVILEGES ON user_db.* TO 'user_svc'@'%';
... (idem product_svc, order_svc)
FLUSH PRIVILEGES;
"
```

### Bug 7 (transitoire) : `TLS handshake timeout` vers GitHub depuis `argocd-repo-server`

À deux reprises, `argocd-repo-server` a échoué à cloner le dépôt (`failed to list refs: ... TLS handshake timeout` vers `github.com`), faisant passer l'`Application` en `SYNC STATUS: Unknown`. Un `curl` manuel depuis le nœud minikube vers `github.com` fonctionnait pourtant sans problème — signe d'un blip réseau transitoire spécifique à cette requête (probablement au moment où le pod `repo-server` redémarrait), pas d'un vrai problème de connectivité. **Fix** : forcer une resynchronisation (`kubectl patch application ... -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'`) — résolu au 2ᵉ essai à chaque fois.

### Incident : arrêt/redémarrage de la machine en cours de route

La machine s'est arrêtée par inadvertance pendant les tests. **Aucune perte** : `minikube start` sur le profil existant a repris exactement l'état précédent (PVC, pods, config ArgoCD) sans recréation. Tous les composants (ArgoCD + application) ont mis un peu plus d'une minute à se réconcilier tout seuls après le redémarrage, sans intervention manuelle au-delà d'une nouvelle vérification.

---

## 8.4 — Vérification de `selfHeal` et `prune`

### selfHeal

```bash
kubectl scale deployment frontend -n billcom --replicas=3   # modification manuelle, hors Git
```
Résultat observé (`kubectl get deployment frontend -w`) : `UP-TO-DATE` passe de `1` à `3` immédiatement (la modification manuelle est appliquée), puis revient à `1` tout seul quelques secondes plus tard, sans aucune action de notre part — ArgoCD a détecté la dérive par rapport à `k8s/base/frontend.yaml` (qui déclare `replicas: 1`) et l'a corrigée automatiquement.

### prune

Ajout d'un `ConfigMap` jetable ([k8s/base/gitops-test-configmap.yaml](k8s/base/gitops-test-configmap.yaml)) commité et poussé — ArgoCD l'a créé dans le cluster en quelques secondes après un refresh forcé. Puis suppression du fichier (`git rm`), commit, push — ArgoCD a supprimé la ressource correspondante du cluster :
```
Error from server (NotFound): configmaps "gitops-prune-test" not found
```
Exactement le comportement attendu : toute ressource retirée de Git disparaît automatiquement du cluster.

### Parcours applicatif complet, en conditions réelles

Le driver `docker` de minikube sous Linux n'expose pas les `NodePort` directement via l'IP du cluster (contrairement à d'autres drivers) — il faut un tunnel dédié :
```bash
minikube service gateway -n billcom --url   # terminal à garder ouvert
```
Testé avec ce tunnel actif : `/health` (200), inscription, connexion (JWT émis) — le déploiement piloté entièrement par ArgoCD fonctionne de bout en bout, à travers le gateway, exactement comme en Docker Compose.

---

## Récapitulatif

| Composant | État |
|---|---|
| ArgoCD (namespace `argocd`) | ✅ installé, 7/7 pods Healthy |
| `Application` `billcom-platform` | ✅ `Synced` + `Healthy`, pointe sur `k8s/base`@`main` |
| `selfHeal` | ✅ vérifié (dérive manuelle corrigée automatiquement) |
| `prune` | ✅ vérifié (ressource retirée de Git supprimée automatiquement) |
| Déploiement applicatif complet | ✅ vérifié de bout en bout via le gateway (register/login/health) |
| NetworkPolicies (Phase 7) sous Calico | ❌ non vérifiable sans recréer le cluster (décision : cluster conservé) |
| Monitoring (`k8s/monitoring/`) sous GitOps | ❌ hors périmètre (Helm, pas un simple répertoire YAML) — reste manuel |

---

## Bugs réels trouvés et corrigés

| # | Bug | Où | Gravité |
|---|---|---|---|
| 1 | Réseau dégradé à l'intérieur du daemon Docker de minikube (téléchargements apt qui bouclent) | build d'images | Bloquant, contourné (build hôte + `minikube image load`) |
| 2 | CRD `applicationsets.argoproj.io` trop gros pour `kubectl apply` client-side | install ArgoCD | Non bloquant pour notre usage, corrigé par hygiène (`--server-side`) |
| 3 | `mysql`/`redis` : RollingUpdate + PVC RWO → conflit de verrou InnoDB au premier rollout | `k8s/base/mysql.yaml`, `redis.yaml` | Bloquant, corrigé (`strategy: Recreate`) |
| 4 | `key.pem` du gateway illisible sous minikube malgré chown correct (fonctionnait en Docker Compose) | `gateway/Dockerfile` | Bloquant, corrigé (`chmod 444`) |
| 5 | Cache d'image minikube non rafraîchi après rebuild (même tag) | rollout gateway | Bloquant, contourné (scale à 0 + suppression forcée + reload) |
| 6 | Comptes MySQL dédiés absents sur le volume de données pré-existant (12 jours) | MySQL | Bloquant, corrigé (migration manuelle one-shot) |
| 7 | `TLS handshake timeout` transitoire vers GitHub depuis `argocd-repo-server` | sync ArgoCD | Transitoire, résolu par nouvelle tentative |

---

## Fichiers créés ou modifiés pour cette phase

- [argocd/application.yaml](argocd/application.yaml) — nouveau, définit la ressource `Application` ArgoCD
- [k8s/base/mysql.yaml](k8s/base/mysql.yaml), [redis.yaml](k8s/base/redis.yaml) — `strategy: Recreate`
- [gateway/Dockerfile](gateway/Dockerfile) — `chmod 444` sur `key.pem`
- `k8s/base/gitops-test-configmap.yaml` — créé puis supprimé, uniquement pour vérifier le `prune` (ne doit pas rester dans le dépôt)
