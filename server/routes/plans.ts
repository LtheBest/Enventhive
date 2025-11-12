import { Router } from 'express';
import { db } from '../db';
import { plans, companyPlanState } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireCompany } from '../auth/middleware';

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
router.get('/current-features', requireAuth, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId;

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

export default router;
