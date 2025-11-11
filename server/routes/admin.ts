import { Router, Request, Response } from 'express';
import { requireAdmin } from '../auth/middleware';
import { db } from '../db';
import { companies, companyPlanState, planHistory, plans, transactions, users, invoices } from '@shared/schema';
import { eq, desc, sql, and, count as drizzleCount } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Dashboard KPIs: total companies, by plan, MRR, pending quotes
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Total companies
    const totalCompaniesResult = await db
      .select({ count: drizzleCount() })
      .from(companies);
    const totalCompanies = totalCompaniesResult[0]?.count || 0;

    // Companies by plan
    const companiesByPlan = await db
      .select({
        planTier: plans.tier,
        count: drizzleCount()
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .groupBy(plans.tier);

    // Pending quote approvals (PRO/PREMIUM on temporary DECOUVERTE)
    const pendingQuotesResult = await db
      .select({ count: drizzleCount() })
      .from(companyPlanState)
      .where(eq(companyPlanState.quotePending, true));
    const pendingQuotes = pendingQuotesResult[0]?.count || 0;

    // Monthly Recurring Revenue (sum of active paid plans)
    // Note: Simplified - assumes monthly billing for ESSENTIEL plan
    const essentielPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.tier, 'ESSENTIEL'))
      .limit(1);
    
    const essentielPrice = Number(essentielPlan[0]?.monthlyPrice || 0);
    
    const essentielCountResult = await db
      .select({ count: drizzleCount() })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(plans.tier, 'ESSENTIEL'));
    
    const essentielCount = Number(essentielCountResult[0]?.count || 0);
    const mrr = essentielCount * essentielPrice;

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrationsResult = await db
      .select({ count: drizzleCount() })
      .from(companies)
      .where(sql`${companies.createdAt} >= ${sevenDaysAgo}`);
    const recentRegistrations = recentRegistrationsResult[0]?.count || 0;

    res.json({
      totalCompanies,
      companiesByPlan: companiesByPlan.map(p => ({
        tier: p.planTier,
        count: p.count
      })),
      pendingQuotes,
      mrr,
      recentRegistrations
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

/**
 * GET /api/admin/companies
 * List all companies with plan details, pagination support
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const allCompanies = await db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        siren: companies.siren,
        email: companies.email,
        phone: companies.phone,
        createdAt: companies.createdAt,
        planTier: plans.tier,
        planName: plans.name,
        quotePending: companyPlanState.quotePending,
        billingCycle: companyPlanState.billingCycle,
        currentPeriodEnd: companyPlanState.currentPeriodEnd
      })
      .from(companies)
      .leftJoin(companyPlanState, eq(companies.id, companyPlanState.companyId))
      .leftJoin(plans, eq(companyPlanState.planId, plans.id))
      .orderBy(desc(companies.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: drizzleCount() })
      .from(companies);
    const total = totalResult[0]?.count || 0;

    res.json({
      companies: allCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin companies list error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * POST /api/admin/approve-quote
 * Approve a PRO/PREMIUM quote and activate the plan
 */
const approveQuoteSchema = z.object({
  companyId: z.string().uuid(),
  planId: z.string().uuid()
});

router.post('/approve-quote', async (req: Request, res: Response) => {
  try {
    const { companyId, planId } = approveQuoteSchema.parse(req.body);

    // Verify company exists and has pending quote
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company.length) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const currentState = await db
      .select()
      .from(companyPlanState)
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!currentState.length || !currentState[0].quotePending) {
      return res.status(400).json({ error: 'No pending quote for this company' });
    }

    // Verify target plan exists and is PRO or PREMIUM
    const targetPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!targetPlan.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (targetPlan[0].tier !== 'PRO' && targetPlan[0].tier !== 'PREMIUM') {
      return res.status(400).json({ error: 'Can only approve PRO or PREMIUM quotes' });
    }

    // Update plan state: remove quotePending flag, update plan
    await db
      .update(companyPlanState)
      .set({
        planId,
        quotePending: false,
        updatedAt: new Date()
      })
      .where(eq(companyPlanState.companyId, companyId));

    // Log in plan history
    await db.insert(planHistory).values({
      companyId,
      oldPlanId: currentState[0].planId,
      newPlanId: planId,
      reason: `Quote approved by admin: ${(req as any).user.email}`,
      changedByUserId: (req as any).user.id
    });

    res.json({
      success: true,
      message: 'Quote approved successfully',
      companyId,
      newPlanTier: targetPlan[0].tier
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Approve quote error:', error);
    res.status(500).json({ error: 'Failed to approve quote' });
  }
});

/**
 * POST /api/admin/change-plan
 * Manually change a company's plan (upgrade/downgrade)
 */
const changePlanSchema = z.object({
  companyId: z.string().uuid(),
  planId: z.string().uuid(),
  notes: z.string().optional()
});

router.post('/change-plan', async (req: Request, res: Response) => {
  try {
    const { companyId, planId, notes } = changePlanSchema.parse(req.body);

    // Verify company and plan exist
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company.length) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const targetPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!targetPlan.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get current plan for history
    const currentState = await db
      .select()
      .from(companyPlanState)
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    // Update plan state
    await db
      .update(companyPlanState)
      .set({
        planId,
        quotePending: false, // Clear any pending quote
        updatedAt: new Date()
      })
      .where(eq(companyPlanState.companyId, companyId));

    // Log in plan history
    await db.insert(planHistory).values({
      companyId,
      oldPlanId: currentState[0]?.planId || null,
      newPlanId: planId,
      reason: notes || `Plan changed by admin: ${(req as any).user.email}`,
      changedByUserId: (req as any).user.id
    });

    res.json({
      success: true,
      message: 'Plan changed successfully',
      companyId,
      newPlanTier: targetPlan[0].tier
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Change plan error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

/**
 * GET /api/admin/transactions
 * List all transactions across all companies
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const allTransactions = await db
      .select({
        transactionId: transactions.id,
        companyId: transactions.companyId,
        companyName: companies.name,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        stripeSessionId: transactions.stripeSessionId,
        stripeInvoiceId: transactions.stripeInvoiceId,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(companies, eq(transactions.companyId, companies.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Total count
    const totalResult = await db
      .select({ count: drizzleCount() })
      .from(transactions);
    const total = totalResult[0]?.count || 0;

    res.json({
      transactions: allTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin transactions list error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/admin/recent-activity
 * Recent registrations, plan changes, transactions for dashboard alerts
 */
router.get('/recent-activity', async (req: Request, res: Response) => {
  try {
    // Recent registrations (last 10)
    const recentCompanies = await db
      .select({
        type: sql<string>`'registration'`,
        companyName: companies.name,
        email: companies.email,
        timestamp: companies.createdAt
      })
      .from(companies)
      .orderBy(desc(companies.createdAt))
      .limit(10);

    // Recent plan changes (last 10) - simplified
    const recentPlanChanges = await db
      .select({
        companyName: companies.name,
        reason: planHistory.reason,
        newPlanId: planHistory.newPlanId,
        oldPlanId: planHistory.oldPlanId,
        timestamp: planHistory.createdAt
      })
      .from(planHistory)
      .leftJoin(companies, eq(planHistory.companyId, companies.id))
      .orderBy(desc(planHistory.createdAt))
      .limit(10);

    res.json({
      recentRegistrations: recentCompanies,
      recentPlanChanges
    });
  } catch (error: any) {
    console.error('Admin recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;
