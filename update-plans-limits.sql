-- Script SQL pour mettre à jour les plans avec les bonnes limites selon les spécifications

-- Mise à jour du plan DECOUVERTE
UPDATE plans
SET features = jsonb_set(
    jsonb_set(
        jsonb_set(
            features,
            '{maxEvents}',
            '2'::jsonb
        ),
        '{maxParticipants}',
        '10'::jsonb
    ),
    '{maxVehicles}',
    '0'::jsonb
)
WHERE tier = 'DECOUVERTE';

-- Mise à jour du plan ESSENTIEL
UPDATE plans
SET features = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    features,
                    '{maxEvents}',
                    'null'::jsonb  -- Illimité
                ),
                '{maxParticipants}',
                '500'::jsonb
            ),
            '{maxVehicles}',
            '50'::jsonb
        ),
        '{hasAdvancedReporting}',
        'true'::jsonb
    ),
    '{hasNotifications}',
    'true'::jsonb
)
WHERE tier = 'ESSENTIEL';

-- Mise à jour du plan PRO
UPDATE plans
SET features = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    features,
                                    '{maxEvents}',
                                    'null'::jsonb  -- Illimité
                                ),
                                '{maxParticipants}',
                                '5000'::jsonb
                            ),
                            '{maxVehicles}',
                            '100'::jsonb
                        ),
                        '{hasAdvancedReporting}',
                        'true'::jsonb
                    ),
                    '{hasNotifications}',
                    'true'::jsonb
                ),
                '{hasCRM}',
                'true'::jsonb
            ),
            '{hasCustomLogo}',
            'true'::jsonb
        ),
        '{hasAPI}',
        'true'::jsonb
    ),
    '{hasIntegrations}',
    'true'::jsonb
)
WHERE tier = 'PRO';

-- Mise à jour du plan PREMIUM
UPDATE plans
SET features = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        features,
                                        '{maxEvents}',
                                        'null'::jsonb  -- Illimité
                                    ),
                                    '{maxParticipants}',
                                    '10000'::jsonb
                                ),
                                '{maxVehicles}',
                                'null'::jsonb  -- Illimité
                            ),
                            '{hasAdvancedReporting}',
                            'true'::jsonb
                        ),
                        '{hasNotifications}',
                        'true'::jsonb
                    ),
                    '{hasCRM}',
                    'true'::jsonb
                ),
                '{hasCustomLogo}',
                'true'::jsonb
            ),
            '{hasAPI}',
            'true'::jsonb
        ),
        '{hasIntegrations}',
        'true'::jsonb
    ),
    '{hasWhiteLabel}',
    'true'::jsonb
),
features = jsonb_set(
    features,
    '{hasDedicatedSupport}',
    'true'::jsonb
)
WHERE tier = 'PREMIUM';

-- Vérifier les mises à jour
SELECT 
    tier,
    name,
    features->'maxEvents' as max_events,
    features->'maxParticipants' as max_participants,
    features->'maxVehicles' as max_vehicles,
    features->'hasAdvancedReporting' as has_advanced_reporting,
    features->'hasNotifications' as has_notifications,
    features->'hasCRM' as has_crm,
    features->'hasCustomLogo' as has_custom_logo,
    features->'hasAPI' as has_api,
    features->'hasIntegrations' as has_integrations,
    features->'hasWhiteLabel' as has_white_label,
    features->'hasDedicatedSupport' as has_dedicated_support
FROM plans
ORDER BY 
    CASE tier
        WHEN 'DECOUVERTE' THEN 1
        WHEN 'ESSENTIEL' THEN 2
        WHEN 'PRO' THEN 3
        WHEN 'PREMIUM' THEN 4
    END;
