# Audit des Fonctionnalités TEAMMOVE
**Date:** 2025-01-12

---

## 📊 Vue d'ensemble

| Catégorie | Implémenté | Partiel | Manquant |
|-----------|------------|---------|----------|
| Authentification & Sécurité | 60% | ⚠️ CAPTCHA manquant | 40% |
| Dashboard & Stats | 80% | ✅ Complet | 20% |
| Gestion Événements | 70% | ⚠️ Rappels manquants | 30% |
| Gestion Participants | 30% | ❌ Invitations/Matching | 70% |
| Gestion Véhicules | 40% | ⚠️ UI limitée | 60% |
| Système de Plans | 85% | ⚠️ Features tier manquantes | 15% |
| Paiement & Facturation | 75% | ⚠️ Webhooks à tester | 25% |
| Admin Dashboard | 80% | ✅ Presque complet | 20% |
| Tests & Documentation | 0% | ❌ Aucun test auto | 100% |

---

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### 1. Authentification & Sécurité (60%)
✅ **Implémenté** :
- JWT avec access + refresh tokens
- Rate limiting sur /api/auth/login (15 tentatives/15min)
- Protection brute-force (lock après 5 échecs, 30min)
- "Se souvenir de moi" avec refresh tokens (30 jours)
- Gestion erreurs (401, 403, compte désactivé)
- Login séparé admin (/admin/login) et company (/login)
- Tokens stockés dans localStorage
- Authorization Bearer header automatique (queryClient)

❌ **MANQUANT - CRITIQUE** :
- **Google reCAPTCHA v2/v3** (OBLIGATOIRE selon specs)
  - Pas de widget frontend
  - Pas de vérification backend
  - Requis sur : /login, /admin/login, /register

### 2. Dashboard Company (80%)
✅ **Implémenté** :
- Stats temps réel (événements, participants, véhicules)
- Affichage plan actuel avec badge coloré
- Limites par plan affichées (X/Y événements)
- Bannière d'avertissement si limite atteinte
- LimitGate bloque création si quota dépassé
- PlanFeaturesContext fournit hasFeature(), canAddMore(), getLimit()
- Bouton "Voir mon plan" → /plan-features
- Bouton "Gérer l'abonnement" → /billing
- Quick actions (Créer événement, etc.)

⚠️ **PARTIEL** :
- Stats "en temps réel" mais pas de WebSocket/polling
- Pas de graphiques/analytics visuels

### 3. Gestion Événements (70%)
✅ **Implémenté** :
- CRUD complet (Create, Read, Update, Delete)
- Événements ponctuels avec dates
- QR Code généré automatiquement (stocké en base)
- Partage lien public (URL unique)
- Filtres (tous/à venir/passés)
- Multi-tenant (isolation par companyId)
- Middleware checkEventLimit bloque création si quota dépassé

❌ **MANQUANT** :
- Événements récurrents
- Programmation rappels automatiques (email/notification)
- Interface calendrier visuel
- Export événements (CSV, PDF)

### 4. Gestion Participants (30%)
✅ **Implémenté** :
- CRUD basique
- Ajout/suppression manuelle
- Statut (pending, confirmed, cancelled)
- Association à un événement
- Multi-tenant (companyId)

❌ **MANQUANT - CRITIQUE** :
- **Invitation par email** avec bouton "Rejoindre"
- **Matching intelligent** conducteurs/passagers par ville/zone
- **Algorithme automatisé** pour relances si pas de conducteurs
- Suivi inscriptions détaillé
- Rôle conducteur/passager
- Statut covoiturage

### 5. Gestion Véhicules (40%)
✅ **Implémenté** :
- CRUD basique
- Stockage places, marque, modèle, immatriculation
- Association à companyId
- Middleware checkVehicleLimit

❌ **MANQUANT - CRITIQUE** :
- **Ajout véhicule par événement** (pas global)
- **UI départ/destination par véhicule**
- Association véhicule ↔ événement (table de liaison)
- Association véhicule ↔ conducteur ↔ passagers
- Calcul places restantes
- Interface de gestion événement-spécifique

### 6. Système de Plans (85%)
✅ **Implémenté** :
- 4 plans (DECOUVERTE, ESSENTIEL, PRO, PREMIUM)
- Limites définies (événements, participants, véhicules)
- Features flags (customEvents, smartCarpooling, analytics, etc.)
- PlanFeaturesContext + FeatureGate + LimitGate
- Backend middleware enforce limits
- API GET /api/plans/current-features
- Page /plan-features affiche détails plan
- Architecture planHistory pour historique
- Preservation données lors changement plan

⚠️ **PARTIEL - FONCTIONNALITÉS TIER NON IMPLÉMENTÉES** :
Les features suivantes existent en flags mais **pas implémentées** :
- ❌ Reporting avancé (ESSENTIEL+)
- ❌ Messagerie diffusion participants (ESSENTIEL+)
- ❌ CRM (PRO+)
- ❌ Stats avancées/Analytics (PRO+)
- ❌ API access (PRO+)
- ❌ Logo dashboard personnalisé (PRO+)
- ❌ Support prioritaire/dédié (PREMIUM)
- ❌ Marque blanche (PREMIUM)
- ❌ Intégrations spécifiques (PREMIUM)

### 7. Inscription & Registration (85%)
✅ **Implémenté** :
- Multi-step (3 étapes)
- Choix type organisme (Club, PME, Grande Entreprise)
- Choix plan (DECOUVERTE, ESSENTIEL, PRO, PREMIUM)
- Validation SIREN via api.gouv.fr
- Auto-complétion adresses (adresse.data.gouv.fr)
- Formulaire complet (nom, email, tel, SIREN, adresse, password)
- CGU obligatoire
- Différents flux selon plan :
  - DECOUVERTE : Gratuit instantané
  - ESSENTIEL : Stripe checkout → Paiement → Facture PDF
  - PRO/PREMIUM : Flux devis (quotePending)
- Génération facture PDF (pdfkit + object storage)
- Email facture (si paiement réussi)
- Atomic transactions (rollback si erreur)

❌ **MANQUANT** :
- **CAPTCHA sur inscription**
- Tests paiement échoué (comportement à vérifier)
- Email de bienvenue après inscription

### 8. Paiement & Facturation (75%)
✅ **Implémenté** :
- Intégration Stripe (checkout sessions)
- Plans prix définis (ESSENTIEL: 29€, PRO: 99€, PREMIUM: 299€)
- Webhooks Stripe (/api/webhooks/stripe)
- Génération facture PDF automatique
- Stockage factures dans object storage
- Idempotency (paymentIntentId)
- Gestion échec paiement (fallback DECOUVERTE)

⚠️ **À TESTER** :
- Webhooks en production (signature verification)
- Échec paiement → Email relance
- Upgrade/downgrade via /billing
- Factures téléchargeables

### 9. Dashboard Admin (80%)
✅ **Implémenté** :
- Login séparé /admin/login
- Dashboard /admin avec stats globales
- Liste entreprises (AdminCompanies)
- Gestion validations devis (AdminValidations)
- Possibilité activer/désactiver comptes
- Vue détaillée entreprise
- Multi-tenant isolation (admin voit tout)

❌ **MANQUANT** :
- **CAPTCHA sur admin login**
- Messagerie individuelle/groupe
- Export rapports CSV/PDF
- Gestion groupée droits/plans
- Force changement plan temporaire (période essai)
- Logs activité détaillés

### 10. Interface & UX (90%)
✅ **Implémenté** :
- Design responsive (mobile, tablet, desktop)
- Mode dark/light (ThemeProvider)
- Cookies banner (RGPD)
- Shadcn UI components
- Auto-complétion adresses France
- Navigation intuitive
- Loading states
- Error handling UX
- Toast notifications

### 11. Sécurité (70%)
✅ **Implémenté** :
- JWT + refresh tokens
- Bcrypt password hashing
- Rate limiting
- Brute-force protection
- Input validation (Zod)
- Multi-tenant isolation
- Ownership checks (companyId)
- CSRF protection
- Environment secrets

❌ **MANQUANT - CRITIQUE** :
- **Google reCAPTCHA** (login, admin login, registration)

---

## ❌ FONCTIONNALITÉS MANQUANTES CRITIQUES

### 🚨 PRIORITÉ 1 - SÉCURITÉ

#### 1. Google reCAPTCHA (OBLIGATOIRE)
**Impact** : Vulnérabilité sécurité majeure
**Effort** : 2-3h
**Pages concernées** :
- /login (company)
- /admin/login
- /register

### 🚨 PRIORITÉ 2 - FONCTIONNALITÉS MÉTIER

#### 2. Gestion Participants Complète
**Impact** : Fonctionnalité core manquante
**Effort** : 5-8h

**À implémenter** :
- [ ] Invitation email avec lien unique
- [ ] Matching intelligent conducteurs/passagers
- [ ] Algorithme notifications si pas de conducteurs
- [ ] Statut covoiturage (conducteur/passager)
- [ ] Association véhicule ↔ participant

#### 3. Gestion Véhicules par Événement
**Impact** : Fonctionnalité core manquante
**Effort** : 3-5h

**À implémenter** :
- [ ] Table liaison events_vehicles
- [ ] UI ajout véhicule dans événement
- [ ] Départ/destination par véhicule
- [ ] Association conducteur → véhicule
- [ ] Calcul places restantes

### 🚨 PRIORITÉ 3 - FONCTIONNALITÉS TIER

#### 4. Fonctionnalités Plan ESSENTIEL
**Effort** : 8-12h
- [ ] Reporting avancé (graphiques, exports)
- [ ] Messagerie diffusion participants
- [ ] Notifications automatiques

#### 5. Fonctionnalités Plan PRO
**Effort** : 15-20h
- [ ] CRM intégré
- [ ] Stats avancées (Analytics dashboard)
- [ ] API REST documentée
- [ ] Upload logo dashboard personnalisé

#### 6. Fonctionnalités Plan PREMIUM
**Effort** : 20-30h
- [ ] Support dédié (ticketing system)
- [ ] Marque blanche (custom domain, branding)
- [ ] Intégrations tierces (Slack, Teams, etc.)

### 🚨 PRIORITÉ 4 - QUALITÉ

#### 7. Tests Automatisés (0%)
**Impact** : Risque régression élevé
**Effort** : 10-15h

**Tests requis** :
- [ ] Jest unit tests (services, utils)
- [ ] Supertest integration tests (API routes)
- [ ] React Testing Library (composants)
- [ ] Cypress E2E (flows complets)

#### 8. Documentation API (0%)
**Impact** : Maintenance difficile
**Effort** : 3-5h

**À implémenter** :
- [ ] Swagger/OpenAPI spec
- [ ] Route /api-docs
- [ ] Documentation inline JSDoc
- [ ] Exemples requêtes/réponses

---

## 📈 ESTIMATION TEMPS

| Priorité | Fonctionnalité | Effort | Criticité |
|----------|---------------|--------|-----------|
| P1 | Google reCAPTCHA | 2-3h | 🔴 CRITIQUE |
| P2 | Participants (invitation, matching) | 5-8h | 🔴 CRITIQUE |
| P2 | Véhicules par événement | 3-5h | 🔴 CRITIQUE |
| P3 | Features ESSENTIEL | 8-12h | 🟡 IMPORTANT |
| P3 | Features PRO | 15-20h | 🟡 IMPORTANT |
| P3 | Features PREMIUM | 20-30h | 🟢 NICE TO HAVE |
| P4 | Tests automatisés | 10-15h | 🟡 IMPORTANT |
| P4 | Documentation Swagger | 3-5h | 🟢 NICE TO HAVE |

**TOTAL P1+P2** : 10-16h (CRITIQUE)
**TOTAL P3** : 43-62h (IMPORTANT)
**TOTAL P4** : 13-20h (QUALITÉ)

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Sprint 1 - SÉCURITÉ & CORE (10-16h)
1. ✅ Implémenter Google reCAPTCHA (login, admin, register)
2. ✅ Gestion participants complète (invitations, matching)
3. ✅ Gestion véhicules par événement

### Sprint 2 - TIER FEATURES (20-32h)
4. Features ESSENTIEL (reporting, messagerie)
5. Features PRO (CRM, analytics, API, logo custom)

### Sprint 3 - PREMIUM & QUALITÉ (30-50h)
6. Features PREMIUM (support, marque blanche)
7. Tests automatisés (Jest, Cypress)
8. Documentation API (Swagger)

---

## 📝 NOTES TECHNIQUES

### Points forts architecture actuelle
✅ Multi-tenant solide (companyId partout)
✅ JWT bien implémenté
✅ Drizzle ORM propre
✅ PlanFeaturesContext modulaire
✅ Middleware limits réutilisables
✅ Object storage pour factures
✅ Atomic transactions registration

### Points d'amélioration
⚠️ Pas de WebSocket (temps réel limité)
⚠️ Pas de queue system (emails, notifications)
⚠️ Pas de cache (Redis)
⚠️ Pas de monitoring (Sentry)
⚠️ Pas de logs centralisés

---

**Dernière mise à jour** : 2025-01-12
