import { Router, Request, Response } from 'express';
import { db } from '../db';
import { companyVehicles, eventVehicles, events } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { checkVehicleLimit } from '../middleware/planLimits';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCompanyVehicleSchema = z.object({
  name: z.string().min(1, 'Le nom du véhicule est requis'),
  vehicleType: z.string().min(1, 'Le type de véhicule est requis'),
  licensePlate: z.string().optional(),
  totalSeats: z.number().int().min(1, 'Le nombre de places doit être au moins 1'),
});

const updateCompanyVehicleSchema = createCompanyVehicleSchema.partial();

const addVehicleToEventSchema = z.object({
  companyVehicleId: z.string().uuid('ID de véhicule invalide'),
  assignedDriverId: z.string().uuid().optional(),
});

/**
 * GET /api/company-vehicles
 * List all vehicles for the authenticated user's company
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    const vehicles = await db
      .select()
      .from(companyVehicles)
      .where(eq(companyVehicles.companyId, user.companyId))
      .orderBy(companyVehicles.createdAt);

    res.json({ vehicles });
  } catch (error: any) {
    console.error('Error listing company vehicles:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des véhicules' });
  }
});

/**
 * POST /api/company-vehicles
 * Create a new company vehicle
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = createCompanyVehicleSchema.parse(req.body);

    // Create vehicle
    const [vehicle] = await db
      .insert(companyVehicles)
      .values({
        ...validatedData,
        companyId: user.companyId,
      })
      .returning();

    res.status(201).json({ vehicle });
  } catch (error: any) {
    console.error('Error creating company vehicle:', error);
    
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
 * PATCH /api/company-vehicles/:id
 * Update a company vehicle
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = updateCompanyVehicleSchema.parse(req.body);

    // Check if vehicle exists and belongs to user's company
    const [existingVehicle] = await db
      .select()
      .from(companyVehicles)
      .where(
        and(
          eq(companyVehicles.id, id),
          eq(companyVehicles.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    // Update vehicle
    const [updatedVehicle] = await db
      .update(companyVehicles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(companyVehicles.id, id))
      .returning();

    res.json({ vehicle: updatedVehicle });
  } catch (error: any) {
    console.error('Error updating company vehicle:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du véhicule' });
  }
});

/**
 * DELETE /api/company-vehicles/:id
 * Delete a company vehicle
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Check if vehicle exists and belongs to user's company
    const [existingVehicle] = await db
      .select()
      .from(companyVehicles)
      .where(
        and(
          eq(companyVehicles.id, id),
          eq(companyVehicles.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    // Delete vehicle (cascade will handle related data)
    await db
      .delete(companyVehicles)
      .where(eq(companyVehicles.id, id));

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting company vehicle:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du véhicule' });
  }
});

/**
 * POST /api/company-vehicles/add-to-event/:eventId
 * Add a company vehicle to an event
 */
router.post('/add-to-event/:eventId', requireAuth, checkVehicleLimit, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = addVehicleToEventSchema.parse(req.body);

    // Check if event exists and belongs to user's company
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

    // Check if vehicle exists and belongs to user's company
    const [vehicle] = await db
      .select()
      .from(companyVehicles)
      .where(
        and(
          eq(companyVehicles.id, validatedData.companyVehicleId),
          eq(companyVehicles.companyId, user.companyId),
          eq(companyVehicles.isActive, true)
        )
      )
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable ou inactif' });
    }

    // Add vehicle to event
    const [eventVehicle] = await db
      .insert(eventVehicles)
      .values({
        eventId,
        companyVehicleId: validatedData.companyVehicleId,
        assignedDriverId: validatedData.assignedDriverId,
      })
      .returning();

    res.status(201).json({ eventVehicle });
  } catch (error: any) {
    console.error('Error adding vehicle to event:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du véhicule à l\'événement' });
  }
});

/**
 * GET /api/company-vehicles/event/:eventId
 * List all vehicles for a specific event
 */
router.get('/event/:eventId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Check if event exists and belongs to user's company
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

    // Get all vehicles for this event with details
    const eventVehiclesList = await db
      .select({
        eventVehicle: eventVehicles,
        companyVehicle: companyVehicles,
      })
      .from(eventVehicles)
      .innerJoin(companyVehicles, eq(eventVehicles.companyVehicleId, companyVehicles.id))
      .where(eq(eventVehicles.eventId, eventId));

    res.json({ eventVehicles: eventVehiclesList });
  } catch (error: any) {
    console.error('Error listing event vehicles:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des véhicules' });
  }
});

export default router;
