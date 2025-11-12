# Guide de Test des Fonctionnalités Admin - TEAMMOVE

## 📋 Vue d'ensemble

Ce guide vous permet de tester toutes les fonctionnalités d'administration de TEAMMOVE.

## 🔐 Comptes Admin de Test

### Admin Principal
- **Email**: `admin1@teammove.fr`
- **Mot de passe**: `Admin123!`
- **Page de connexion**: `/admin/login`

### Admin Secondaire  
- **Email**: `admin2@teammove.fr`
- **Mot de passe**: `Admin123!`
- **Page de connexion**: `/admin/login`

---

## ✅ Fonctionnalités Implémentées

### 1. Système de Sécurité ✓

#### CAPTCHA Obligatoire
- [x] CAPTCHA mathématique sur login admin
- [x] Vérification serveur avec JWT signé
- [x] Rafraîchissement automatique du challenge
- [x] Validation en temps réel

**Test**: 
1. Aller sur `/admin/login`
2. Vérifier la présence du CAPTCHA mathématique
3. Essayer de se connecter sans résoudre → Erreur attendue
4. Résoudre le CAPTCHA correctement → Connexion réussie

#### Protection Brute-Force
- [x] Limitation 15 tentatives / 15 minutes
- [x] Verrouillage du compte après 5 échecs (30 minutes)
- [x] Messages d'erreur informatifs

**Test**:
1. Essayer de se connecter avec un mauvais mot de passe 6 fois
2. Le compte devrait être verrouillé temporairement

---

### 2. Dashboard Admin Principal ✓

#### Statistiques Globales
- [x] Nombre total d'entreprises
- [x] Répartition par plan (DECOUVERTE, ESSENTIEL, PRO, PREMIUM)
- [x] MRR (Monthly Recurring Revenue)
- [x] Devis en attente de validation
- [x] Inscriptions récentes (7 derniers jours)

**Test**:
1. Se connecter en tant qu'admin
2. Accéder au dashboard `/admin`
3. Vérifier l'affichage des cartes de statistiques

#### Vue Globale des Entreprises
- [x] Liste paginée de toutes les entreprises
- [x] Filtrage et recherche
- [x] Détails du plan et statut

**Test**:
1. Aller sur `/admin/companies`
2. Vérifier la liste complète des entreprises
3. Tester la pagination

---

### 3. Gestion des Entreprises ✓

#### Actions Individuelles
- [x] Activer/Désactiver un compte entreprise
- [x] Voir les détails d'une entreprise
- [x] Supprimer une entreprise (avec confirmation)
- [x] Historique des transactions
- [x] Historique des changements de plan

**Test**:
1. Depuis `/admin/companies`:
   - Cliquer sur le bouton "Désactiver" d'une entreprise
   - Vérifier que le statut change
   - Cliquer sur "Supprimer" et confirmer
   - Vérifier que l'entreprise est supprimée

#### Actions Groupées
- [x] Sélection multiple d'entreprises
- [x] Changement de plan en masse
- [x] Export CSV de toutes les entreprises

**Test**:
1. Cocher plusieurs entreprises dans la liste
2. Sélectionner un nouveau plan dans le dropdown
3. Cliquer sur "Appliquer" → Les plans doivent être mis à jour
4. Cliquer sur "Exporter CSV" → Un fichier CSV doit être téléchargé

---

### 4. Validation des Devis ✓

#### Gestion Manuelle des Devis
- [x] Liste des entreprises avec devis en attente
- [x] Détails de la demande (plan souhaité, entreprise)
- [x] Approbation du devis → Activation du plan
- [x] Notification à l'entreprise (email)

**Test**:
1. Aller sur `/admin/validations`
2. Voir la liste des devis en attente
3. Approuver un devis → L'entreprise devrait passer au plan demandé
4. Vérifier dans `/admin/companies` que le plan a changé

---

### 5. Messagerie Admin ✓

#### Types de Messages
- [x] Message individuel (1 entreprise)
- [x] Message de groupe (plusieurs entreprises sélectionnées)
- [x] Diffusion générale (toutes les entreprises)

#### Fonctionnalités
- [x] Composer un nouveau message
- [x] Sélectionner les destinataires
- [x] Historique des messages envoyés
- [x] Nombre de destinataires par message
- [x] Date d'envoi

**Test**:
1. Aller sur `/admin/messages`
2. Cliquer sur "Nouveau message"
3. Remplir objet et contenu
4. Sélectionner des entreprises destinataires
5. Envoyer → Le message apparaît dans l'historique

---

### 6. Export de Rapports ✓

#### Exports Disponibles
- [x] Export CSV des entreprises (toutes les données)
- [x] Export CSV des transactions
- [x] Format compatible Excel (UTF-8 BOM)
- [x] Nom de fichier avec date

**Test**:
1. Depuis `/admin/companies`, cliquer sur "Exporter CSV"
2. Un fichier CSV doit être téléchargé
3. Ouvrir dans Excel → Les accents doivent être corrects
4. Vérifier les colonnes: ID, Nom, SIREN, Email, Plan, etc.

---

### 7. Statistiques Avancées ✓

#### Métriques Disponibles
- [x] Transactions par statut
- [x] Revenus par plan
- [x] Croissance mensuelle des inscriptions
- [x] Taux de conversion
- [x] Entreprises inactives

**Test**:
1. Aller sur `/admin/stats`
2. Vérifier les graphiques et tableaux
3. Les données doivent correspondre à la base de données

---

## 🗄️ Tests de la Base de Données

### Script SQL de Test

Un script SQL complet est fourni: `TEST_ADMIN_QUERIES.sql`

**Exécution**:
```bash
# Se connecter à la base de données
psql $DATABASE_URL

# Ou exécuter le script directement
psql $DATABASE_URL -f TEST_ADMIN_QUERIES.sql
```

### Vérifications Principales

1. **Comptes Admin**:
   ```sql
   SELECT * FROM users WHERE role = 'admin';
   ```
   → Doit retourner 2 comptes

2. **Plans Disponibles**:
   ```sql
   SELECT tier, name FROM plans ORDER BY tier;
   ```
   → Doit retourner 4 plans (DECOUVERTE, ESSENTIEL, PRO, PREMIUM)

3. **Entreprises Inscrites**:
   ```sql
   SELECT COUNT(*) FROM companies;
   ```

4. **Messages Admin**:
   ```sql
   SELECT COUNT(*) FROM admin_messages;
   SELECT COUNT(*) FROM message_recipients;
   ```

---

## 🧪 Scénarios de Test Complets

### Scénario 1: Premier Login Admin
1. Ouvrir `/admin/login`
2. Entrer email: `admin1@teammove.fr`
3. Entrer mot de passe: `Admin123!`
4. Résoudre le CAPTCHA
5. Cocher "Se souvenir de moi"
6. Cliquer "Se connecter"
7. ✓ Redirection vers `/admin`

### Scénario 2: Valider un Devis PRO
1. Aller sur `/admin/validations`
2. Trouver une entreprise avec devis PRO en attente
3. Cliquer "Approuver"
4. ✓ Message de confirmation
5. Aller sur `/admin/companies`
6. ✓ L'entreprise est maintenant en plan PRO

### Scénario 3: Envoyer un Message Groupé
1. Aller sur `/admin/messages`
2. Cliquer "Nouveau message"
3. Sélectionner "Type: Groupe"
4. Objet: "Nouvelle fonctionnalité"
5. Contenu: "Nous avons ajouté..."
6. Sélectionner 3 entreprises
7. Cliquer "Envoyer"
8. ✓ Message apparaît dans l'historique

### Scénario 4: Changement de Plan en Masse
1. Aller sur `/admin/companies`
2. Cocher 5 entreprises au plan DECOUVERTE
3. Sélectionner plan "ESSENTIEL"
4. Cliquer "Appliquer"
5. ✓ Les 5 entreprises passent en ESSENTIEL

### Scénario 5: Désactiver une Entreprise
1. Aller sur `/admin/companies`
2. Trouver une entreprise active
3. Cliquer sur l'icône de désactivation
4. ✓ Le statut passe à "Inactif"
5. ✓ L'entreprise ne peut plus se connecter

### Scénario 6: Export CSV
1. Aller sur `/admin/companies`
2. Cliquer "Exporter CSV"
3. ✓ Fichier `companies_YYYY-MM-DD.csv` téléchargé
4. Ouvrir dans Excel
5. ✓ Toutes les colonnes présentes
6. ✓ Accents correctement affichés

---

## 📊 Requêtes SQL Utiles pour Tests

### Vérifier les Admins
```sql
SELECT email, role, is_active 
FROM users 
WHERE role = 'admin';
```

### Statistiques Dashboard
```sql
-- Total entreprises
SELECT COUNT(*) FROM companies;

-- Entreprises par plan
SELECT p.tier, COUNT(*) 
FROM company_plan_state cps
JOIN plans p ON cps.plan_id = p.id
GROUP BY p.tier;

-- Devis en attente
SELECT COUNT(*) 
FROM company_plan_state 
WHERE quote_pending = true;
```

### Messages Envoyés
```sql
SELECT 
    am.subject,
    am.message_type,
    COUNT(mr.id) as recipients
FROM admin_messages am
LEFT JOIN message_recipients mr ON am.id = mr.message_id
GROUP BY am.id, am.subject, am.message_type;
```

### Transactions et Revenus
```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount::numeric) as total
FROM transactions
GROUP BY status;
```

---

## 🔍 Points de Contrôle

### Interface Admin
- [ ] Login admin sécurisé avec CAPTCHA
- [ ] Dashboard avec statistiques
- [ ] Liste des entreprises avec pagination
- [ ] Actions individuelles (activer/désactiver/supprimer)
- [ ] Actions groupées (changement plan en masse)
- [ ] Validation des devis
- [ ] Messagerie admin
- [ ] Exports CSV

### Base de Données
- [ ] 2 comptes admin créés
- [ ] 4 plans disponibles
- [ ] Tables de messagerie créées
- [ ] Relations et contraintes intègres
- [ ] Index optimisés

### Sécurité
- [ ] CAPTCHA sur login admin
- [ ] Rate limiting fonctionnel
- [ ] Verrouillage après échecs
- [ ] JWT tokens valides
- [ ] Isolation multi-tenant

---

## 🐛 Résolution de Problèmes

### Erreur: "Database connection failed"
```bash
# Vérifier l'URL de connexion
echo $DATABASE_URL

# Tester la connexion
psql $DATABASE_URL -c "SELECT 1;"
```

### Erreur: "Admin not found"
```bash
# Ré-exécuter le seed
npm run db:seed
```

### Erreur: "CAPTCHA failed"
- Vérifier que le token JWT est valide
- Rafraîchir le CAPTCHA avec le bouton de rafraîchissement
- Vérifier la console navigateur pour les erreurs

---

## 📝 Notes Importantes

1. **Sécurité**: Les comptes admin ne peuvent JAMAIS être créés via l'interface publique
2. **Isolation**: Chaque admin voit TOUTES les entreprises (pas d'isolation)
3. **Auditabilité**: Tous les changements sont loggés dans `plan_history`
4. **Données de Test**: Utiliser les comptes de test fournis dans `ACCES_TEST.md`

---

## 🎯 Résumé des Endpoints API Admin

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/admin/stats` | GET | Statistiques dashboard |
| `/api/admin/companies` | GET | Liste des entreprises |
| `/api/admin/approve-quote` | POST | Approuver un devis |
| `/api/admin/change-plan` | POST | Changer le plan d'une entreprise |
| `/api/admin/bulk-change-plan` | POST | Changement de plan en masse |
| `/api/admin/toggle-company-status` | POST | Activer/désactiver entreprise |
| `/api/admin/send-message` | POST | Envoyer un message |
| `/api/admin/messages` | GET | Historique des messages |
| `/api/admin/export/companies` | GET | Export CSV entreprises |
| `/api/admin/export/transactions` | GET | Export CSV transactions |
| `/api/admin/company/:id` | GET | Détails entreprise |
| `/api/admin/company/:id` | DELETE | Supprimer entreprise |

---

**Date de création**: 2025-11-12  
**Version**: 1.0  
**Auteur**: Équipe TEAMMOVE
