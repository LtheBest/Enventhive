/**
 * Public Events Routes - External pages for event participation
 * These routes are accessible WITHOUT authentication
 * Used when participants receive invitation links or QR codes
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  events, 
  companies, 
  participants, 
  vehicles, 
  passengerRideRequests,
  vehicleBookings,
  invitationTokens
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { sendParticipantInvitation } from '../services/email';

const router = Router();

// Validation schemas
const joinEventSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  city: z.string().min(1, 'La ville est requise'),
  role: z.enum(['driver', 'passenger'], { required_error: 'Le rôle est requis' }),
  
  // Driver-specific fields
  departureLocation: z.string().optional(),
  departureTime: z.string().optional(), // ISO date string
  totalSeats: z.number().int().min(1).optional(),
  isPaidRide: z.boolean().optional(),
  pricePerKm: z.number().optional(),
  estimatedDistance: z.number().optional(),
  
  // Passenger-specific fields
  passengerDepartureLocation: z.string().optional(),
});

/**
 * GET /api/public/events/:eventIdOrPublicLink
 * Get public event details (no authentication required)
 */
router.get('/:eventIdOrPublicLink', async (req: Request, res: Response) => {
  try {
    const { eventIdOrPublicLink } = req.params;

    // Try to find event by ID or public link
    const [event] = await db
      .select({
        event: events,
        company: companies,
      })
      .from(events)
      .innerJoin(companies, eq(events.companyId, companies.id))
      .where(
        sql`${events.id} = ${eventIdOrPublicLink} OR ${events.publicLink} = ${eventIdOrPublicLink}`
      )
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Get participant count
    const [participantCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participants)
      .where(eq(participants.eventId, event.event.id));

    // Get available drivers count (vehicles with available seats)
    const [driversCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.eventId, event.event.id),
          sql`${vehicles.availableSeats} > 0`
        )
      );

    res.json({ 
      event: event.event,
      company: {
        name: event.company.name,
        logoUrl: event.company.logoUrl,
      },
      stats: {
        participantCount: participantCount.count,
        driversCount: driversCount.count,
      }
    });
  } catch (error: any) {
    console.error('Error fetching public event:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'événement' });
  }
});

/**
 * POST /api/public/events/:eventId/join
 * Join an event as a participant (no authentication required)
 */
router.post('/:eventId/join', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Validate request body
    const validatedData = joinEventSchema.parse(req.body);

    // Check if event exists
    const [event] = await db
      .select({
        event: events,
        company: companies,
      })
      .from(events)
      .innerJoin(companies, eq(events.companyId, companies.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    // Check if event is still open (not completed or cancelled)
    if (event.event.status === 'completed' || event.event.status === 'cancelled') {
      return res.status(400).json({ error: 'Cet événement n\'accepte plus de nouvelles inscriptions' });
    }

    // Check if email already registered for this event
    const [existingParticipant] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.eventId, eventId),
          eq(participants.email, validatedData.email)
        )
      )
      .limit(1);

    if (existingParticipant) {
      return res.status(400).json({ error: 'Cet email est déjà inscrit à l\'événement' });
    }

    // Check participant limit
    if (event.event.maxParticipants) {
      const [participantCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(participants)
        .where(eq(participants.eventId, eventId));

      if (participantCount.count >= event.event.maxParticipants) {
        return res.status(400).json({ 
          error: 'Le nombre maximum de participants est atteint',
          limit: event.event.maxParticipants 
        });
      }
    }

    // Create participant
    const [participant] = await db
      .insert(participants)
      .values({
        eventId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        city: validatedData.city,
        role: validatedData.role,
        status: 'confirmed',
        respondedAt: new Date(),
      })
      .returning();

    // If driver, create vehicle entry
    if (validatedData.role === 'driver' && validatedData.departureLocation && validatedData.departureTime && validatedData.totalSeats) {
      const [vehicle] = await db
        .insert(vehicles)
        .values({
          eventId,
          driverParticipantId: participant.id,
          totalSeats: validatedData.totalSeats,
          availableSeats: validatedData.totalSeats,
          departureLocation: validatedData.departureLocation,
          departureCity: validatedData.city,
          departureTime: new Date(validatedData.departureTime),
          isPaidRide: validatedData.isPaidRide || false,
          pricePerKm: validatedData.pricePerKm ? validatedData.pricePerKm.toString() : null,
          estimatedDistance: validatedData.estimatedDistance ? validatedData.estimatedDistance.toString() : null,
        })
        .returning();

      // Check if there are pending passengers in the same city
      const pendingPassengers = await db
        .select({
          request: passengerRideRequests,
          participant: participants,
        })
        .from(passengerRideRequests)
        .innerJoin(participants, eq(passengerRideRequests.participantId, participants.id))
        .where(
          and(
            eq(passengerRideRequests.eventId, eventId),
            eq(passengerRideRequests.departureCity, validatedData.city),
            eq(passengerRideRequests.status, 'pending')
          )
        );

      // Notify pending passengers (send emails - non-blocking)
      for (const pending of pendingPassengers) {
        // Update ride request to notify that a driver is available
        await db
          .update(passengerRideRequests)
          .set({
            status: 'matched',
            matchedVehicleId: vehicle.id,
            updatedAt: new Date(),
          })
          .where(eq(passengerRideRequests.id, pending.request.id));

        // TODO: Send email notification to passenger
      }

      return res.status(201).json({ 
        participant,
        vehicle,
        message: 'Inscription confirmée en tant que conducteur',
        notifiedPassengers: pendingPassengers.length,
      });
    }

    // If passenger, check for available drivers
    if (validatedData.role === 'passenger' && validatedData.passengerDepartureLocation) {
      // Look for available vehicles in the same city
      const availableVehicles = await db
        .select({
          vehicle: vehicles,
          driver: participants,
        })
        .from(vehicles)
        .innerJoin(participants, eq(vehicles.driverParticipantId, participants.id))
        .where(
          and(
            eq(vehicles.eventId, eventId),
            eq(vehicles.departureCity, validatedData.city),
            sql`${vehicles.availableSeats} > 0`
          )
        );

      if (availableVehicles.length === 0) {
        // No drivers available - create a pending ride request
        const [rideRequest] = await db
          .insert(passengerRideRequests)
          .values({
            participantId: participant.id,
            eventId,
            departureLocation: validatedData.passengerDepartureLocation,
            departureCity: validatedData.city,
            status: 'pending',
          })
          .returning();

        return res.status(201).json({ 
          participant,
          rideRequest,
          message: 'Inscription confirmée. Aucun conducteur disponible pour le moment. Vous serez notifié dès qu\'un conducteur s\'inscrit dans votre zone.',
          noDriversAvailable: true,
        });
      }

      // Drivers available - return the list
      return res.status(201).json({ 
        participant,
        availableVehicles: availableVehicles.map(v => ({
          vehicleId: v.vehicle.id,
          driver: {
            firstName: v.driver.firstName,
            lastName: v.driver.lastName,
          },
          departureLocation: v.vehicle.departureLocation,
          departureTime: v.vehicle.departureTime,
          availableSeats: v.vehicle.availableSeats,
          isPaidRide: v.vehicle.isPaidRide,
          pricePerKm: v.vehicle.pricePerKm,
        })),
        message: 'Inscription confirmée. Veuillez sélectionner un conducteur.',
      });
    }

    res.status(201).json({ 
      participant,
      message: 'Inscription confirmée avec succès',
    });
  } catch (error: any) {
    console.error('Error joining event:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

/**
 * POST /api/public/events/:eventId/book-vehicle
 * Book a seat on a vehicle (for passengers)
 */
router.post('/:eventId/book-vehicle', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { participantId, vehicleId } = req.body;

    if (!participantId || !vehicleId) {
      return res.status(400).json({ error: 'participantId et vehicleId sont requis' });
    }

    // Verify participant exists and is a passenger
    const [participant] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.id, participantId),
          eq(participants.eventId, eventId),
          eq(participants.role, 'passenger')
        )
      )
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: 'Participant introuvable ou n\'est pas un passager' });
    }

    // Verify vehicle exists and has available seats
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.eventId, eventId)
        )
      )
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    if (vehicle.availableSeats <= 0) {
      return res.status(400).json({ error: 'Plus de places disponibles sur ce véhicule' });
    }

    // Check if already booked
    const [existingBooking] = await db
      .select()
      .from(vehicleBookings)
      .where(
        and(
          eq(vehicleBookings.passengerParticipantId, participantId),
          eq(vehicleBookings.vehicleId, vehicleId)
        )
      )
      .limit(1);

    if (existingBooking) {
      return res.status(400).json({ error: 'Vous avez déjà réservé une place sur ce véhicule' });
    }

    // Create booking
    const [booking] = await db
      .insert(vehicleBookings)
      .values({
        vehicleId,
        passengerParticipantId: participantId,
        status: 'confirmed',
        confirmedAt: new Date(),
      })
      .returning();

    // Decrease available seats
    await db
      .update(vehicles)
      .set({
        availableSeats: sql`${vehicles.availableSeats} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId));

    // If there was a pending ride request, update it
    const [rideRequest] = await db
      .select()
      .from(passengerRideRequests)
      .where(
        and(
          eq(passengerRideRequests.participantId, participantId),
          eq(passengerRideRequests.eventId, eventId)
        )
      )
      .limit(1);

    if (rideRequest) {
      await db
        .update(passengerRideRequests)
        .set({
          status: 'confirmed',
          matchedVehicleId: vehicleId,
          updatedAt: new Date(),
        })
        .where(eq(passengerRideRequests.id, rideRequest.id));
    }

    res.status(201).json({ 
      booking,
      message: 'Réservation confirmée avec succès',
    });
  } catch (error: any) {
    console.error('Error booking vehicle:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la réservation' });
  }
});

/**
 * GET /api/public/events/:eventId/available-vehicles
 * Get available vehicles for an event (filtered by city)
 */
router.get('/:eventId/available-vehicles', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'Le paramètre city est requis' });
    }

    const availableVehicles = await db
      .select({
        vehicle: vehicles,
        driver: participants,
      })
      .from(vehicles)
      .innerJoin(participants, eq(vehicles.driverParticipantId, participants.id))
      .where(
        and(
          eq(vehicles.eventId, eventId),
          eq(vehicles.departureCity, city as string),
          sql`${vehicles.availableSeats} > 0`
        )
      );

    res.json({ 
      vehicles: availableVehicles.map(v => ({
        vehicleId: v.vehicle.id,
        driver: {
          firstName: v.driver.firstName,
          lastName: v.driver.lastName,
        },
        departureLocation: v.vehicle.departureLocation,
        departureCity: v.vehicle.departureCity,
        departureTime: v.vehicle.departureTime,
        availableSeats: v.vehicle.availableSeats,
        totalSeats: v.vehicle.totalSeats,
        isPaidRide: v.vehicle.isPaidRide,
        pricePerKm: v.vehicle.pricePerKm,
        estimatedDistance: v.vehicle.estimatedDistance,
        notes: v.vehicle.notes,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des véhicules' });
  }
});

export default router;
