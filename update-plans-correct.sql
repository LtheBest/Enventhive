-- Mise à jour des plans d'abonnement avec les nouvelles limites
-- Basé sur les spécifications fournies

-- Plan DÉCOUVERTE
UPDATE plans
SET 
  name = 'Découverte',
  description = 'Plan gratuit pour découvrir TEAMMOVE',
  monthly_price = 0.00,
  annual_price = 0.00,
  features = '{
    "hasAPI": false,
    "hasCRM": false,
    "maxEvents": 2,
    "maxVehicles": 0,
    "hasCustomLogo": false,
    "hasWhiteLabel": false,
    "hasIntegrations": false,
    "maxParticipants": 20,
    "hasNotifications": false,
    "hasDedicatedSupport": false,
    "hasAdvancedReporting": false
  }'::jsonb,
  requires_quote = false,
  is_active = true
WHERE tier = 'DECOUVERTE';

-- Plan ESSENTIEL
UPDATE plans
SET 
  name = 'Essentiel',
  description = 'Pour les entreprises qui grandissent',
  monthly_price = 25.99,
  annual_price = 300.00,
  features = '{
    "hasAPI": false,
    "hasCRM": false,
    "maxEvents": null,
    "maxVehicles": 50,
    "hasCustomLogo": false,
    "hasWhiteLabel": false,
    "hasIntegrations": false,
    "maxParticipants": 500,
    "hasNotifications": true,
    "hasDedicatedSupport": false,
    "hasAdvancedReporting": true
  }'::jsonb,
  requires_quote = false,
  is_active = true
WHERE tier = 'ESSENTIEL';

-- Plan PRO
UPDATE plans
SET 
  name = 'Pro',
  description = 'Solution complète pour les professionnels',
  monthly_price = 0.00,
  annual_price = 0.00,
  features = '{
    "hasAPI": true,
    "hasCRM": true,
    "maxEvents": null,
    "maxVehicles": 100,
    "hasCustomLogo": true,
    "hasWhiteLabel": false,
    "hasIntegrations": true,
    "maxParticipants": 5000,
    "hasNotifications": true,
    "hasDedicatedSupport": false,
    "hasAdvancedReporting": true
  }'::jsonb,
  requires_quote = true,
  is_active = true
WHERE tier = 'PRO';

-- Plan PREMIUM
UPDATE plans
SET 
  name = 'Premium',
  description = 'Solution sur-mesure avec marque blanche',
  monthly_price = 0.00,
  annual_price = 0.00,
  features = '{
    "hasAPI": true,
    "hasCRM": true,
    "maxEvents": null,
    "maxVehicles": null,
    "hasCustomLogo": true,
    "hasWhiteLabel": true,
    "hasIntegrations": true,
    "maxParticipants": 10000,
    "hasNotifications": true,
    "hasDedicatedSupport": true,
    "hasAdvancedReporting": true
  }'::jsonb,
  requires_quote = true,
  is_active = true
WHERE tier = 'PREMIUM';
