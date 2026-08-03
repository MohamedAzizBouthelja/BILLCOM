# Planning de stage — Décomposition en sprints hebdomadaires

Stage ingénieur — 22 juin 2026 au 15 août 2026 (8 semaines)
Projet : Billcom / GadgetZone — plateforme e-commerce microservices

Format pensé pour Trello : **chaque semaine = une liste**, chaque tâche = **une carte**
(coche `- [ ]` → case à cocher Trello si tu importes en Markdown, ou copie-colle
simplement chaque ligne comme titre de carte).

---

## Semaine 1 — 22 au 28 juin : Accueil et découverte

**Objectif du sprint :** s'intégrer, comprendre le contexte et cadrer le projet.

- [ ] Accueil, présentation de l'entreprise **[Nom de l'entreprise]**
- [ ] Rencontre avec l'encadrant **[Nom de l'encadrant]** — présentation des attentes et du planning
- [ ] Prise en main de l'environnement de travail (poste, accès, outils internes)
- [ ] Installation de l'environnement de dev (Docker Desktop, WSL2, Minikube, Git, VSCode)
- [ ] Découverte du cahier des charges : plateforme e-commerce en architecture microservices
- [ ] Étude des choix technologiques (FastAPI, React, MySQL, Redis, Kubernetes)
- [ ] Prise en main du dépôt Git et des conventions de l'équipe

**Livrable :** environnement de dev opérationnel, note de cadrage du projet.

---

## Semaine 2 — 29 juin au 5 juillet : Conception & architecture

**Objectif du sprint :** poser les fondations techniques avant de coder.

- [ ] Modélisation des 3 microservices : user-service, product-service, order-service
- [ ] Conception des schémas de base de données (user_db, product_db, order_db — une base par service)
- [ ] Définition des contrats d'API REST (endpoints, JWT pour l'auth)
- [ ] Choix de l'architecture de la gateway (Nginx — point d'entrée unique, SSL, routage)
- [ ] Structuration du dépôt (arborescence `services/`, `frontend/`, `gateway/`)
- [ ] Premiers commits : squelette des 3 services FastAPI

**Livrable :** schéma d'architecture, squelettes de services FastAPI qui démarrent.

---

## Semaine 3 — 6 au 12 juillet : Développement backend — cœur métier

**Objectif du sprint :** rendre les 3 services fonctionnels indépendamment.

- [ ] user-service : inscription, authentification JWT, gestion des utilisateurs
- [ ] product-service : CRUD produits, catalogue, endpoints de recherche/filtrage
- [ ] order-service : création de commandes, historique des commandes
- [ ] Seed de données de démonstration (catalogue produits)
- [ ] Tests unitaires par service (pytest + SQLite en mémoire)
- [ ] Mise en place de la CI de base (lint + tests)

**Livrable :** 3 API fonctionnelles et testées, accessibles individuellement.

---

## Semaine 4 — 13 au 19 juillet : Développement frontend

**Objectif du sprint :** avoir un parcours d'achat complet côté utilisateur.

- [ ] Setup React 18 + Vite + TailwindCSS + Zustand (state management)
- [ ] Pages : catalogue produits, fiche produit, panier, checkout
- [ ] Intégration des API backend (`api.js`, gestion du token JWT)
- [ ] Intégration du paiement Stripe (Checkout hébergé)
- [ ] Gestion des rôles utilisateur (client / admin)
- [ ] Premiers tests bout-en-bout du parcours d'achat

**Livrable :** parcours d'achat complet fonctionnel (catalogue → panier → paiement).

---

## Semaine 5 — 20 au 26 juillet : Sécurité & conteneurisation

**Objectif du sprint :** fiabiliser l'application avant de l'industrialiser.

- [ ] Revue de sécurité complète du backend (audit manuel des endpoints)
- [ ] Correction d'une vulnérabilité critique : manipulation de prix côté client
- [ ] Correction d'une vulnérabilité critique : élévation de privilèges via l'inscription publique
- [ ] Rate limiting et headers de sécurité au niveau de la gateway Nginx
- [ ] Écriture des Dockerfiles multi-stage pour chaque service
- [ ] Orchestration locale complète avec docker-compose

**Livrable :** application sécurisée, entièrement conteneurisée et démarrable en une commande.

---

## Semaine 6 — 27 juillet au 2 août : Déploiement Kubernetes

**Objectif du sprint :** faire tourner la plateforme sur un vrai orchestrateur.

- [ ] Setup du cluster Kubernetes local (Minikube)
- [ ] Écriture des manifests K8s (Deployments, Services, Secrets, ConfigMaps)
- [ ] Migration docker-compose → Kubernetes
- [ ] Mise en place des health checks (readiness/liveness probes)
- [ ] Définition des limites de ressources (CPU/mémoire) par service
- [ ] Résolution des problèmes d'infrastructure rencontrés (réseau, DNS, registre d'images)

**Livrable :** plateforme déployée et opérationnelle sur Kubernetes.

---

## Semaine 7 — 3 au 9 août : Observabilité, GitOps et CI/CD

**Objectif du sprint :** industrialiser le déploiement et la supervision.

- [ ] Installation de la stack de monitoring (Prometheus, Grafana, Loki, Alertmanager)
- [ ] Dashboards Grafana (métriques applicatives et infrastructure)
- [ ] Règles d'alerte Prometheus (service down, latence, taux d'erreur, brute-force)
- [ ] Pipeline CI/CD complet (GitHub Actions) : lint, tests, scan de sécurité, build, scan d'image
- [ ] Mise en place du GitOps avec ArgoCD (synchronisation automatique depuis Git)

**Livrable :** pipeline CI/CD opérationnel, supervision et alerting en place.

---

## Semaine 8 — 10 au 15 août : Résilience avancée et finalisation

**Objectif du sprint :** finaliser les fonctionnalités avancées et clôturer le stage.

- [ ] Décrément de stock résilient via Redis Streams (survit à une panne de service)
- [ ] Alerting par email en cas de panne de service (Prometheus → Alertmanager → SMTP)
- [ ] Fonctionnalité "produits fréquemment achetés ensemble"
- [ ] Validation CI des configurations de monitoring (promtool/amtool)
- [ ] Tests de bout en bout des scénarios de panne simulée
- [ ] Rédaction de la documentation technique finale
- [ ] Préparation du rapport de stage / support de soutenance

**Livrable :** plateforme complète, résiliente et documentée ; rapport de stage prêt.

---

## Comment l'importer dans Trello

1. Crée un tableau "Stage — Billcom"
2. Crée une liste par semaine (`Semaine 1 — 22-28 juin`, etc.)
3. Trello permet d'importer du Markdown ligne par ligne comme cartes : copie le bloc
   de tâches d'une semaine, colle-le dans le champ "Ajouter une carte" de la liste
   correspondante — Trello crée une carte par ligne collée si tu utilises le
   presse-papiers avec retours à la ligne (Ctrl+Maj+V dans certains cas, sinon carte
   par carte).
4. Ajoute une étiquette de couleur par thème si tu veux (Backend / Frontend /
   Sécurité / Infra / Monitoring) pour visualiser la répartition du travail.
