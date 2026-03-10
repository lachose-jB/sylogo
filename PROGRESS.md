# SyliGo — Suivi d'avancement du projet

> Dernière mise à jour : 2026-03-10

---

## Phase 1 : Cadrage et Conception

### 1.1 Analyse et Spécifications

- [ ] **Formalisation des Besoins** — Révision et validation avec les parties prenantes
- [ ] **Spécifications Fonctionnelles Détaillées** — Cas d'utilisation, flux, règles métier par interface
- [ ] **Spécifications Non-Fonctionnelles** — Performance, disponibilité, sécurité, offline-first

### 1.2 Architecture et Modélisation

- [x] **Architecture Technique** — Node.js ESM + Apollo Server 4 + MySQL + React/Vite + Flutter choisis et configurés
- [x] **Modèle de Données** — Schéma Prisma complet (Users, Orders, Products, Deliveries, Payments, Reviews, AuditLogs, Sessions, PlatformSettings)
- [x] **Architecture de Sécurité** — JWT (sessions DB), bcrypt 12 rounds, rôles (CLIENT/VENDOR/DELIVERY/ADMIN), audit trail

### 1.3 Design UX/UI

- [ ] **Wireframes et Maquettes** — Maquettes haute fidélité pour les apps mobiles
- [ ] **Prototypage Interactif** — Prototypes Figma
- [x] **Charte Graphique** — Tailwind CSS, couleur primaire #E85D04, dark theme gray-950, composants UI (Badge, StatCard, btn-primary, card, input)

---

## Phase 2 : Développement

### 2.1 Mise en Place de l'Environnement

- [x] **Environnement de Développement** — Node.js + Prisma + MySQL (Docker) + Vite + Flutter configurés
- [x] **Base de données** — Migration initiale appliquée, admin seedé (`+224600000000` / `admin123`)
- [ ] **CI/CD** — Pipelines GitHub Actions à configurer

### 2.2 Développement du Backend API

- [x] **Module d'Authentification** — JWT en base (sessions), bcrypt 12 rounds, `login(input: LoginInput!)` / `logout` / `me`, `register(input: RegisterInput!)` avec firstName/lastName
- [x] **Gestion des Utilisateurs** — CRUD complet : listUsers, getUserById, updateUserStatus, deleteUser
- [x] **Gestion des Produits** — CRUD produits + workflow modération (PENDING_REVIEW → APPROVED/REJECTED)
- [x] **Gestion des Commandes** — Création, suivi des statuts (9 états), annulation, réassignation livreur
- [x] **Gestion des Livraisons** — Assignation livreur, suivi GPS (lat/lng), confirmPickup, confirmDelivery, preuve photo
- [x] **Paramètres Plateforme** — Module dynamique : frais livraison, commission, zones, mode maintenance
- [x] **Logs et Sécurité** — Audit trail complet sur toutes les actions admin
- [x] **Subscriptions WebSocket** — `orderStatusChanged`, `deliveryLocationUpdated`, `newOrder` (graphql-ws)
- [ ] **Gestion des Paiements** — Intégration Orange Money API (structure en place, pas d'intégration réelle)
- [ ] **Géolocalisation** — Google Maps API (Haversine en app layer uniquement, pas de carte interactive)
- [x] **Notifications Push** — Firebase Admin SDK + service FCM : `notifyOrderStatusChange`, `notifyNewOrder`, `notifyDeliveryAssigned` — mutation `registerFcmToken` pour enregistrer le token appareil mobile

### 2.3 Application Mobile Client (Flutter)

- [ ] **Inscription OTP SMS** — Écran de vérification téléphone présent, mais OTP SMS réel non intégré
- [x] **Recherche de Commerces** — Liste produits/vendeurs via GraphQL (`ListProducts`), filtres par catégorie
- [x] **Passage de Commande** — Sélection produits, création commande via mutation `createOrder`
- [x] **Suivi en Temps Réel** — Écran de suivi commande avec statut, infos livreur et position
- [x] **Historique** — Historique commandes via query `myOrders` avec détail articles

### 2.4 Application Mobile Vendeur (Flutter)

- [x] **Inscription Professionnelle** — Inscription avec sélection de rôle VENDOR, firstName/lastName
- [x] **Gestion du Catalogue Produits** — CRUD produits, stock, gestion images (vendor_catalog_screen)
- [x] **Réception et Gestion Commandes** — Liste commandes, changement de statut (vendor_orders_screen)
- [x] **Tableau de Bord Statistiques** — KPIs : CA, commandes, produits, pending (vendor_dashboard_screen)

### 2.5 Interface Web Administrateur (React.js) ✅ COMPLÈTE

- [x] **Page d'accueil** — Landing page de présentation (/, /accueil) avec stats et features
- [x] **Authentification Admin** — Login sécurisé avec JWT, session persistante au refresh (race condition corrigée)
- [x] **Tableau de Bord** — KPIs (users, commandes, revenus, en attente), graphique 30 jours, top vendeurs, commandes récentes
- [x] **Gestion des Utilisateurs** — Liste filtrée (rôle, statut, recherche), activer/suspendre/supprimer
- [x] **Gestion des Vendeurs** — Validation manuelle, suspension, réactivation des vendeurs
- [x] **Gestion de la Flotte de Livreurs** — Page dédiée : KPIs flotte, tableau complet (véhicule, permis, note, livraisons, dispo), activer/suspendre
- [x] **Suivi des Commandes** — Liste filtrée par statut, détail commande, assignation livreur, changement de statut
- [x] **Commande temps réel** — Subscription WebSocket `orderStatusChanged` sur la page détail commande
- [x] **Modération des Produits** — Approbation/rejet avec motif, filtre par statut, galerie d'images (lightbox multi-photos), upload Firebase Storage via admin
- [x] **Analytics et Rapports** — KPIs globaux, graphique activité (7/30/90j), top vendeurs, **export CSV**
- [x] **Paramètres Plateforme** — Frais de base, prix/km, commission, mode maintenance
- [x] **Journal d'Audit** — Logs paginés (50 par page, bouton "Charger plus")
- [ ] **2FA (Authentification 2 facteurs)** — Non implémenté
- [ ] **Export PDF** — Seul le CSV est disponible (PDF à faire)
- [ ] **Carte globale livraisons** — Carte temps réel des livreurs sur le dashboard

---

## Phase 3 : Intégrations et Tests

### 3.1 Intégrations Externes

- [ ] **Google Maps API** — Géolocalisation, itinéraires, cartes offline
- [ ] **Orange Money API** — Transactions de paiement, webhooks de confirmation
- [x] **Firebase Cloud Messaging (FCM)** — Admin SDK configuré, service `notification.service.js`, notifications automatiques sur événements commandes
- [x] **Firebase Storage** — SDK client configuré, composant `ImageUpload.jsx` pour upload depuis le dashboard admin

### 3.2 Stratégie de Tests

- [ ] **Tests Unitaires** — Couverture 80% cible
- [ ] **Tests d'Intégration** — API (Postman/Newman)
- [ ] **Tests UI/E2E** — Parcours utilisateurs critiques
- [ ] **Tests de Performance** — JMeter (1000 cmd/j → 10 000 cmd/j)
- [ ] **Tests de Sécurité** — OWASP ZAP, injection SQL, XSS
- [ ] **Beta Testing** — 50 utilisateurs réels à Conakry

---

## Phase 4 : Déploiement et Post-Lancement

### 4.1 Déploiement

- [x] **Docker Compose** — MySQL + API + Frontend conteneurisés avec volumes persistants (docker-compose.yml + Dockerfiles)
- [ ] **Préparation au Lancement** — Documentation technique et utilisateur, formation équipe
- [ ] **Déploiement Applications Mobiles** — Google Play Store + Apple App Store
- [ ] **Déploiement Cloud** — API + DB sur Azure/AWS avec auto-scaling

### 4.2 Suivi et Maintenance

- [ ] **Monitoring** — Outils de monitoring (uptime, erreurs, KPIs)
- [ ] **Maintenance et Mises à Jour** — Plan de maintenance régulière
- [ ] **Gestion des Incidents** — Processus de réponse aux incidents

---

## Phase 5 : Sécurité et Conformité

- [ ] **Audits de Sécurité Réguliers** — Audits externes et internes
- [ ] **Gestion des Vulnérabilités** — Processus de patch management
- [ ] **Protection des Données Sensibles** — Chiffrement AES-256 des données sensibles en base
- [ ] **Conformité RGPD** — Droit d'accès, rectification, suppression vérifiable via l'admin
- [ ] **Tests d'Injection et XSS** — Tests spécifiques anti-injection et XSS
- [x] **Politique de Mots de Passe** — bcrypt avec salt, 12 rounds (SALT_ROUNDS = 12 confirmé dans auth.service.js)
- [ ] **Sauvegardes Chiffrées** — Sauvegardes quotidiennes chiffrées, rétention 30 jours

---

## Récapitulatif

| Catégorie                        | Fait      |Restant |
|----------------------------------|-----------|--------|
| Architecture & Modélisation      | 3/3       | 0      |
| Backend API                      | 9/11      | 2      |
| Interface Web Admin              | 12/15     | 3      |
| App Mobile Client (Flutter)      | 4/5       | 1      |
| App Mobile Vendeur (Flutter)     | 4/4       | 0      |
| Intégrations Externes            | 2/4       | 2      |
| Tests                            | 0/6       | 6      |
| Déploiement                      | 1/4       | 3      |
| Sécurité & Conformité            | 1/7       | 6      |
| **Total**                        | **36/59** | **23** |
