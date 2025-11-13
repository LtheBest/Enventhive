import { Router } from 'express';
import { db } from '../db';
import { events, participants, vehicles, companyPlanState, plans, companies } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth, requireCompany } from '../auth/middleware';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get company dashboard statistics
 */
router.get('/stats', requireAuth, requireCompany, async (req, res) => {
  try {
    const companyId = req.user!.companyId;

    // Get company information including name and SIREN
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        siren: companies.siren,
        email: companies.email,
        phone: companies.phone,
        city: companies.city,
        organizationType: companies.organizationType,
      })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // Get company events
    const companyEvents = await db
      .select()
      .from(events)
      .where(sql`${events.companyId} = ${companyId}`);

    // Get upcoming events
    const now = new Date();
    const upcomingEvents = companyEvents.filter(
      (event) => new Date(event.startDate) >= now
    );

    // Get total participants across all events
    const eventIds = companyEvents.map((e) => e.id);
    let totalParticipants = 0;
    if (eventIds.length > 0) {
      const allParticipants = await db
        .select()
        .from(participants)
        .where(
          eq(participants.eventId, eventIds[0])
        );
      totalParticipants = allParticipants.length;
      
      // Count participants for other events
      for (let i = 1; i < eventIds.length; i++) {
        const eventParticipants = await db
          .select()
          .from(participants)
          .where(eq(participants.eventId, eventIds[i]));
        totalParticipants += eventParticipants.length;
      }
    }

    // Get active vehicles
    let activeVehicles = 0;
    if (eventIds.length > 0) {
      const allVehicles = await db
        .select()
        .from(vehicles)
        .where(
          eq(vehicles.eventId, eventIds[0])
        );
      activeVehicles = allVehicles.length;
      
      for (let i = 1; i < eventIds.length; i++) {
        const eventVehicles = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.eventId, eventIds[i]));
        activeVehicles += eventVehicles.length;
      }
    }

    // Get company plan
    const [planState] = await db
      .select({
        tier: plans.tier,
        quotePending: companyPlanState.quotePending,
      })
      .from(companyPlanState)
      .innerJoin(plans, sql`${companyPlanState.planId} = ${plans.id}`)
      .where(sql`${companyPlanState.companyId} = ${companyId}`)
      .limit(1);

    // Determine status based on quotePending flag
    const planStatus = planState?.quotePending ? 'quote_pending' : 'active';

    res.json({
      // Company information
      company: {
        id: company.id,
        name: company.name,
        siren: company.siren,
        email: company.email,
        phone: company.phone,
        city: company.city,
        organizationType: company.organizationType,
      },
      // Stats
      totalEvents: companyEvents.length,
      upcomingEvents: upcomingEvents.length,
      totalParticipants,
      activeVehicles,
      plan: planState ? {
        tier: planState.tier,
        status: planStatus,
        quotePending: planState.quotePending,
        maxEvents: 5,
        maxParticipantsPerEvent: 50,
      } : {
        tier: 'DECOUVERTE',
        quotePending: false,
        maxEvents: 5,
        maxParticipantsPerEvent: 50,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;
