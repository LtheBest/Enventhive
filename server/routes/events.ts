import { Router, Request, Response } from 'express';
import { db } from '../db';
import { events, eventParents } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const router = Router();

// Validation schemas
const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true, // QR code will be generated separately (task 4)
});

const createEventSchema = insertEventSchema.extend({
  // Override companyId validation - will be set from authenticated user
  companyId: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = createEventSchema.parse(req.body);

    // Override companyId with authenticated user's company
    const eventData = {
      ...validatedData,
      companyId: user.companyId,
      createdByUserId: user.userId,
    };

    // Create event
    const [event] = await db
      .insert(events)
      .values(eventData)
      .returning();

    res.status(201).json({ event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'événement' });
  }
});

/**
 * GET /api/events
 * List all events for the authenticated user's company
 * Query params:
 *   - status: filter by status (upcoming, ongoing, completed, cancelled)
 *   - city: filter by city
 *   - startDate: filter events starting after this date
 *   - endDate: filter events ending before this date
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    const { status, city, startDate, endDate } = req.query;

    // Build filter conditions
    const conditions = [eq(events.companyId, user.companyId)];

    if (status) {
      conditions.push(eq(events.status, status as any));
    }

    if (city) {
      conditions.push(eq(events.city, city as string));
    }

    // Validate and apply startDate filter
    if (startDate) {
      const startDateObj = new Date(startDate as string);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({ error: 'Date de début invalide' });
      }
      conditions.push(gte(events.startDate, startDateObj));
    }

    // Validate and apply endDate filter (filter events that END before this date)
    if (endDate) {
      const endDateObj = new Date(endDate as string);
      if (isNaN(endDateObj.getTime())) {
        return res.status(400).json({ error: 'Date de fin invalide' });
      }
      // Filter by event end date, not start date
      conditions.push(lte(events.endDate, endDateObj));
    }

    // Fetch events
    const companyEvents = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startDate));

    res.json({ events: companyEvents });
  } catch (error: any) {
    console.error('Error listing events:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des événements' });
  }
});

/**
 * GET /api/events/:id
 * Get a single event by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Fetch event
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, id),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    res.json({ event });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'événement' });
  }
});

/**
 * PATCH /api/events/:id
 * Update an event
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = updateEventSchema.parse(req.body);

    // Check if event exists and belongs to user's company
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, id),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Don't allow changing companyId or qrCode manually
    const { companyId, qrCode, ...updateData } = validatedData as any;

    // Update event
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    res.json({ event: updatedEvent });
  } catch (error: any) {
    console.error('Error updating event:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'événement' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Check if event exists and belongs to user's company
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, id),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Delete event (cascade will handle related data)
    await db
      .delete(events)
      .where(eq(events.id, id));

    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'événement' });
  }
});

export default router;
