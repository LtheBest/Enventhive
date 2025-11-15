import { Router } from 'express';
import { db } from '../db';
import { plans, companyPlanState, planHistory, supportRequests, companies } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireCompany } from '../auth/middleware';
import { z } from 'zod';
import { createStripeCheckoutSession } from './stripe';
import { withTransaction } from '../utils/transaction';

const router = Router();

// GET /api/plans - Retrieve all active plans
router.get('/', async (req, res) => {
  try {
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.id);

    res.json(activePlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET /api/plans/current-features - Get current company's plan features (MUST be before /:id)
// Allow access for both authenticated users - will return 404 for non-company users gracefully
router.get('/current-features', requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    
    // If user is not associated with a company (e.g., admin), return appropriate response
    if (!companyId) {
      return res.status(404).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Get company's current plan with features
    const [planData] = await db
      .select({
        planId: plans.id,
        tier: plans.tier,
        name: plans.name,
        features: plans.features,
        quotePending: companyPlanState.quotePending,
        quoteApprovedAt: companyPlanState.quoteApprovedAt,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!planData) {
      return res.status(404).json({ error: 'Plan non trouvé pour cette entreprise' });
    }

    // Return plan features with status
    res.json({
      tier: planData.tier,
      name: planData.name,
      features: planData.features,
      quotePending: planData.quotePending || false,
      isActive: !planData.quotePending || !!planData.quoteApprovedAt,
    });
  } catch (error) {
    console.error('Error fetching current plan features:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/plans/:id - Retrieve a specific plan
router.get('/:id', async (req, res) => {
  try {
    const planId = req.params.id;
    
    if (!planId) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

/**
 * POST /api/plans/upgrade
 * Upgrade or change company plan
 * Handles different flows:
 * - DECOUVERTE (free): Instant activation
 * - ESSENTIEL (paid): Redirect to Stripe checkout
 * - PRO/PREMIUM (quote): Create support request
 */
const upgradePlanSchema = z.object({
  targetPlanId: z.string().uuid('Plan ID invalide'),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

router.post('/upgrade', requireAuth, requireCompany, async (req, res) => {
  try {
    const validatedData = upgradePlanSchema.parse(req.body);
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    // Get target plan
    const [targetPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, validatedData.targetPlanId))
      .limit(1);

    if (!targetPlan) {
      return res.status(404).json({ error: 'Plan cible non trouvé' });
    }

    // Get current plan
    const [currentPlanState] = await db
      .select({
        planId: companyPlanState.planId,
        tier: plans.tier,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!currentPlanState) {
      return res.status(404).json({ error: 'Plan actuel non trouvé' });
    }

    // Prevent downgrading to DECOUVERTE (use separate endpoint for that)
    if (targetPlan.tier === 'DECOUVERTE' && currentPlanState.tier !== 'DECOUVERTE') {
      return res.status(400).json({ 
        error: 'Le downgrade vers DECOUVERTE n\'est pas disponible. Contactez le support.' 
      });
    }

    // Get company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // Handle different plan types
    if (targetPlan.tier === 'DECOUVERTE') {
      // Free plan - instant activation (should rarely happen in upgrade flow)
      await withTransaction(async (tx) => {
        // Update plan state
        await tx
          .update(companyPlanState)
          .set({
            planId: targetPlan.id,
            quotePending: false,
            updatedAt: new Date(),
          })
          .where(eq(companyPlanState.companyId, companyId));

        // Log plan history
        await tx.insert(planHistory).values({
          companyId,
          oldPlanId: currentPlanState.planId,
          newPlanId: targetPlan.id,
          reason: 'Company initiated plan change to DECOUVERTE',
          changedByUserId: userId,
        });
      });

      return res.json({
        success: true,
        message: 'Plan changé avec succès',
        requiresPayment: false,
        requiresQuote: false,
        newPlan: {
          id: targetPlan.id,
          name: targetPlan.name,
          tier: targetPlan.tier,
        },
      });
    } else if (targetPlan.requiresQuote) {
      // PRO or PREMIUM - requires quote and admin approval
      // Create support request
      const [supportRequest] = await db.insert(supportRequests).values({
        companyId,
        userId,
        requestType: 'plan_upgrade',
        subject: `Demande d'upgrade vers ${targetPlan.name}`,
        status: 'open',
        priority: 'normal',
        requestedPlanId: targetPlan.id,
      }).returning();

      return res.json({
        success: true,
        message: 'Demande d\'upgrade créée. Un administrateur va vous contacter.',
        requiresPayment: false,
        requiresQuote: true,
        supportRequestId: supportRequest.id,
        requestedPlan: {
          id: targetPlan.id,
          name: targetPlan.name,
          tier: targetPlan.tier,
        },
      });
    } else {
      // ESSENTIEL - requires payment via Stripe
      // Create Stripe checkout session
      const stripeSession = await createStripeCheckoutSession({
        company: {
          id: company.id,
          email: company.email,
          name: company.name,
        },
        plan: {
          id: targetPlan.id,
          name: targetPlan.name,
          monthlyPrice: targetPlan.monthlyPrice,
          annualPrice: targetPlan.annualPrice,
        },
        billingCycle: validatedData.billingCycle,
        userId,
        isRegistration: false, // This is an upgrade, not initial registration
      });

      return res.json({
        success: true,
        message: 'Redirection vers le paiement',
        requiresPayment: true,
        requiresQuote: false,
        stripeCheckoutUrl: stripeSession.url,
        stripeSessionId: stripeSession.id,
        requestedPlan: {
          id: targetPlan.id,
          name: targetPlan.name,
          tier: targetPlan.tier,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    console.error('Plan upgrade error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de plan' });
  }
});

export default router;
