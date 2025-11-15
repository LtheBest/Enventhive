import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { events, participants, vehicles, companyPlanState, plans } from '../../shared/schema';
import { eq, and, count, sql } from 'drizzle-orm';

/**
 * Middleware to check if company can create more events
 * For DECOUVERTE plan: 2 events per year (annual limit)
 * For other plans: total event limit or unlimited
 */
export async function checkEventLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Get company's plan features and tier
    const [planData] = await db
      .select({
        maxEvents: plans.features,
        tier: plans.tier,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!planData) {
      return res.status(500).json({ error: 'Plan non trouvé pour cette entreprise' });
    }

    const features = planData.maxEvents as any;
    const maxEvents = features.maxEvents;
    const planTier = planData.tier;

    // If unlimited (null), allow
    if (maxEvents === null) {
      return next();
    }

    // For DECOUVERTE plan, check annual limit (2 events per year)
    if (planTier === 'DECOUVERTE') {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const [eventCount] = await db
        .select({ count: count() })
        .from(events)
        .where(
          and(
            eq(events.companyId, companyId),
            gte(events.createdAt, startOfYear),
            lte(events.createdAt, endOfYear)
          )
        );

      const currentCount = eventCount?.count || 0;

      if (currentCount >= maxEvents) {
        return res.status(403).json({
          error: 'Limite d\'événements annuelle atteinte',
          message: `Votre plan Découverte permet un maximum de ${maxEvents} événements par an. Vous avez déjà créé ${currentCount} événement(s) en ${currentYear}. Passez à un plan supérieur pour créer plus d'événements.`,
          limit: maxEvents,
          current: currentCount,
          period: 'annual',
          year: currentYear,
        });
      }
    } else {
      // For other plans, check total event limit
      const [eventCount] = await db
        .select({ count: count() })
        .from(events)
        .where(eq(events.companyId, companyId));

      const currentCount = eventCount?.count || 0;

      if (currentCount >= maxEvents) {
        return res.status(403).json({
          error: 'Limite d\'événements atteinte',
          message: `Votre plan permet un maximum de ${maxEvents} événements au total. Passez à un plan supérieur pour en créer plus.`,
          limit: maxEvents,
          current: currentCount,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking event limit:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des limites' });
  }
}

/**
 * Middleware to check if event can add more participants
 * SECURITY: Verifies event ownership before checking limits
 */
export async function checkParticipantLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const eventId = req.params.eventId || req.body.eventId;
    
    if (!companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'ID d\'événement requis' });
    }

    // SECURITY: Verify event belongs to company before checking limits
    const [event] = await db
      .select({ companyId: events.companyId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    if (event.companyId !== companyId) {
      return res.status(403).json({ error: 'Accès non autorisé à cet événement' });
    }

    // Get company's plan features
    const [planData] = await db
      .select({
        maxParticipants: plans.features,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!planData) {
      return res.status(500).json({ error: 'Plan non trouvé pour cette entreprise' });
    }

    const features = planData.maxParticipants as any;
    const maxParticipants = features.maxParticipants;

    // If unlimited (null), allow
    if (maxParticipants === null) {
      return next();
    }

    // Count current participants for this event
    const [participantCount] = await db
      .select({ count: count() })
      .from(participants)
      .where(eq(participants.eventId, eventId));

    const currentCount = participantCount?.count || 0;

    if (currentCount >= maxParticipants) {
      return res.status(403).json({
        error: 'Limite de participants atteinte',
        message: `Votre plan permet un maximum de ${maxParticipants} participants par événement. Passez à un plan supérieur pour en ajouter plus.`,
        limit: maxParticipants,
        current: currentCount,
      });
    }

    next();
  } catch (error) {
    console.error('Error checking participant limit:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des limites' });
  }
}

/**
 * Middleware to check if event can add more vehicles
 * SECURITY: Verifies event ownership before checking limits
 */
export async function checkVehicleLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const eventId = req.params.eventId || req.body.eventId;
    
    if (!companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'ID d\'événement requis' });
    }

    // SECURITY: Verify event belongs to company before checking limits
    const [event] = await db
      .select({ companyId: events.companyId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    if (event.companyId !== companyId) {
      return res.status(403).json({ error: 'Accès non autorisé à cet événement' });
    }

    // Get company's plan features
    const [planData] = await db
      .select({
        maxVehicles: plans.features,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, companyId))
      .limit(1);

    if (!planData) {
      return res.status(500).json({ error: 'Plan non trouvé pour cette entreprise' });
    }

    const features = planData.maxVehicles as any;
    const maxVehicles = features.maxVehicles;

    // If unlimited (null), allow
    if (maxVehicles === null) {
      return next();
    }

    // Count current vehicles for this event
    const [vehicleCount] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.eventId, eventId));

    const currentCount = vehicleCount?.count || 0;

    if (currentCount >= maxVehicles) {
      return res.status(403).json({
        error: 'Limite de véhicules atteinte',
        message: `Votre plan permet un maximum de ${maxVehicles} véhicules par événement. Passez à un plan supérieur pour en ajouter plus.`,
        limit: maxVehicles,
        current: currentCount,
      });
    }

    next();
  } catch (error) {
    console.error('Error checking vehicle limit:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des limites' });
  }
}

/**
 * Middleware to check if company has access to a specific feature
 */
export function requireFeature(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
      }

      // Get company's plan features
      const [planData] = await db
        .select({
          features: plans.features,
        })
        .from(companyPlanState)
        .innerJoin(plans, eq(companyPlanState.planId, plans.id))
        .where(eq(companyPlanState.companyId, companyId))
        .limit(1);

      if (!planData) {
        return res.status(500).json({ error: 'Plan non trouvé pour cette entreprise' });
      }

      const features = planData.features as any;
      const hasFeature = features[featureName];

      if (!hasFeature) {
        return res.status(403).json({
          error: 'Fonctionnalité non disponible',
          message: `Cette fonctionnalité nécessite un plan supérieur.`,
          feature: featureName,
        });
      }

      next();
    } catch (error) {
      console.error(`Error checking feature ${featureName}:`, error);
      res.status(500).json({ error: 'Erreur lors de la vérification des fonctionnalités' });
    }
  };
}
