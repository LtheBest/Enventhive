# 🧪 Guide de Test - Création d'Événements

## 🚀 URL de Test

**Backend API**: https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai

## 📋 Prérequis

1. Avoir un compte entreprise avec un plan actif
2. Être authentifié avec un token JWT valide
3. [Optionnel] Avoir des véhicules d'entreprise créés

## 🔐 Authentification

### 1. Se connecter

```bash
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

**Réponse attendue**:
```json
{
  "user": {...},
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

📝 **Copiez le `accessToken` pour les requêtes suivantes**

---

## 📝 Test 1: Création d'Événement Simple

### Requête

```bash
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Réunion Team Building",
    "startDate": "2025-12-15T10:00:00Z",
    "location": "1 rue Lefebvre, 91350 Grigny",
    "city": "Paris",
    "description": "Team building annuel avec activités",
    "eventType": "single"
  }'
```

### ✅ Vérifications

- [ ] Status: **201 Created**
- [ ] Response contient: `event.qrCode` (base64 image)
- [ ] Response contient: `event.publicLink` (URL unique)
- [ ] Response contient: `event.maxParticipants` (défini selon le plan)
- [ ] Email de confirmation envoyé à l'organisateur

### 📧 Email Reçu

Vérifiez votre boîte mail pour:
- **Sujet**: "Événement créé avec succès : Réunion Team Building"
- **Contenu**: Détails de l'événement, QR code, lien public
- **Expéditeur**: erictchuisseu@yahoo.fr

---

## 👥 Test 2: Création avec Participants

### Requête

```bash
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Séminaire Commercial",
    "startDate": "2025-12-20T09:00:00Z",
    "location": "Parc des Expositions",
    "city": "Lyon",
    "description": "Séminaire annuel de l'\''équipe commerciale",
    "eventType": "single",
    "participants": [
      {
        "email": "jean.dupont@example.com",
        "firstName": "Jean",
        "lastName": "Dupont",
        "phone": "0612345678",
        "city": "Lyon",
        "role": "driver"
      },
      {
        "email": "marie.martin@example.com",
        "firstName": "Marie",
        "lastName": "Martin",
        "phone": "0687654321",
        "city": "Lyon",
        "role": "passenger"
      }
    ]
  }'
```

### ✅ Vérifications

- [ ] Status: **201 Created**
- [ ] Response: `participants` array avec 2 éléments
- [ ] Response: `message` mentionne "2 participant(s) invité(s)"
- [ ] 2 emails d'invitation envoyés

### 📧 Emails Reçus (Participants)

Vérifiez les boîtes mail des participants pour:
- **Sujet**: "Invitation : Séminaire Commercial - [Nom Entreprise]"
- **Contenu**: Détails événement, boutons Accepter/Décliner
- **Expéditeur**: erictchuisseu@yahoo.fr

---

## 🚗 Test 3: Création avec Véhicules d'Entreprise

### Étape 1: Créer des Véhicules (si nécessaire)

```bash
# Créer le premier véhicule
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/company-vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "name": "Bus A",
    "vehicleType": "bus",
    "licensePlate": "AB-123-CD",
    "totalSeats": 50
  }'

# Créer le second véhicule
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/company-vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "name": "Minibus B",
    "vehicleType": "minibus",
    "licensePlate": "XY-456-ZT",
    "totalSeats": 15
  }'
```

**📝 Notez les IDs des véhicules créés**

### Étape 2: Lister les Véhicules

```bash
curl -X GET https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/company-vehicles \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Étape 3: Créer l'Événement avec Véhicules

```bash
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Sortie Ski Entreprise",
    "startDate": "2026-01-15T08:00:00Z",
    "location": "Station Les Arcs",
    "city": "Bourg-Saint-Maurice",
    "description": "Week-end ski pour toute l'\''entreprise",
    "eventType": "single",
    "companyVehicleIds": ["ID_VEHICULE_1", "ID_VEHICULE_2"]
  }'
```

### ✅ Vérifications

- [ ] Status: **201 Created**
- [ ] Response: `companyVehicles` array avec 2 éléments
- [ ] Response: `message` mentionne "2 véhicule(s) ajouté(s)"
- [ ] Véhicules liés à l'événement dans la base de données

---

## 🚫 Test 4: Limites de Plan

### Plan Découverte (2 événements/an)

```bash
# Créer le 1er événement
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Événement 1",
    "startDate": "2025-12-01T10:00:00Z",
    "location": "Paris",
    "city": "Paris",
    "eventType": "single"
  }'

# Créer le 2ème événement
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Événement 2",
    "startDate": "2025-12-15T10:00:00Z",
    "location": "Lyon",
    "city": "Lyon",
    "eventType": "single"
  }'

# Créer le 3ème événement (doit échouer)
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Événement 3",
    "startDate": "2025-12-25T10:00:00Z",
    "location": "Marseille",
    "city": "Marseille",
    "eventType": "single"
  }'
```

### ✅ Vérifications

- [ ] 1er événement: **201 Created** ✅
- [ ] 2ème événement: **201 Created** ✅
- [ ] 3ème événement: **403 Forbidden** ❌
- [ ] Message d'erreur clair: "Limite d'événements annuelle atteinte"

### Réponse Erreur Attendue (3ème événement)

```json
{
  "error": "Limite d'événements annuelle atteinte",
  "message": "Votre plan Découverte permet un maximum de 2 événements par an. Vous avez déjà créé 2 événement(s) en 2025. Passez à un plan supérieur pour créer plus d'événements.",
  "limit": 2,
  "current": 2,
  "period": "annual",
  "year": 2025
}
```

---

## 📊 Test 5: Récupération des Événements

### Lister Tous les Événements

```bash
curl -X GET https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### ✅ Vérifications

- [ ] Status: **200 OK**
- [ ] Response: `events` array avec tous les événements créés
- [ ] Chaque événement contient: `qrCode`, `publicLink`, `maxParticipants`

### Filtrer par Statut

```bash
# Événements à venir
curl -X GET "https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events?status=upcoming" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Filtrer par Ville

```bash
curl -X GET "https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events?city=Paris" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 🔍 Test 6: Détails d'un Événement

```bash
curl -X GET https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events/EVENT_ID \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### ✅ Vérifications

- [ ] Status: **200 OK**
- [ ] Response: Détails complets de l'événement
- [ ] QR code présent
- [ ] Lien public présent

---

## 🌐 Test 7: Accès Public (Sans Authentification)

### Accéder à l'Événement via Lien Public

```bash
curl -X GET https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/public/events/SLUG
```

Où `SLUG` est extrait de `publicLink`: 
- `http://localhost:3000/events/abc123def456/public` → SLUG = `abc123def456`

### ✅ Vérifications

- [ ] Status: **200 OK** (pas besoin d'authentification)
- [ ] Response: Détails publics de l'événement
- [ ] Informations de l'entreprise
- [ ] Statistiques des participants

---

## 🗑️ Test 8: Suppression d'Événement

```bash
curl -X DELETE https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events/EVENT_ID \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### ✅ Vérifications

- [ ] Status: **200 OK**
- [ ] Response: `{ "message": "Événement supprimé avec succès" }`
- [ ] Événement n'apparaît plus dans la liste

---

## 🔧 Test 9: Modification d'Événement

```bash
curl -X PATCH https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/events/EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Nouveau Titre Modifié",
    "description": "Description mise à jour"
  }'
```

### ✅ Vérifications

- [ ] Status: **200 OK**
- [ ] Response: Événement avec modifications
- [ ] `updatedAt` timestamp mis à jour

---

## 📸 Test 10: QR Code et Partage

### Télécharger le QR Code

Le QR code est retourné en base64 dans la réponse. Pour le visualiser:

1. Copier le contenu de `event.qrCode`
2. Le coller dans un navigateur: `data:image/png;base64,iVBORw0KG...`
3. Ou l'afficher dans une balise `<img>`:
   ```html
   <img src="data:image/png;base64,iVBORw0KG..." alt="QR Code" />
   ```

### Partager le Lien Public

Le lien public est au format:
```
http://localhost:3000/events/{slug}/public
```

Ce lien peut être partagé:
- Par email
- Sur les réseaux sociaux
- Via SMS
- En impression

---

## 🐛 Dépannage

### Erreur 401: Unauthorized

**Cause**: Token JWT expiré ou invalide

**Solution**:
```bash
# Renouveler le token
curl -X POST https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "VOTRE_REFRESH_TOKEN"
  }'
```

### Erreur 403: Forbidden (Limite atteinte)

**Cause**: Limite du plan dépassée

**Solution**: Upgrader le plan via l'interface admin

### Emails non reçus

**Vérifications**:
- [ ] Vérifier le dossier spam
- [ ] Vérifier l'email dans les logs serveur
- [ ] Vérifier la clé SendGrid API
- [ ] Vérifier que l'email expéditeur est vérifié sur SendGrid

### QR Code ne s'affiche pas

**Vérifications**:
- [ ] Vérifier que `event.qrCode` n'est pas `null`
- [ ] Vérifier le format base64
- [ ] Essayer de l'afficher dans une balise `<img>`

---

## 📝 Checklist de Test Complète

### Fonctionnalités Basiques
- [ ] Création d'événement simple
- [ ] Récupération de la liste des événements
- [ ] Récupération des détails d'un événement
- [ ] Modification d'un événement
- [ ] Suppression d'un événement

### Fonctionnalités Avancées
- [ ] Création avec participants
- [ ] Création avec véhicules d'entreprise
- [ ] Génération de QR code
- [ ] Génération de lien public
- [ ] Accès public sans authentification

### Limites et Restrictions
- [ ] Vérification limite événements (plan Découverte)
- [ ] Vérification limite participants
- [ ] Vérification limite véhicules
- [ ] Messages d'erreur clairs

### Emails
- [ ] Email de confirmation organisateur
- [ ] Emails d'invitation participants
- [ ] Format HTML correct
- [ ] Boutons cliquables
- [ ] Informations complètes

### Sécurité
- [ ] Authentification JWT requise
- [ ] Tokens expirables
- [ ] Validation des données entrantes
- [ ] Vérification de propriété des ressources

---

## 🎯 Résultats Attendus

### ✅ Tous les tests doivent passer

Si tous les tests passent, vous pouvez considérer que:
- ✅ La création d'événements fonctionne correctement
- ✅ La gestion des participants est opérationnelle
- ✅ La gestion des véhicules est fonctionnelle
- ✅ Les limites de plan sont respectées
- ✅ Les emails sont envoyés correctement
- ✅ Le QR code et le lien public sont générés
- ✅ La sécurité est assurée

---

**Date de création**: 15 novembre 2025  
**Backend API**: https://5000-i972ge6dpmo4880istwai-2b54fc91.sandbox.novita.ai  
**Version**: 1.0.0  
**Status**: ✅ Prêt pour les tests
