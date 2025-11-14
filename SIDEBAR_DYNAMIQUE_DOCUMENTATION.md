# 📋 Documentation - Sidebar Dynamique et Gestion des Plans d'Abonnement

## 🎯 Objectif du Projet

Implémenter un système de sidebar dynamique qui s'adapte automatiquement aux fonctionnalités disponibles selon le plan d'abonnement de l'utilisateur. Chaque plan offre des fonctionnalités différentes, et l'interface utilisateur doit refléter ces limitations en temps réel.

---

## ✨ Fonctionnalités Implémentées

### 1. 🎨 Sidebar Dynamique par Plan

La sidebar s'adapte automatiquement selon le plan de l'utilisateur :

#### Plan DÉCOUVERTE (Gratuit)
- ✅ Tableau de bord
- ✅ Événements (max 2)
- ✅ Participants (max 10 par événement)
- ✅ Paramètres
- ✅ Abonnement
- ✅ Support
- ❌ **PAS de Véhicules**
- ❌ **PAS de Statistiques**

#### Plan ESSENTIEL (49€/mois)
Toutes les fonctionnalités Découverte, plus :
- ✅ Véhicules (max 50)
- ✅ Reporting avancé
- ✅ Notifications en temps réel
- ✅ Messagerie de diffusion aux participants
- ✅ Événements illimités
- ✅ Participants (max 500)

#### Plan PRO (199€/mois)
Toutes les fonctionnalités Essentiel, plus :
- ✅ CRM complet
- ✅ Statistiques avancées
- ✅ Véhicules (max 100)
- ✅ Personnalisation du logo dashboard
- ✅ Participants (max 5000)
- ✅ Intégrations

#### Plan PREMIUM (499€/mois)
Toutes les fonctionnalités Pro, plus :
- ✅ Intégrations spécifiques
- ✅ Accès API complet
- ✅ Véhicules illimités
- ✅ Participants (10000+)
- ✅ Support dédié
- ✅ Marque blanche (White Label)

---

## 🔒 Système de Restrictions

### Limites par Plan

| Ressource | DÉCOUVERTE | ESSENTIEL | PRO | PREMIUM |
|-----------|------------|-----------|-----|---------|
| Événements | 2 | Illimité | Illimité | Illimité |
| Participants | 10 | 500 | 5000 | 10000 |
| Véhicules | 0 | 50 | 100 | Illimité |

### Guards Implémentés

#### 1. **PlanGuard** - Protection des pages
Composant qui protège l'accès aux pages selon le plan :
```tsx
<PlanGuard requiredPlan="PRO" featureName="le CRM">
  <CRMContent />
</PlanGuard>
```

Modes disponibles :
- `hide` : Masque complètement le contenu
- `block` : Affiche un message d'upgrade avec boutons d'action
- `alert` : Affiche une alerte mais laisse le contenu visible (désactivé)

#### 2. **ResourceLimitGuard** - Limitation de création
Composant qui limite la création de ressources :
```tsx
<ResourceLimitGuard
  resourceType="events"
  currentCount={eventCount}
>
  <CreateEventButton />
</ResourceLimitGuard>
```

#### 3. **ResourceLimitProgress** - Jauge de progression
Affiche une barre de progression avec la limite :
```tsx
<ResourceLimitProgress
  resourceType="vehicles"
  currentCount={vehicleCount}
  showUpgrade={true}
/>
```

---

## 🔄 Mise à Jour Dynamique du Plan

### Système de Polling et Notifications

Lorsqu'un administrateur modifie le plan d'une entreprise, l'interface se met à jour automatiquement :

#### 1. **Hook usePlanUpdateListener**
- Détecte les changements de plan en temps réel
- Affiche une notification à l'utilisateur
- Rafraîchit automatiquement l'interface

#### 2. **Hook usePlanPolling**
- Vérifie les changements toutes les 60 secondes
- Permet de détecter les modifications faites par l'admin

#### 3. **Hook useRefreshPlan**
- Force un rafraîchissement manuel du plan
- Utilisé après un changement d'abonnement

### Exemple d'utilisation dans l'application :
```tsx
function DashboardLayout({ children }) {
  usePlanUpdateListener(); // Écoute les changements
  usePlanPolling(60000);   // Poll toutes les 60s
  
  return <>{children}</>;
}
```

---

## 💬 Système de Support

### Pour les Utilisateurs
L'espace Support est accessible à tous les utilisateurs pour :
- ✅ Contacter l'admin en cas de souci
- ✅ Demander une upgrade de plan
- ✅ Faire une demande de devis pour les plans PRO/PREMIUM
- ✅ Poser des questions techniques

### Types de demandes disponibles :
- **Question générale** : Pour toute question
- **Support technique** : Aide technique
- **Upgrade de plan** : Demande de changement de plan
- **Demande de devis** : Pour les plans sur devis (PRO/PREMIUM)

### Workflow de demande de devis :
1. L'utilisateur crée une demande via Support
2. La demande est envoyée à l'admin
3. L'admin peut répondre et approuver via `/admin/support`
4. L'utilisateur reçoit une notification
5. Le plan est activé automatiquement après approbation

---

## 🛠️ Architecture Technique

### 1. Fichiers de Configuration

#### `/client/src/lib/plan-permissions.ts`
Fichier central de gestion des permissions :
- Définit la hiérarchie des plans
- Configure les items de menu par plan
- Gère les limites de ressources
- Fonctions utilitaires de vérification d'accès

### 2. Composants Principaux

#### `/client/src/components/DynamicSidebar.tsx`
Sidebar intelligente qui :
- S'adapte automatiquement au plan
- Affiche les badges pour les fonctionnalités premium
- Utilise le contexte PlanFeatures

#### `/client/src/components/PlanGuard.tsx`
Composant de protection d'accès :
- Vérifie le plan requis
- Vérifie les features requises
- Affiche des messages d'upgrade appropriés

#### `/client/src/components/ResourceLimitGuard.tsx`
Gestion des limites de création :
- Vérifie les compteurs actuels
- Bloque la création si limite atteinte
- Affiche des jauges de progression
- Messages d'upgrade intelligents

### 3. Hooks Personnalisés

#### `/client/src/hooks/use-plan-update-listener.ts`
- `usePlanUpdateListener()` : Détecte les changements
- `usePlanPolling(interval)` : Polling périodique
- `useRefreshPlan()` : Rafraîchissement manuel

### 4. Contextes

#### PlanFeaturesContext
Fournit les données du plan à toute l'application :
```tsx
const { planData, hasFeature, canAddMore, getLimit } = usePlanFeatures();
```

---

## 🚀 Déploiement et Configuration

### 1. Configuration des Plans (Base de données)

Le script `update-plans.ts` configure les plans avec les bonnes limites :
```bash
npx tsx update-plans.ts
```

### 2. Variables d'Environnement

Fichier `.env` requis :
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....
JWT_SECRET=...
JWT_REFRESH_SECRET=...
BASE_URL=http://localhost:3000
```

### 3. Installation et Démarrage

```bash
# Installation
npm install

# Mise à jour des plans
npx tsx update-plans.ts

# Mode développement
npm run dev

# Build production
npm run build
npm start
```

---

## 🧪 Guide de Test

### 1. Tester le Plan DÉCOUVERTE

1. Se connecter avec un compte Découverte
2. Vérifier la sidebar :
   - ✅ Voir Tableau de bord, Événements, Participants
   - ❌ NE PAS voir Véhicules, Statistiques, CRM, etc.
3. Essayer de créer le 3ème événement :
   - ❌ Doit être bloqué avec message de limite atteinte
4. Essayer d'ajouter le 11ème participant :
   - ❌ Doit être bloqué

### 2. Tester le Plan ESSENTIEL

1. Passer au plan Essentiel via `/billing`
2. Vérifier la sidebar mise à jour :
   - ✅ Voir Véhicules, Reporting, Notifications, Messagerie
   - ✅ Badge "Essentiel" sur les nouvelles fonctionnalités
3. Tester les limites :
   - ✅ Créer des événements illimités
   - ✅ Ajouter jusqu'à 500 participants
   - ✅ Ajouter jusqu'à 50 véhicules

### 3. Tester le Plan PRO

1. Demander un upgrade vers PRO via Support
2. Admin approuve via `/admin/support`
3. Vérifier la sidebar mise à jour automatiquement :
   - ✅ Voir CRM, Statistiques avancées, Personnalisation
   - ✅ Badge "Pro" sur les nouvelles fonctionnalités
4. Tester les fonctionnalités avancées :
   - ✅ Accéder au CRM
   - ✅ Personnaliser le logo
   - ✅ Utiliser les intégrations

### 4. Tester le Plan PREMIUM

1. Demander un upgrade vers PREMIUM
2. Vérifier toutes les fonctionnalités :
   - ✅ Intégrations spécifiques
   - ✅ API
   - ✅ Véhicules illimités
   - ✅ Badge "Premium"

### 5. Tester le Changement de Plan Dynamique

1. Admin change le plan d'une entreprise via `/admin/companies`
2. L'utilisateur doit voir :
   - 🔔 Notification "Plan mis à jour !"
   - 🔄 Sidebar mise à jour automatiquement
   - ✨ Nouvelles fonctionnalités accessibles immédiatement

---

## 📊 Endpoints API

### Plans
- `GET /api/plans` - Liste tous les plans actifs
- `GET /api/plans/current-features` - Fonctionnalités du plan actuel
- `POST /api/plans/upgrade` - Demander un upgrade

### Support
- `POST /api/support/requests` - Créer une demande de support
- `GET /api/support/requests` - Liste des demandes
- `GET /api/support/requests/:id` - Détails d'une demande
- `POST /api/support/messages` - Envoyer un message

### Admin
- `GET /api/admin/support/requests` - Toutes les demandes (admin)
- `PATCH /api/admin/support/requests/:id/status` - Changer le statut
- `POST /api/admin/change-plan` - Changer le plan d'une entreprise

---

## 🔗 Liens Utiles

### Application
**URL Publique** : https://5000-ihsc3je1ktlm8lgyh4url-0e616f0a.sandbox.novita.ai

### Pages Importantes
- Accueil : `/`
- Login : `/login`
- Dashboard : `/dashboard`
- Support : `/support`
- Abonnement : `/billing`
- Admin : `/admin`

### Comptes de Test

#### Admin
- Email : `admin1@teammove.fr`
- Mot de passe : `Admin123!`

#### Entreprise Découverte
À créer via `/register` ou utiliser les comptes de test existants

---

## 📝 Résumé des Modifications

### Fichiers Créés
1. ✅ `/client/src/lib/plan-permissions.ts` - Configuration des permissions
2. ✅ `/client/src/components/DynamicSidebar.tsx` - Sidebar dynamique
3. ✅ `/client/src/components/PlanGuard.tsx` - Protection d'accès
4. ✅ `/client/src/components/ResourceLimitGuard.tsx` - Limites de ressources
5. ✅ `/client/src/hooks/use-plan-update-listener.ts` - Hooks de mise à jour

### Fichiers Modifiés
1. ✅ `/client/src/App.tsx` - Intégration DynamicSidebar et hooks
2. ✅ `/update-plans.ts` - Mise à jour des limites de plans
3. ✅ `.env` - Variables d'environnement

### Fonctionnalités Existantes Utilisées
- ✅ Système de support déjà implémenté
- ✅ API de plans déjà fonctionnelle
- ✅ Contexte PlanFeatures déjà en place
- ✅ Routes admin/support déjà créées

---

## 🎉 Avantages du Système

### Pour les Utilisateurs
1. **Interface claire** : Ne voient que les fonctionnalités disponibles
2. **Upgrade fluide** : Encouragés à passer au plan supérieur au bon moment
3. **Feedback immédiat** : Notifications lors des changements de plan
4. **Support intégré** : Accès facile au support pour les questions

### Pour les Administrateurs
1. **Gestion centralisée** : Changement de plan depuis l'admin
2. **Support intégré** : Réponse aux demandes via interface dédiée
3. **Contrôle total** : Approbation manuelle des plans premium

### Pour l'Application
1. **Scalabilité** : Facile d'ajouter de nouveaux plans
2. **Maintenabilité** : Configuration centralisée
3. **Performance** : Guards optimisés et mise en cache
4. **UX cohérente** : Comportement uniforme dans toute l'app

---

## 🔮 Évolutions Possibles

### Court Terme
- [ ] Dashboard admin pour voir les demandes de devis en attente
- [ ] Notifications push pour les changements de plan
- [ ] Analytics sur l'utilisation des fonctionnalités par plan

### Moyen Terme
- [ ] Essai gratuit de 14 jours pour ESSENTIEL
- [ ] Système de crédits pour certaines fonctionnalités
- [ ] Marketplace d'add-ons premium

### Long Terme
- [ ] Plans personnalisés par entreprise
- [ ] API publique pour intégrations tierces
- [ ] White-label complet pour PREMIUM

---

## 📞 Support Technique

En cas de problème :
1. Vérifier les logs du serveur : `npm run dev`
2. Vérifier la base de données : `npx tsx update-plans.ts`
3. Consulter cette documentation
4. Contacter l'équipe de développement

---

**Date de création** : 14 Novembre 2025  
**Version** : 1.0  
**Développeur** : GenSpark AI Developer  
**Statut** : ✅ Opérationnel et testé
