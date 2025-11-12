-- ==============================================
-- TEAMMOVE - Script de test des fonctionnalités Admin
-- ==============================================
-- Date: 2025-11-12
-- Description: Script SQL pour tester et vérifier toutes les fonctionnalités admin
-- ==============================================

-- 1. VÉRIFIER LES COMPTES ADMIN CRÉÉS
-- ===================================
SELECT 
    id,
    email,
    role,
    first_name,
    last_name,
    is_active,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at;

-- Résultat attendu: 2 comptes admin (admin1@teammove.fr et admin2@teammove.fr)


-- 2. VÉRIFIER LES PLANS DISPONIBLES
-- ===================================
SELECT 
    id,
    tier,
    name,
    monthly_price,
    annual_price,
    features,
    requires_quote,
    is_active
FROM plans
ORDER BY 
    CASE tier
        WHEN 'DECOUVERTE' THEN 1
        WHEN 'ESSENTIEL' THEN 2
        WHEN 'PRO' THEN 3
        WHEN 'PREMIUM' THEN 4
    END;

-- Résultat attendu: 4 plans (DECOUVERTE, ESSENTIEL, PRO, PREMIUM)


-- 3. STATISTIQUES GLOBALES DASHBOARD ADMIN
-- ========================================
-- 3.1 Nombre total d'entreprises
SELECT COUNT(*) as total_companies FROM companies;

-- 3.2 Entreprises par plan
SELECT 
    p.tier,
    p.name,
    COUNT(cps.company_id) as company_count
FROM plans p
LEFT JOIN company_plan_state cps ON p.id = cps.plan_id
GROUP BY p.tier, p.name
ORDER BY 
    CASE p.tier
        WHEN 'DECOUVERTE' THEN 1
        WHEN 'ESSENTIEL' THEN 2
        WHEN 'PRO' THEN 3
        WHEN 'PREMIUM' THEN 4
    END;

-- 3.3 Devis en attente de validation
SELECT 
    c.id,
    c.name,
    c.email,
    p.tier as requested_plan,
    cps.created_at as request_date
FROM companies c
JOIN company_plan_state cps ON c.id = cps.company_id
JOIN plans p ON cps.plan_id = p.id
WHERE cps.quote_pending = true
ORDER BY cps.created_at DESC;

-- 3.4 Inscriptions récentes (7 derniers jours)
SELECT 
    c.name,
    c.email,
    c.organization_type,
    c.city,
    c.created_at
FROM companies c
WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY c.created_at DESC;

-- 3.5 Entreprises actives vs inactives
SELECT 
    is_active,
    COUNT(*) as count
FROM companies
GROUP BY is_active;


-- 4. LISTE DÉTAILLÉE DES ENTREPRISES
-- ===================================
SELECT 
    c.id,
    c.name,
    c.siren,
    c.email,
    c.phone,
    c.city,
    c.organization_type,
    c.is_active,
    c.created_at,
    p.tier as plan_tier,
    p.name as plan_name,
    cps.quote_pending,
    cps.billing_cycle,
    cps.current_period_end
FROM companies c
LEFT JOIN company_plan_state cps ON c.id = cps.company_id
LEFT JOIN plans p ON cps.plan_id = p.id
ORDER BY c.created_at DESC
LIMIT 20;


-- 5. TRANSACTIONS ET REVENUS
-- ===========================
-- 5.1 Toutes les transactions
SELECT 
    t.id,
    c.name as company_name,
    t.amount,
    t.currency,
    t.status,
    t.billing_cycle,
    t.created_at,
    t.paid_at
FROM transactions t
LEFT JOIN companies c ON t.company_id = c.id
ORDER BY t.created_at DESC
LIMIT 20;

-- 5.2 Revenus par statut de transaction
SELECT 
    status,
    COUNT(*) as transaction_count,
    SUM(amount::numeric) as total_amount
FROM transactions
GROUP BY status;

-- 5.3 MRR (Monthly Recurring Revenue) - Revenus mensuels récurrents
SELECT 
    p.tier,
    p.monthly_price::numeric as plan_price,
    COUNT(cps.company_id) as active_subscriptions,
    (p.monthly_price::numeric * COUNT(cps.company_id)) as mrr_by_plan
FROM plans p
LEFT JOIN company_plan_state cps ON p.id = cps.plan_id
WHERE p.tier != 'DECOUVERTE'  -- Exclure le plan gratuit
GROUP BY p.tier, p.monthly_price
ORDER BY mrr_by_plan DESC;

-- 5.4 Total MRR
SELECT 
    SUM(p.monthly_price::numeric) as total_mrr
FROM company_plan_state cps
JOIN plans p ON cps.plan_id = p.id
WHERE p.tier != 'DECOUVERTE';


-- 6. HISTORIQUE DES CHANGEMENTS DE PLAN
-- ======================================
SELECT 
    c.name as company_name,
    p_old.tier as old_plan,
    p_new.tier as new_plan,
    ph.reason,
    u.email as changed_by,
    ph.created_at
FROM plan_history ph
LEFT JOIN companies c ON ph.company_id = c.id
LEFT JOIN plans p_old ON ph.old_plan_id = p_old.id
LEFT JOIN plans p_new ON ph.new_plan_id = p_new.id
LEFT JOIN users u ON ph.changed_by_user_id = u.id
ORDER BY ph.created_at DESC
LIMIT 10;


-- 7. ACTIVITÉ DES ENTREPRISES
-- ============================
-- 7.1 Événements par entreprise
SELECT 
    c.name as company_name,
    COUNT(e.id) as event_count,
    MIN(e.start_date) as first_event,
    MAX(e.start_date) as last_event
FROM companies c
LEFT JOIN events e ON c.id = e.company_id
GROUP BY c.id, c.name
ORDER BY event_count DESC
LIMIT 10;

-- 7.2 Participants par entreprise
SELECT 
    c.name as company_name,
    COUNT(DISTINCT p.id) as total_participants
FROM companies c
LEFT JOIN events e ON c.id = e.company_id
LEFT JOIN participants p ON e.id = p.event_id
GROUP BY c.id, c.name
ORDER BY total_participants DESC
LIMIT 10;


-- 8. MESSAGES ADMIN (Nouvelles tables)
-- =====================================
-- 8.1 Tous les messages envoyés
SELECT 
    am.id,
    am.subject,
    am.message_type,
    u.email as sent_by,
    am.created_at,
    COUNT(mr.id) as recipient_count
FROM admin_messages am
LEFT JOIN users u ON am.sent_by_user_id = u.id
LEFT JOIN message_recipients mr ON am.id = mr.message_id
GROUP BY am.id, am.subject, am.message_type, u.email, am.created_at
ORDER BY am.created_at DESC;

-- 8.2 Messages par destinataire
SELECT 
    c.name as company_name,
    am.subject,
    am.message_type,
    mr.status,
    mr.read_at,
    am.created_at
FROM message_recipients mr
JOIN admin_messages am ON mr.message_id = am.id
JOIN companies c ON mr.company_id = c.id
ORDER BY am.created_at DESC
LIMIT 20;


-- 9. FACTURES GÉNÉRÉES
-- =====================
SELECT 
    i.invoice_number,
    c.name as company_name,
    t.amount,
    t.currency,
    i.created_at,
    i.sent_at,
    i.pdf_url IS NOT NULL as has_pdf
FROM invoices i
JOIN transactions t ON i.transaction_id = t.id
JOIN companies c ON i.company_id = c.id
ORDER BY i.created_at DESC
LIMIT 20;


-- 10. CONTRÔLE D'INTÉGRITÉ DES DONNÉES
-- =====================================
-- 10.1 Entreprises sans plan assigné
SELECT 
    c.id,
    c.name,
    c.email
FROM companies c
LEFT JOIN company_plan_state cps ON c.id = cps.company_id
WHERE cps.id IS NULL;

-- 10.2 Utilisateurs sans entreprise (devrait être seulement les admins)
SELECT 
    u.id,
    u.email,
    u.role,
    u.company_id
FROM users u
WHERE u.company_id IS NULL;

-- 10.3 Événements orphelins (entreprise supprimée)
SELECT 
    e.id,
    e.title,
    e.company_id,
    e.created_at
FROM events e
LEFT JOIN companies c ON e.company_id = c.id
WHERE c.id IS NULL;


-- 11. STATISTIQUES AVANCÉES
-- ==========================
-- 11.1 Taux de conversion par plan
SELECT 
    p.tier,
    COUNT(DISTINCT c.id) as total_companies,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN c.id END) as paying_companies,
    ROUND(
        (COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN c.id END)::numeric / 
         NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
        2
    ) as conversion_rate
FROM companies c
JOIN company_plan_state cps ON c.id = cps.company_id
JOIN plans p ON cps.plan_id = p.id
LEFT JOIN transactions t ON c.id = t.company_id
GROUP BY p.tier;

-- 11.2 Croissance mensuelle des inscriptions
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_companies
FROM companies
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;


-- 12. REQUÊTES UTILES POUR L'ADMIN
-- =================================
-- 12.1 Trouver une entreprise par email
SELECT 
    c.*,
    p.tier as plan_tier,
    cps.quote_pending
FROM companies c
LEFT JOIN company_plan_state cps ON c.id = cps.company_id
LEFT JOIN plans p ON cps.plan_id = p.id
WHERE c.email ILIKE '%@test.com%'
ORDER BY c.created_at DESC;

-- 12.2 Entreprises nécessitant une attention (devis en attente)
SELECT 
    c.name,
    c.email,
    p.tier as requested_plan,
    cps.created_at as pending_since,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - cps.created_at)) as days_pending
FROM companies c
JOIN company_plan_state cps ON c.id = cps.company_id
JOIN plans p ON cps.plan_id = p.id
WHERE cps.quote_pending = true
ORDER BY days_pending DESC;

-- 12.3 Entreprises inactives depuis plus de 30 jours
SELECT 
    c.name,
    c.email,
    MAX(e.created_at) as last_event_created,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(e.created_at))) as days_inactive
FROM companies c
LEFT JOIN events e ON c.id = e.company_id
GROUP BY c.id, c.name, c.email
HAVING MAX(e.created_at) < CURRENT_TIMESTAMP - INTERVAL '30 days'
    OR MAX(e.created_at) IS NULL
ORDER BY days_inactive DESC NULLS FIRST;


-- ==============================================
-- FIN DU SCRIPT DE TEST
-- ==============================================

-- NOTES:
-- 1. Ce script peut être exécuté directement dans psql ou dans un client PostgreSQL
-- 2. Toutes les requêtes sont en lecture seule (SELECT uniquement)
-- 3. Les résultats montrent l'état actuel de la base de données
-- 4. Utilisez ces requêtes pour vérifier l'intégrité des données après les migrations
