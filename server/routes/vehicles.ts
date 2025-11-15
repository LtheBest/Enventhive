import { Router, Request, Response } from 'express';
import { db } from '../db';
import { vehicles, participants, events } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { checkVehicleLimit } from '../middleware/planLimits';
import { z } from 'zod';

const router = Router();

// Validation schema
const createVehicleSchema = z.object({
  eventId: z.string().uuid(),
  driverParticipantId: z.string().uuid(),
  totalSeats: z.number().int().min(1).max(50),
  departureLocation: z.string().min(1),
  departureCity: z.string().min(1),
  destinationLocation: z.string().optional(),
  notes: z.string().optional(),
});

const updateVehicleSchema = createVehicleSchema.partial().omit({ eventId: true });

/**
 * POST /api/vehicles
 * Create a vehicle for an event
 */
router.post('/', requireAuth, checkVehicleLimit, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = createVehicleSchema.parse(req.body);

    // Check if event exists and belongs to user's company
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, validatedData.eventId),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Check if driver participant exists and is actually a driver
    const [driver] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.id, validatedData.driverParticipantId),
          eq(participants.eventId, validatedData.eventId),
          eq(participants.role, 'driver')
        )
      )
      .limit(1);

    if (!driver) {
      return res.status(400).json({ 
        error: 'Participant conducteur introuvable ou invalide',
        message: 'Le participant doit exister et avoir le rôle de conducteur'
      });
    }

    // Check if driver already has a vehicle for this event
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.eventId, validatedData.eventId),
          eq(vehicles.driverParticipantId, validatedData.driverParticipantId)
        )
      )
      .limit(1);

    if (existingVehicle.length > 0) {
      return res.status(409).json({ 
        error: 'Ce conducteur a déjà un véhicule enregistré pour cet événement' 
      });
    }

    // Create vehicle
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        eventId: validatedData.eventId,
        driverParticipantId: validatedData.driverParticipantId,
        totalSeats: validatedData.totalSeats,
        availableSeats: validatedData.totalSeats, // Initially all seats available
        departureLocation: validatedData.departureLocation,
        departureCity: validatedData.departureCity,
        destinationLocation: validatedData.destinationLocation || null,
        notes: validatedData.notes || null,
      })
      .returning();

    res.status(201).json({ vehicle });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la création du véhicule' });
  }
});

/**
 * GET /api/vehicles/event/:eventId
 * List all vehicles for an event
 */
router.get('/event/:eventId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Check if event belongs to user's company
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Get all vehicles for this event with driver information
    const eventVehicles = await db
      .select({
        vehicle: vehicles,
        driver: participants,
      })
      .from(vehicles)
      .innerJoin(participants, eq(vehicles.driverParticipantId, participants.id))
      .where(eq(vehicles.eventId, eventId));

    res.json({ 
      vehicles: eventVehicles.map(v => ({
        ...v.vehicle,
        driver: {
          id: v.driver.id,
          firstName: v.driver.firstName,
          lastName: v.driver.lastName,
          email: v.driver.email,
          phone: v.driver.phone,
          city: v.driver.city,
        },
      }))
    });
  } catch (error: any) {
    console.error('Error listing vehicles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/vehicles/:id
 * Update a vehicle
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = updateVehicleSchema.parse(req.body);

    // Get vehicle
    const [existingVehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    // Check if event belongs to user's company
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, existingVehicle.eventId),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Update vehicle
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();

    res.json({ vehicle: updatedVehicle });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Delete a vehicle
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Get vehicle
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    // Check if event belongs to user's company
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, vehicle.eventId),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Delete vehicle
    await db.delete(vehicles).where(eq(vehicles.id, id));

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
