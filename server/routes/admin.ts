import { Router, Request, Response } from 'express';
import { requireAdmin } from '../auth/middleware';
import { db } from '../db';
import { companies, companyPlanState, planHistory, plans, transactions, users, invoices, adminMessages, messageRecipients, events, participants, temporaryPlanOverrides } from '@shared/schema';
import { eq, desc, sql, and, count as drizzleCount, inArray, lt } from 'drizzle-orm';
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
        city: companies.city,
        isActive: companies.isActive,
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

/**
 * POST /api/admin/toggle-company-status
 * Activate or deactivate a company account
 */
const toggleCompanyStatusSchema = z.object({
  companyId: z.string().uuid(),
  isActive: z.boolean()
});

router.post('/toggle-company-status', async (req: Request, res: Response) => {
  try {
    const { companyId, isActive } = toggleCompanyStatusSchema.parse(req.body);

    // Update company status
    await db
      .update(companies)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId));

    // Also update all users belonging to this company
    await db
      .update(users)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.companyId, companyId));

    res.json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      companyId,
      isActive
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Toggle company status error:', error);
    res.status(500).json({ error: 'Failed to toggle company status' });
  }
});

/**
 * POST /api/admin/bulk-change-plan
 * Change plan for multiple companies at once
 */
const bulkChangePlanSchema = z.object({
  companyIds: z.array(z.string().uuid()),
  planId: z.string().uuid(),
  notes: z.string().optional()
});

router.post('/bulk-change-plan', async (req: Request, res: Response) => {
  try {
    const { companyIds, planId, notes } = bulkChangePlanSchema.parse(req.body);

    // Verify plan exists
    const targetPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!targetPlan.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Update all companies
    for (const companyId of companyIds) {
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
          quotePending: false,
          updatedAt: new Date()
        })
        .where(eq(companyPlanState.companyId, companyId));

      // Log in plan history
      await db.insert(planHistory).values({
        companyId,
        oldPlanId: currentState[0]?.planId || null,
        newPlanId: planId,
        reason: notes || `Bulk plan change by admin: ${(req as any).user.email}`,
        changedByUserId: (req as any).user.id
      });
    }

    res.json({
      success: true,
      message: `Plan changed for ${companyIds.length} companies`,
      updatedCount: companyIds.length,
      newPlanTier: targetPlan[0].tier
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Bulk change plan error:', error);
    res.status(500).json({ error: 'Failed to bulk change plans' });
  }
});

/**
 * POST /api/admin/send-message
 * Send a message to one or multiple companies
 */
const sendMessageSchema = z.object({
  companyIds: z.array(z.string().uuid()).min(1),
  messageType: z.enum(['individual', 'group', 'broadcast']),
  subject: z.string().min(1),
  content: z.string().min(1)
});

router.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { companyIds, messageType, subject, content } = sendMessageSchema.parse(req.body);

    // Create message
    const [message] = await db.insert(adminMessages).values({
      sentByUserId: (req as any).user.id,
      messageType,
      subject,
      content
    }).returning();

    // Create recipients
    await db.insert(messageRecipients).values(
      companyIds.map(companyId => ({
        messageId: message.id,
        companyId,
        status: 'sent' as const
      }))
    );

    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: message.id,
      recipientCount: companyIds.length
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/admin/messages
 * List all sent messages
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const messages = await db
      .select({
        id: adminMessages.id,
        subject: adminMessages.subject,
        content: adminMessages.content,
        messageType: adminMessages.messageType,
        createdAt: adminMessages.createdAt,
        sentByEmail: users.email,
        recipientCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${messageRecipients} 
          WHERE ${messageRecipients.messageId} = ${adminMessages.id}
        )`
      })
      .from(adminMessages)
      .leftJoin(users, eq(adminMessages.sentByUserId, users.id))
      .orderBy(desc(adminMessages.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: drizzleCount() })
      .from(adminMessages);
    const total = totalResult[0]?.count || 0;

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/admin/export/companies
 * Export companies data as CSV
 */
router.get('/export/companies', async (req: Request, res: Response) => {
  try {
    const allCompanies = await db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        siren: companies.siren,
        email: companies.email,
        phone: companies.phone,
        city: companies.city,
        organizationType: companies.organizationType,
        isActive: companies.isActive,
        createdAt: companies.createdAt,
        planTier: plans.tier,
        planName: plans.name
      })
      .from(companies)
      .leftJoin(companyPlanState, eq(companies.id, companyPlanState.companyId))
      .leftJoin(plans, eq(companyPlanState.planId, plans.id))
      .orderBy(desc(companies.createdAt));

    // Generate CSV
    const headers = ['ID', 'Nom', 'SIREN', 'Email', 'Téléphone', 'Ville', 'Type', 'Actif', 'Plan', 'Date inscription'];
    const rows = allCompanies.map(c => [
      c.companyId,
      c.companyName,
      c.siren,
      c.email,
      c.phone || '',
      c.city,
      c.organizationType,
      c.isActive ? 'Oui' : 'Non',
      c.planTier || '',
      c.createdAt?.toISOString().split('T')[0] || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="companies_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
  } catch (error: any) {
    console.error('Export companies error:', error);
    res.status(500).json({ error: 'Failed to export companies' });
  }
});

/**
 * GET /api/admin/export/transactions
 * Export transactions data as CSV
 */
router.get('/export/transactions', async (req: Request, res: Response) => {
  try {
    const allTransactions = await db
      .select({
        transactionId: transactions.id,
        companyName: companies.name,
        companyEmail: companies.email,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        billingCycle: transactions.billingCycle,
        createdAt: transactions.createdAt,
        paidAt: transactions.paidAt
      })
      .from(transactions)
      .leftJoin(companies, eq(transactions.companyId, companies.id))
      .orderBy(desc(transactions.createdAt));

    // Generate CSV
    const headers = ['ID Transaction', 'Entreprise', 'Email', 'Montant', 'Devise', 'Statut', 'Cycle', 'Date création', 'Date paiement'];
    const rows = allTransactions.map(t => [
      t.transactionId,
      t.companyName || '',
      t.companyEmail || '',
      t.amount,
      t.currency,
      t.status,
      t.billingCycle || '',
      t.createdAt?.toISOString().split('T')[0] || '',
      t.paidAt?.toISOString().split('T')[0] || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (error: any) {
    console.error('Export transactions error:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

/**
 * GET /api/admin/company/:id
 * Get detailed information about a specific company
 */
router.get('/company/:id', async (req: Request, res: Response) => {
  try {
    const companyId = req.params.id;

    // Get company details
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        siren: companies.siren,
        organizationType: companies.organizationType,
        email: companies.email,
        phone: companies.phone,
        address: companies.address,
        city: companies.city,
        postalCode: companies.postalCode,
        isActive: companies.isActive,
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
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get event statistics
    const eventStatsResult = await db
      .select({ count: drizzleCount() })
      .from(events)
      .where(eq(events.companyId, companyId));
    const eventCount = eventStatsResult[0]?.count || 0;

    // Get participant statistics
    const participantStatsResult = await db
      .select({ count: drizzleCount() })
      .from(participants)
      .innerJoin(events, eq(participants.eventId, events.id))
      .where(eq(events.companyId, companyId));
    const participantCount = participantStatsResult[0]?.count || 0;

    // Get transaction history
    const transactionHistory = await db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // Get plan history
    const planChanges = await db
      .select({
        id: planHistory.id,
        oldPlanTier: sql<string>`(SELECT tier FROM ${plans} WHERE id = ${planHistory.oldPlanId})`,
        newPlanTier: sql<string>`(SELECT tier FROM ${plans} WHERE id = ${planHistory.newPlanId})`,
        reason: planHistory.reason,
        createdAt: planHistory.createdAt
      })
      .from(planHistory)
      .where(eq(planHistory.companyId, companyId))
      .orderBy(desc(planHistory.createdAt))
      .limit(10);

    res.json({
      company,
      stats: {
        eventCount,
        participantCount,
        transactionCount: transactionHistory.length
      },
      transactionHistory,
      planHistory: planChanges
    });
  } catch (error: any) {
    console.error('Get company details error:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

/**
 * DELETE /api/admin/company/:id
 * Delete a company account (with all related data via cascade)
 */
router.delete('/company/:id', async (req: Request, res: Response) => {
  try {
    const companyId = req.params.id;

    // Verify company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete company (cascade will handle related data)
    await db
      .delete(companies)
      .where(eq(companies.id, companyId));

    res.json({
      success: true,
      message: 'Company deleted successfully',
      companyId,
      companyName: company.name
    });
  } catch (error: any) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

/**
 * GET /api/admin/profile
 * Get current admin's profile information
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [admin] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ admin });
  } catch (error: any) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

/**
 * PUT /api/admin/profile
 * Update current admin's profile information
 */
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional()
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { firstName, lastName, email, currentPassword, newPassword } = updateProfileSchema.parse(req.body);

    // Get current admin data
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) {
      // Check if email is already taken
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${userId}`))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updateData.email = email;
    }

    // Handle password change
    if (newPassword && currentPassword) {
      const bcrypt = await import('bcrypt');
      const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    } else if (newPassword || currentPassword) {
      return res.status(400).json({ error: 'Both current and new password are required to change password' });
    }

    // Update admin profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Update admin profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/admin/temporary-plan-override
 * Force a temporary plan change for a company (1 week to 1 month)
 * After the period, the plan will automatically revert to the original
 */
const temporaryPlanOverrideSchema = z.object({
  companyId: z.string().uuid(),
  temporaryPlanId: z.string().uuid(),
  durationDays: z.number().int().min(7).max(30),
  reason: z.string().optional()
});

router.post('/temporary-plan-override', async (req: Request, res: Response) => {
  try {
    const { companyId, temporaryPlanId, durationDays, reason } = temporaryPlanOverrideSchema.parse(req.body);
    const adminId = (req as any).user.id;

    // Verify company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Verify temporary plan exists
    const [tempPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, temporaryPlanId))
      .limit(1);

    if (!tempPlan) {
      return res.status(404).json({ error: 'Temporary plan not found' });
    }

    // Get current plan
    const [currentState] = await db
      .select()
      .from(companyPlanState)
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!currentState) {
      return res.status(404).json({ error: 'Company plan state not found' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Check if there's already an active override
    const [activeOverride] = await db
      .select()
      .from(temporaryPlanOverrides)
      .where(
        and(
          eq(temporaryPlanOverrides.companyId, companyId),
          eq(temporaryPlanOverrides.isActive, true)
        )
      )
      .limit(1);

    if (activeOverride) {
      return res.status(400).json({ 
        error: 'An active temporary plan override already exists for this company. Please deactivate it first.' 
      });
    }

    // Create temporary override record
    const [override] = await db
      .insert(temporaryPlanOverrides)
      .values({
        companyId,
        originalPlanId: currentState.planId,
        temporaryPlanId,
        startDate: new Date(),
        endDate,
        reason: reason || 'Admin-forced temporary plan change',
        createdByAdminId: adminId,
        isActive: true,
      })
      .returning();

    // Update company plan to temporary plan
    await db
      .update(companyPlanState)
      .set({
        planId: temporaryPlanId,
        updatedAt: new Date(),
      })
      .where(eq(companyPlanState.companyId, companyId));

    // Log in plan history
    await db.insert(planHistory).values({
      companyId,
      oldPlanId: currentState.planId,
      newPlanId: temporaryPlanId,
      reason: `Temporary override (${durationDays} days): ${reason || 'Admin decision'}`,
      changedByUserId: adminId,
    });

    res.json({
      success: true,
      message: `Temporary plan override created for ${durationDays} days`,
      override: {
        id: override.id,
        companyId: override.companyId,
        originalPlanTier: currentState.planId,
        temporaryPlanTier: tempPlan.tier,
        startDate: override.startDate,
        endDate: override.endDate,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Temporary plan override error:', error);
    res.status(500).json({ error: 'Failed to create temporary plan override' });
  }
});

/**
 * GET /api/admin/temporary-plan-overrides
 * List all temporary plan overrides (active and expired)
 */
router.get('/temporary-plan-overrides', async (req: Request, res: Response) => {
  try {
    const overrides = await db
      .select({
        id: temporaryPlanOverrides.id,
        companyId: temporaryPlanOverrides.companyId,
        companyName: companies.name,
        originalPlanTier: sql<string>`(SELECT tier FROM ${plans} WHERE id = ${temporaryPlanOverrides.originalPlanId})`,
        temporaryPlanTier: sql<string>`(SELECT tier FROM ${plans} WHERE id = ${temporaryPlanOverrides.temporaryPlanId})`,
        startDate: temporaryPlanOverrides.startDate,
        endDate: temporaryPlanOverrides.endDate,
        reason: temporaryPlanOverrides.reason,
        isActive: temporaryPlanOverrides.isActive,
        createdAt: temporaryPlanOverrides.createdAt,
      })
      .from(temporaryPlanOverrides)
      .innerJoin(companies, eq(temporaryPlanOverrides.companyId, companies.id))
      .orderBy(desc(temporaryPlanOverrides.createdAt));

    res.json({
      success: true,
      overrides,
    });
  } catch (error: any) {
    console.error('List temporary overrides error:', error);
    res.status(500).json({ error: 'Failed to fetch temporary plan overrides' });
  }
});

/**
 * POST /api/admin/deactivate-plan-override/:id
 * Manually deactivate a temporary plan override and revert to original plan
 */
router.post('/deactivate-plan-override/:id', async (req: Request, res: Response) => {
  try {
    const overrideId = req.params.id;
    const adminId = (req as any).user.id;

    // Get override details
    const [override] = await db
      .select()
      .from(temporaryPlanOverrides)
      .where(eq(temporaryPlanOverrides.id, overrideId))
      .limit(1);

    if (!override) {
      return res.status(404).json({ error: 'Temporary plan override not found' });
    }

    if (!override.isActive) {
      return res.status(400).json({ error: 'This override is already inactive' });
    }

    // Revert company to original plan
    await db
      .update(companyPlanState)
      .set({
        planId: override.originalPlanId,
        updatedAt: new Date(),
      })
      .where(eq(companyPlanState.companyId, override.companyId));

    // Deactivate override
    await db
      .update(temporaryPlanOverrides)
      .set({
        isActive: false,
      })
      .where(eq(temporaryPlanOverrides.id, overrideId));

    // Log in plan history
    await db.insert(planHistory).values({
      companyId: override.companyId,
      oldPlanId: override.temporaryPlanId,
      newPlanId: override.originalPlanId,
      reason: 'Temporary override ended (manually deactivated)',
      changedByUserId: adminId,
    });

    res.json({
      success: true,
      message: 'Temporary plan override deactivated, company reverted to original plan',
    });
  } catch (error: any) {
    console.error('Deactivate override error:', error);
    res.status(500).json({ error: 'Failed to deactivate temporary plan override' });
  }
});

/**
 * Cron job endpoint to check and revert expired temporary overrides
 * Should be called periodically (e.g., daily via cron or scheduler)
 */
router.post('/check-expired-overrides', async (req: Request, res: Response) => {
  try {
    // Find all active overrides that have passed their end date
    const expiredOverrides = await db
      .select()
      .from(temporaryPlanOverrides)
      .where(
        and(
          eq(temporaryPlanOverrides.isActive, true),
          lt(temporaryPlanOverrides.endDate, new Date())
        )
      );

    let revertedCount = 0;
    
    for (const override of expiredOverrides) {
      // Revert company to original plan
      await db
        .update(companyPlanState)
        .set({
          planId: override.originalPlanId,
          updatedAt: new Date(),
        })
        .where(eq(companyPlanState.companyId, override.companyId));

      // Deactivate override
      await db
        .update(temporaryPlanOverrides)
        .set({
          isActive: false,
        })
        .where(eq(temporaryPlanOverrides.id, override.id));

      // Log in plan history
      await db.insert(planHistory).values({
        companyId: override.companyId,
        oldPlanId: override.temporaryPlanId,
        newPlanId: override.originalPlanId,
        reason: 'Temporary override period ended (automatic revert)',
        changedByUserId: override.createdByAdminId,
      });

      revertedCount++;
    }

    res.json({
      success: true,
      message: `Checked and reverted ${revertedCount} expired temporary plan overrides`,
      revertedCount,
    });
  } catch (error: any) {
    console.error('Check expired overrides error:', error);
    res.status(500).json({ error: 'Failed to check expired overrides' });
  }
});

export default router;
