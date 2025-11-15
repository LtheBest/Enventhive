import { Router, Request, Response } from 'express';
import { db } from '../db';
import { events, eventParents, companies, participants, vehicles, companyPlanState, plans, companyVehicles, eventVehicles } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { checkEventLimit } from '../middleware/planLimits';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { generateEventQRCode } from '../services/qrcode';
import { sendEventCreatedEmail, sendParticipantInvitation } from '../services/email';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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
  // Allow optional participant emails for sending invitations
  participantEmails: z.array(z.string().email()).optional(),
  // Legacy: Allow optional participants array for backward compatibility
  participants: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    city: z.string().min(1),
    role: z.enum(['driver', 'passenger']).default('passenger'),
  })).optional(),
  // Allow optional vehicles array
  vehicles: z.array(z.object({
    driverEmail: z.string().email(),
    totalSeats: z.number().int().min(1),
    departureLocation: z.string().min(1),
    departureCity: z.string().min(1),
    departureTime: z.string().or(z.date()).optional(), // Optional at creation, defaults to event start
    destinationLocation: z.string().optional(),
    isPaidRide: z.boolean().optional().default(false),
    pricePerKm: z.number().optional(),
    estimatedDistance: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
  // Allow optional company vehicle IDs array
  companyVehicleIds: z.array(z.string().uuid()).optional(),
});

const updateEventSchema = createEventSchema.partial();

/**
 * POST /api/events
 * Create a new event (with plan limit check)
 * Supports initial participants and vehicles
 */
router.post('/', requireAuth, checkEventLimit, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    console.log('Creating event with body:', JSON.stringify(req.body, null, 2));

    // Validate request body
    const validatedData = createEventSchema.parse(req.body);

    // Extract participants, participantEmails, vehicles, and company vehicle IDs
    const { participants: initialParticipants, participantEmails, vehicles: initialVehicles, companyVehicleIds: initialCompanyVehicleIds, ...eventFields } = validatedData as any;
    
    // Convert participantEmails to participants format if provided
    let participantsToCreate = initialParticipants || [];
    if (participantEmails && Array.isArray(participantEmails) && participantEmails.length > 0) {
      // For email-only invitations, create minimal participant records
      // Full details will be collected when they register via the public link
      participantsToCreate = participantEmails.map((email: string) => ({
        email: email.toLowerCase(),
        firstName: 'Invité', // Placeholder - will be updated when they register
        lastName: '', // Placeholder
        city: '', // Will be collected during registration
        role: 'passenger', // Default role
      }));
    }

    // Get company's plan to determine maxParticipants limit
    const [planData] = await db
      .select({
        maxParticipants: plans.features,
      })
      .from(companyPlanState)
      .innerJoin(plans, eq(companyPlanState.planId, plans.id))
      .where(eq(companyPlanState.companyId, user.companyId))
      .limit(1);

    if (!planData) {
      return res.status(500).json({ error: 'Plan non trouvé pour cette entreprise' });
    }

    const features = planData.maxParticipants as any;
    const maxParticipants = features.maxParticipants; // Can be null (unlimited) or a number

    // Generate a unique public link slug
    const publicLinkSlug = crypto.randomBytes(8).toString('hex');
    const publicLink = `${BASE_URL}/events/${publicLinkSlug}/public`;

    // Override companyId with authenticated user's company, add publicLink and maxParticipants from plan
    const eventData = {
      ...eventFields,
      companyId: user.companyId,
      createdByUserId: user.userId,
      publicLink,
      maxParticipants, // Set from plan limits
    };

    // Create event
    const [event] = await db
      .insert(events)
      .values(eventData)
      .returning();

    // Generate QR code for the event
    let updatedEvent = event;
    try {
      const qrCode = await generateEventQRCode(event.id);
      
      // Update event with QR code
      [updatedEvent] = await db
        .update(events)
        .set({ qrCode })
        .where(eq(events.id, event.id))
        .returning();
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
    }

    // Get company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId!))
      .limit(1);

    // Create initial participants if provided
    const createdParticipants = [];
    if (participantsToCreate && Array.isArray(participantsToCreate) && participantsToCreate.length > 0) {
      for (const participantData of participantsToCreate) {
        try {
          const [participant] = await db
            .insert(participants)
            .values({
              eventId: event.id,
              email: participantData.email.toLowerCase(),
              firstName: participantData.firstName,
              lastName: participantData.lastName,
              phone: participantData.phone || null,
              city: participantData.city,
              role: participantData.role || 'passenger',
              status: 'pending',
            })
            .returning();

          createdParticipants.push(participant);

          // Generate invitation token and send email
          if (company) {
            const invitationToken = jwt.sign(
              {
                participantId: participant.id,
                eventId: event.id,
                email: participant.email,
                type: 'participant_invitation',
              },
              JWT_SECRET,
              { expiresIn: '30d' }
            );

            // Send invitation email (non-blocking)
            sendParticipantInvitation({
              company,
              event: updatedEvent,
              participant,
              invitationToken,
            }).catch(err => console.error('Participant invitation email error:', err));
          }
        } catch (partError) {
          console.error('Error creating participant:', partError);
        }
      }
    }

    // Create initial vehicles if provided
    const createdVehicles = [];
    if (initialVehicles && Array.isArray(initialVehicles) && initialVehicles.length > 0) {
      // First, we need to match vehicles with driver participants
      for (const vehicleData of initialVehicles) {
        try {
          // Find the driver participant by email
          const driver = createdParticipants.find(
            p => p.email.toLowerCase() === vehicleData.driverEmail.toLowerCase() && p.role === 'driver'
          );

          if (driver) {
            // Use provided departure time or default to event start time
            const departureTime = vehicleData.departureTime 
              ? new Date(vehicleData.departureTime)
              : new Date(event.startDate);
            
            const [vehicle] = await db
              .insert(vehicles)
              .values({
                eventId: event.id,
                driverParticipantId: driver.id,
                totalSeats: vehicleData.totalSeats,
                availableSeats: vehicleData.totalSeats, // Initially all seats are available
                departureLocation: vehicleData.departureLocation,
                departureCity: vehicleData.departureCity,
                departureTime,
                destinationLocation: vehicleData.destinationLocation || null,
                isPaidRide: vehicleData.isPaidRide || false,
                pricePerKm: vehicleData.pricePerKm ? String(vehicleData.pricePerKm) : null,
                estimatedDistance: vehicleData.estimatedDistance ? String(vehicleData.estimatedDistance) : null,
                notes: vehicleData.notes || null,
              })
              .returning();

            createdVehicles.push(vehicle);
          }
        } catch (vehError) {
          console.error('Error creating vehicle:', vehError);
        }
      }
    }

    // Link company vehicles to event if provided
    const linkedCompanyVehicles = [];
    if (initialCompanyVehicleIds && Array.isArray(initialCompanyVehicleIds) && initialCompanyVehicleIds.length > 0) {
      for (const vehicleId of initialCompanyVehicleIds) {
        try {
          // Verify vehicle belongs to company
          const [companyVehicle] = await db
            .select()
            .from(companyVehicles)
            .where(
              and(
                eq(companyVehicles.id, vehicleId),
                eq(companyVehicles.companyId, user.companyId!),
                eq(companyVehicles.isActive, true)
              )
            )
            .limit(1);

          if (companyVehicle) {
            const [eventVehicle] = await db
              .insert(eventVehicles)
              .values({
                eventId: event.id,
                companyVehicleId: vehicleId,
                assignedDriverId: null,
              })
              .returning();

            linkedCompanyVehicles.push(eventVehicle);
          }
        } catch (linkError) {
          console.error('Error linking company vehicle to event:', linkError);
        }
      }
    }
      
    // Send confirmation email (non-blocking)
    if (company) {
      sendEventCreatedEmail({
        company,
        event: updatedEvent,
        creatorEmail: user.email,
      }).catch(err => console.error('Event created email error:', err));
    }
      
    res.status(201).json({ 
      event: updatedEvent,
      participants: createdParticipants,
      vehicles: createdVehicles,
      companyVehicles: linkedCompanyVehicles,
      message: `Événement créé avec succès. ${createdParticipants.length} participant(s) invité(s)${linkedCompanyVehicles.length > 0 ? `, ${linkedCompanyVehicles.length} véhicule(s) ajouté(s)` : ''}.`,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error.name === 'ZodError') {
      console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
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

/**
 * GET /api/events/public/:slug
 * Get event details by public link slug (public endpoint - no auth required)
 */
router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const publicLink = `${BASE_URL}/events/${slug}/public`;

    // Fetch event by public link
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.publicLink, publicLink))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Get company info (name only for public display)
    const [company] = await db
      .select({
        name: companies.name,
        city: companies.city,
      })
      .from(companies)
      .where(eq(companies.id, event.companyId))
      .limit(1);

    // Get participants count
    const eventParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.eventId, event.id));

    const stats = {
      total: eventParticipants.length,
      confirmed: eventParticipants.filter(p => p.status === 'confirmed').length,
      drivers: eventParticipants.filter(p => p.role === 'driver' && p.status === 'confirmed').length,
    };

    res.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        city: event.city,
        maxParticipants: event.maxParticipants,
        status: event.status,
        qrCode: event.qrCode,
        publicLink: event.publicLink,
      },
      company: company || { name: 'Entreprise', city: '' },
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching public event:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/events/:id/share-info
 * Get share information (QR code and public link) for an event
 */
router.get('/:id/share-info', requireAuth, async (req: Request, res: Response) => {
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

    res.json({
      qrCode: event.qrCode,
      publicLink: event.publicLink,
      eventId: event.id,
      title: event.title,
    });
  } catch (error: any) {
    console.error('Error fetching share info:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/events/:id/qrcode
 * Regenerate QR code for an event
 */
router.post('/:id/qrcode', requireAuth, async (req: Request, res: Response) => {
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

    // Generate new QR code
    const qrCode = await generateEventQRCode(id);

    // Update event with new QR code
    const [updatedEvent] = await db
      .update(events)
      .set({ 
        qrCode,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    res.json({ 
      event: updatedEvent,
      message: 'QR code régénéré avec succès' 
    });
  } catch (error: any) {
    console.error('Error regenerating QR code:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du QR code' });
  }
});

export default router;
