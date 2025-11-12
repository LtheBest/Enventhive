# Accès de Test - TEAMMOVE

## Comptes Admin

### Admin Principal
- **Email**: admin1@teammove.fr
- **Mot de passe**: Test1234!
- **Rôle**: admin
- **Page de connexion**: https://[votre-domaine]/admin/login
- **Redirection après connexion**: /admin

### Admin Secondaire
- **Email**: admin2@teammove.fr
- **Mot de passe**: Test1234!
- **Rôle**: admin
- **Page de connexion**: https://[votre-domaine]/admin/login
- **Redirection après connexion**: /admin

---

## Comptes Company (différents plans)

### Plan DECOUVERTE
- **Email**: admin.decouverte@test.com
- **Mot de passe**: Test1234!
- **Entreprise**: Test Company Découverte
- **Plan**: Découverte
- **Limites**:
  - Événements: 1
  - Participants: 30/événement
  - Véhicules: 5/événement
  - Fonctionnalités premium: ❌ Événements personnalisés, ❌ Covoiturage intelligent
- **Page de connexion**: https://[votre-domaine]/login
- **Redirection après connexion**: /dashboard

### Plan ESSENTIEL
- **Email**: erictchuisseu@yahoo.fr
- **Mot de passe**: Test1234!
- **Entreprise**: STSC
- **Plan**: Essentiel
- **Limites**:
  - Événements: 10
  - Participants: 100/événement
  - Véhicules: 20/événement
  - Fonctionnalités premium: ✅ Événements personnalisés, ❌ Covoiturage intelligent
- **Page de connexion**: https://[votre-domaine]/login
- **Redirection après connexion**: /dashboard

### Plan PRO
- **Email**: pro-ftq_ty@test.fr
- **Mot de passe**: Test1234!
- **Entreprise**: TestPRO-tPY9
- **Plan**: Pro
- **Limites**:
  - Événements: 50
  - Participants: 500/événement
  - Véhicules: 100/événement
  - Fonctionnalités premium: ✅ Événements personnalisés, ✅ Covoiturage intelligent, ✅ Analytics
- **Page de connexion**: https://[votre-domaine]/login
- **Redirection après connexion**: /dashboard

---

## Fonctionnalités par Plan

| Fonctionnalité | DECOUVERTE | ESSENTIEL | PRO | PREMIUM |
|----------------|------------|-----------|-----|---------|
| Max Événements | 1 | 10 | 50 | ∞ |
| Max Participants/événement | 30 | 100 | 500 | ∞ |
| Max Véhicules/événement | 5 | 20 | 100 | ∞ |
| Événements personnalisés | ❌ | ✅ | ✅ | ✅ |
| Covoiturage intelligent | ❌ | ❌ | ✅ | ✅ |
| Analytics avancées | ❌ | ❌ | ✅ | ✅ |
| Support prioritaire | ❌ | ❌ | ❌ | ✅ |

---

## Comportements du Dashboard

### Plan DECOUVERTE
- Affiche "1/1 événements" ou "0/1 événements" selon usage
- Affiche une bannière orange d'avertissement si limite atteinte
- Bouton "Créer un événement" remplacé par message d'upgrade si limite atteinte
- Lien "Voir mon plan" vers /plan-features

### Plan ESSENTIEL+
- Affiche "X/10 événements" (ou X/50 pour PRO)
- Bannière d'avertissement uniquement si limite proche ou atteinte
- Bouton "Créer un événement" actif tant que limite non atteinte
- Fonctionnalités premium débloquées selon le plan

---

## Pages Importantes

- **/dashboard** - Dashboard principal (company)
- **/admin** - Dashboard administrateur (admin)
- **/events** - Gestion des événements
- **/plan-features** - Détails du plan et fonctionnalités
- **/billing** - Gestion de l'abonnement
- **/settings** - Paramètres

---

## Notes Techniques

1. **Authentification**: JWT avec tokens stockés dans localStorage
2. **Protection des routes**: ProtectedRoute avec vérification du rôle
3. **Gestion des plans**: PlanFeaturesContext + FeatureGate + LimitGate
4. **Middleware backend**: checkEventLimit sur POST /api/events
5. **API**: GET /api/plans/current-features retourne les détails du plan

---

**Date de création**: $(date +"%Y-%m-%d")
**Version**: 1.0
