import { Router, Request, Response } from 'express';
import { db } from '../db';
import { participants, events, companies } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { sendParticipantInvitation } from '../services/email';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Validation schemas
const createParticipantSchema = z.object({
  eventId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  city: z.string().min(1),
  role: z.enum(['driver', 'passenger']).default('passenger'),
  sendInvitation: z.boolean().default(true), // Option to send invitation email
});

/**
 * POST /api/participants
 * Create and invite a participant to an event
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Validate request body
    const validatedData = createParticipantSchema.parse(req.body);

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

    // Check if participant already exists for this event
    const existingParticipant = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.eventId, validatedData.eventId),
          eq(participants.email, validatedData.email.toLowerCase())
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      return res.status(409).json({ error: 'Ce participant est déjà inscrit à cet événement' });
    }

    // Create participant
    const [participant] = await db
      .insert(participants)
      .values({
        eventId: validatedData.eventId,
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        city: validatedData.city,
        role: validatedData.role,
        status: 'pending',
      })
      .returning();

    // Send invitation email if requested
    if (validatedData.sendInvitation) {
      // Get company info
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user.companyId))
        .limit(1);

      if (company) {
        // Generate invitation token (JWT with participant ID and event ID)
        const invitationToken = jwt.sign(
          {
            participantId: participant.id,
            eventId: event.id,
            email: participant.email,
            type: 'participant_invitation',
          },
          JWT_SECRET,
          { expiresIn: '30d' } // Token valid for 30 days
        );

        // Send invitation email (non-blocking)
        sendParticipantInvitation({
          company,
          event,
          participant,
          invitationToken,
        }).catch(err => console.error('Participant invitation email error:', err));
      }
    }

    res.status(201).json({ participant });
  } catch (error: any) {
    console.error('Error creating participant:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la création du participant' });
  }
});

/**
 * POST /api/participants/bulk-invite
 * Invite multiple participants at once
 */
router.post('/bulk-invite', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    const { eventId, participants: participantsList } = req.body;

    if (!eventId || !Array.isArray(participantsList) || participantsList.length === 0) {
      return res.status(400).json({ error: 'Données invalides' });
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

    // Get company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const results = [];
    const errors = [];

    for (const participantData of participantsList) {
      try {
        const validatedData = createParticipantSchema.parse({
          ...participantData,
          eventId,
        });

        // Check if participant already exists
        const existingParticipant = await db
          .select()
          .from(participants)
          .where(
            and(
              eq(participants.eventId, eventId),
              eq(participants.email, validatedData.email.toLowerCase())
            )
          )
          .limit(1);

        if (existingParticipant.length > 0) {
          errors.push({ email: validatedData.email, error: 'Déjà inscrit' });
          continue;
        }

        // Create participant
        const [participant] = await db
          .insert(participants)
          .values({
            eventId: validatedData.eventId,
            email: validatedData.email.toLowerCase(),
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone || null,
            city: validatedData.city,
            role: validatedData.role,
            status: 'pending',
          })
          .returning();

        // Generate invitation token
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
          event,
          participant,
          invitationToken,
        }).catch(err => console.error('Participant invitation email error:', err));

        results.push(participant);
      } catch (error: any) {
        errors.push({ 
          email: participantData.email, 
          error: error.message || 'Erreur de validation' 
        });
      }
    }

    res.status(201).json({
      success: true,
      created: results.length,
      participants: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error bulk inviting participants:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'invitation des participants' });
  }
});

/**
 * GET /api/participants/accept-invitation
 * Accept a participant invitation (public endpoint)
 */
router.get('/accept-invitation', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token manquant' });
    }

    // Verify and decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    if (decoded.type !== 'participant_invitation') {
      return res.status(400).json({ error: 'Type de token invalide' });
    }

    // Get participant
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, decoded.participantId))
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: 'Participant introuvable' });
    }

    // Update participant status to confirmed
    const [updatedParticipant] = await db
      .update(participants)
      .set({
        status: 'confirmed',
        respondedAt: new Date(),
      })
      .where(eq(participants.id, participant.id))
      .returning();

    res.json({
      success: true,
      message: 'Invitation acceptée avec succès',
      participant: updatedParticipant,
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/participants/decline-invitation
 * Decline a participant invitation (public endpoint)
 */
router.get('/decline-invitation', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token manquant' });
    }

    // Verify and decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    if (decoded.type !== 'participant_invitation') {
      return res.status(400).json({ error: 'Type de token invalide' });
    }

    // Get participant
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, decoded.participantId))
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: 'Participant introuvable' });
    }

    // Update participant status to declined
    const [updatedParticipant] = await db
      .update(participants)
      .set({
        status: 'declined',
        respondedAt: new Date(),
      })
      .where(eq(participants.id, participant.id))
      .returning();

    res.json({
      success: true,
      message: 'Invitation déclinée',
      participant: updatedParticipant,
    });
  } catch (error: any) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/participants/event/:eventId
 * List all participants for an event
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

    // Get all participants for this event
    const eventParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.eventId, eventId));

    // Calculate statistics
    const stats = {
      total: eventParticipants.length,
      confirmed: eventParticipants.filter(p => p.status === 'confirmed').length,
      pending: eventParticipants.filter(p => p.status === 'pending').length,
      declined: eventParticipants.filter(p => p.status === 'declined').length,
      drivers: eventParticipants.filter(p => p.role === 'driver' && p.status === 'confirmed').length,
      passengers: eventParticipants.filter(p => p.role === 'passenger' && p.status === 'confirmed').length,
    };

    res.json({
      participants: eventParticipants,
      stats,
    });
  } catch (error: any) {
    console.error('Error listing participants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/participants/:id
 * Delete a participant
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Get participant
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, id))
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: 'Participant introuvable' });
    }

    // Check if event belongs to user's company
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, participant.eventId),
          eq(events.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!event) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Delete participant
    await db.delete(participants).where(eq(participants.id, id));

    res.json({ message: 'Participant supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/participants
 * List all participants for company's events
 * Optional query params: eventId, role, status
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    const { eventId, role, status } = req.query;

    // Build query to get participants from company's events
    let query = db
      .select({
        participant: participants,
        event: {
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          location: events.location,
          city: events.city,
        },
      })
      .from(participants)
      .innerJoin(events, eq(participants.eventId, events.id))
      .where(eq(events.companyId, user.companyId));

    // Build conditions array for filtering
    const conditions = [eq(events.companyId, user.companyId)];

    // Filter by event if specified
    if (eventId && typeof eventId === 'string') {
      conditions.push(eq(participants.eventId, eventId));
    }

    // Filter by role if specified
    if (role && (role === 'driver' || role === 'passenger')) {
      conditions.push(eq(participants.role, role));
    }

    // Filter by status if specified
    if (status && typeof status === 'string') {
      conditions.push(eq(participants.status, status as any));
    }

    // Apply filters
    if (conditions.length > 1) {
      query = db
        .select({
          participant: participants,
          event: {
            id: events.id,
            title: events.title,
            startDate: events.startDate,
            location: events.location,
            city: events.city,
          },
        })
        .from(participants)
        .innerJoin(events, eq(participants.eventId, events.id))
        .where(and(...conditions));
    }

    const results = await query;

    res.json({
      success: true,
      participants: results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Error listing participants:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des participants' });
  }
});

export default router;
