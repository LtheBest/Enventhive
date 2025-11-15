# Guide de Test - Création d'Événements et Covoiturage

## 🚀 URL de test

**Backend API**: `https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai`

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Test des véhicules d'entreprise](#test-des-véhicules-dentreprise)
3. [Test de création d'événement](#test-de-création-dévénement)
4. [Test d'inscription publique - Conducteur](#test-dinscription-publique---conducteur)
5. [Test d'inscription publique - Passager](#test-dinscription-publique---passager)
6. [Test du matching géographique](#test-du-matching-géographique)

---

## Prérequis

1. **Compte entreprise créé** avec un plan actif
2. **Token d'authentification** (JWT) obtenu via `/api/auth/login`
3. **Tool comme Postman, cURL, ou Insomnia** pour tester les APIs

### Obtenir un token d'authentification

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

---

## Test des véhicules d'entreprise

### 1. Créer un véhicule d'entreprise

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/company-vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "name": "Bus A",
    "vehicleType": "bus",
    "licensePlate": "AB-123-CD",
    "totalSeats": 50
  }'
```

**Réponse attendue**: 201 Created avec les détails du véhicule

### 2. Lister les véhicules

```bash
curl -X GET https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/company-vehicles \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 3. Modifier un véhicule

```bash
curl -X PATCH https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/company-vehicles/VEHICLE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "totalSeats": 45
  }'
```

---

## Test de création d'événement

### 1. Créer un événement

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Séminaire Annuel 2025",
    "description": "Événement de team building",
    "eventType": "single",
    "startDate": "2025-06-15T09:00:00Z",
    "endDate": "2025-06-15T18:00:00Z",
    "location": "Parc des Expositions",
    "city": "Paris",
    "maxParticipants": 200
  }'
```

**Note**: Un QR code et un lien public seront générés automatiquement.

### 2. Ajouter un véhicule à l'événement

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/company-vehicles/add-to-event/EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "companyVehicleId": "VEHICLE_ID"
  }'
```

---

## Test d'inscription publique - Conducteur

### 1. Accéder aux détails publics de l'événement

```bash
curl -X GET https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID
```

**Pas d'authentification requise !**

### 2. S'inscrire en tant que conducteur

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID/join \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "0612345678",
    "city": "Paris",
    "role": "driver",
    "departureLocation": "123 Rue de la Paix, Paris",
    "departureTime": "2025-06-15T07:00:00Z",
    "totalSeats": 4,
    "isPaidRide": true,
    "pricePerKm": 0.10,
    "estimatedDistance": 50
  }'
```

**Réponse attendue**: 
- 201 Created
- Détails du participant créé
- Détails du véhicule créé
- Nombre de passagers notifiés (si applicable)

---

## Test d'inscription publique - Passager

### 1. S'inscrire en tant que passager (avec conducteurs disponibles)

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID/join \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie.martin@example.com",
    "phone": "0687654321",
    "city": "Paris",
    "role": "passenger",
    "passengerDepartureLocation": "45 Avenue des Champs-Élysées, Paris"
  }'
```

**Réponse attendue**: 
- 201 Created
- Liste des conducteurs disponibles dans la même ville
- Message invitant à sélectionner un conducteur

### 2. S'inscrire en tant que passager (sans conducteurs disponibles)

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID/join \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Pierre",
    "lastName": "Bernard",
    "email": "pierre.bernard@example.com",
    "phone": "0645678901",
    "city": "Lyon",
    "role": "passenger",
    "passengerDepartureLocation": "12 Place Bellecour, Lyon"
  }'
```

**Réponse attendue**: 
- 201 Created
- Demande de trajet créée avec statut "pending"
- Message indiquant que l'utilisateur sera notifié dès qu'un conducteur s'inscrit

### 3. Réserver une place sur un véhicule

```bash
curl -X POST https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID/book-vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "PARTICIPANT_ID",
    "vehicleId": "VEHICLE_ID"
  }'
```

**Réponse attendue**: 
- 201 Created
- Confirmation de réservation
- Email de confirmation envoyé

### 4. Consulter les véhicules disponibles par ville

```bash
curl -X GET "https://5000-iyswbtyr6wwevsqmo9pxi-b9b802c4.sandbox.novita.ai/api/public/events/EVENT_ID/available-vehicles?city=Paris"
```

---

## Test du matching géographique

### Scénario complet

1. **Créer une demande passager à Lyon** (aucun conducteur)
   - Statut: `pending`
   - Aucune notification envoyée

2. **Créer un conducteur à Lyon**
   - Le système détecte automatiquement la demande passager
   - Email envoyé au passager: "Un conducteur est disponible"
   - Statut de la demande passé à `matched`

3. **Le passager réserve une place**
   - Place décrémentée sur le véhicule
   - Statut de la réservation: `confirmed`
   - Email de confirmation envoyé au passager

---

## 📊 Vérifications des limites par plan

### Plan Découverte (gratuit)
- ❌ Devrait bloquer après 2 événements/an
- ❌ Devrait bloquer après 20 participants
- ❌ Pas d'accès aux véhicules d'entreprise

### Plan Essentiel (25,99€/mois)
- ✅ Événements illimités
- ❌ Devrait bloquer après 500 participants
- ❌ Devrait bloquer après 50 véhicules

### Tester les limites

```bash
# Créer plusieurs événements/participants pour atteindre la limite
# Le système devrait retourner une erreur 403 avec le message approprié
```

---

## 🐛 Debugging

### Vérifier les logs du serveur

Les logs du serveur affichent:
- ✅ Emails envoyés avec succès
- ❌ Erreurs d'envoi d'email
- 📧 Notifications de matching
- 🚗 Créations de véhicules et réservations

### Erreurs courantes

1. **403 Forbidden "Limite atteinte"**
   - Vérifier le plan de l'entreprise
   - Contacter l'administrateur pour un upgrade

2. **400 Bad Request "Email déjà inscrit"**
   - L'email existe déjà pour cet événement
   - Utiliser un autre email

3. **404 Not Found "Événement introuvable"**
   - Vérifier l'ID de l'événement
   - Vérifier que l'événement n'est pas annulé

---

## 📨 Notifications email

Les emails sont envoyés via **SendGrid** pour:

1. **Création d'événement** → Organisateur
2. **Invitation de participant** → Participant invité
3. **Conducteur disponible** → Passagers en attente
4. **Confirmation de réservation** → Passager
5. **Rappel d'événement** → Tous les participants

---

## 🎯 Prochains tests recommandés

- [ ] Test des restrictions de plan en production
- [ ] Test d'envoi d'emails réels (non test)
- [ ] Test de charge avec 1000+ participants
- [ ] Test du QR code (scan et redirection)
- [ ] Test des liens publics (partage social)
- [ ] Test de l'interface utilisateur (à venir)

---

## 📞 Support

Pour toute question ou problème, référez-vous à:
- **Pull Request**: https://github.com/LtheBest/Enventhive/pull/11
- **Documentation API**: `/docs` (à venir)

---

**Date de création**: 14 novembre 2025
**Dernière mise à jour**: 14 novembre 2025
**Version**: 1.0.0
