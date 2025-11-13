import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  supportRequests, 
  supportMessages, 
  users, 
  companies,
  plans,
  companyPlanState
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireCompany, requireAdmin } from '../auth/middleware';
import { z } from 'zod';
import { sendSupportNotificationEmail } from '../services/email';

const router = Router();

// Validation schemas
const createSupportRequestSchema = z.object({
  requestType: z.enum(['quote_request', 'plan_upgrade', 'technical_support', 'general_inquiry']),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  requestedPlanId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

const sendMessageSchema = z.object({
  supportRequestId: z.string().uuid(),
  content: z.string().min(1, 'Le message ne peut pas être vide'),
  isInternal: z.boolean().default(false),
});

/**
 * POST /api/support/requests
 * Create a new support request (Company users only)
 */
router.post('/requests', requireAuth, requireCompany, async (req: Request, res: Response) => {
  try {
    const validatedData = createSupportRequestSchema.parse(req.body);
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    // Create support request
    const [supportRequest] = await db.insert(supportRequests).values({
      companyId,
      userId,
      requestType: validatedData.requestType,
      subject: validatedData.subject,
      status: 'open',
      priority: validatedData.priority,
      requestedPlanId: validatedData.requestedPlanId || null,
    }).returning();

    // Create first message
    await db.insert(supportMessages).values({
      supportRequestId: supportRequest.id,
      senderId: userId,
      senderType: 'company',
      content: validatedData.message,
      isInternal: false,
    });

    // Get company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    // Send notification email to admin(s)
    sendSupportNotificationEmail({
      supportRequestId: supportRequest.id,
      companyName: company.name,
      subject: validatedData.subject,
      message: validatedData.message,
      requestType: validatedData.requestType,
    }).catch(err => console.error('Support notification email error:', err));

    res.status(201).json({
      success: true,
      message: 'Demande de support créée avec succès',
      supportRequest: {
        id: supportRequest.id,
        subject: supportRequest.subject,
        status: supportRequest.status,
        createdAt: supportRequest.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    console.error('Create support request error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande de support' });
  }
});

/**
 * GET /api/support/requests
 * Get all support requests for current company (Company) or all requests (Admin)
 */
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const companyId = req.user!.companyId;

    let query = db
      .select({
        id: supportRequests.id,
        companyId: supportRequests.companyId,
        companyName: companies.name,
        requestType: supportRequests.requestType,
        subject: supportRequests.subject,
        status: supportRequests.status,
        priority: supportRequests.priority,
        requestedPlanId: supportRequests.requestedPlanId,
        requestedPlanName: plans.name,
        resolvedAt: supportRequests.resolvedAt,
        closedAt: supportRequests.closedAt,
        createdAt: supportRequests.createdAt,
        updatedAt: supportRequests.updatedAt,
      })
      .from(supportRequests)
      .innerJoin(companies, eq(supportRequests.companyId, companies.id))
      .leftJoin(plans, eq(supportRequests.requestedPlanId, plans.id));

    if (!isAdmin && companyId) {
      // Company users see only their requests
      query = query.where(eq(supportRequests.companyId, companyId));
    }

    const requests = await query.orderBy(desc(supportRequests.createdAt));

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get support requests error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes de support' });
  }
});

/**
 * GET /api/support/requests/:id
 * Get a single support request with all messages
 */
router.get('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin';
    const companyId = req.user!.companyId;

    // Get support request
    const [request] = await db
      .select({
        id: supportRequests.id,
        companyId: supportRequests.companyId,
        companyName: companies.name,
        companyEmail: companies.email,
        requestType: supportRequests.requestType,
        subject: supportRequests.subject,
        status: supportRequests.status,
        priority: supportRequests.priority,
        requestedPlanId: supportRequests.requestedPlanId,
        requestedPlanName: plans.name,
        assignedToUserId: supportRequests.assignedToUserId,
        resolvedAt: supportRequests.resolvedAt,
        closedAt: supportRequests.closedAt,
        createdAt: supportRequests.createdAt,
        updatedAt: supportRequests.updatedAt,
      })
      .from(supportRequests)
      .innerJoin(companies, eq(supportRequests.companyId, companies.id))
      .leftJoin(plans, eq(supportRequests.requestedPlanId, plans.id))
      .where(eq(supportRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Demande de support non trouvée' });
    }

    // Check authorization
    if (!isAdmin && request.companyId !== companyId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Get messages
    const messages = await db
      .select({
        id: supportMessages.id,
        senderId: supportMessages.senderId,
        senderEmail: users.email,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderType: supportMessages.senderType,
        content: supportMessages.content,
        isInternal: supportMessages.isInternal,
        readAt: supportMessages.readAt,
        createdAt: supportMessages.createdAt,
      })
      .from(supportMessages)
      .innerJoin(users, eq(supportMessages.senderId, users.id))
      .where(eq(supportMessages.supportRequestId, id))
      .orderBy(supportMessages.createdAt);

    // Filter out internal messages for company users
    const filteredMessages = isAdmin 
      ? messages 
      : messages.filter(msg => !msg.isInternal);

    res.json({
      success: true,
      request,
      messages: filteredMessages,
    });
  } catch (error) {
    console.error('Get support request error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la demande de support' });
  }
});

/**
 * POST /api/support/messages
 * Send a message in a support request
 */
router.post('/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    const companyId = req.user!.companyId;

    // Get support request
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, validatedData.supportRequestId))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Demande de support non trouvée' });
    }

    // Check authorization
    if (!isAdmin && request.companyId !== companyId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Company users cannot send internal messages
    if (!isAdmin && validatedData.isInternal) {
      return res.status(403).json({ error: 'Accès non autorisé pour les notes internes' });
    }

    // Create message
    const [message] = await db.insert(supportMessages).values({
      supportRequestId: validatedData.supportRequestId,
      senderId: userId,
      senderType: isAdmin ? 'admin' : 'company',
      content: validatedData.content,
      isInternal: validatedData.isInternal || false,
    }).returning();

    // Update support request updatedAt
    await db
      .update(supportRequests)
      .set({ updatedAt: new Date() })
      .where(eq(supportRequests.id, validatedData.supportRequestId));

    // Get sender info
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Send email notification if it's not an internal message
    if (!validatedData.isInternal) {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, request.companyId))
        .limit(1);

      // Notify the other party
      sendSupportNotificationEmail({
        supportRequestId: request.id,
        companyName: company.name,
        subject: request.subject,
        message: validatedData.content,
        requestType: request.requestType,
        isReply: true,
        senderType: isAdmin ? 'admin' : 'company',
        recipientEmail: isAdmin ? company.email : undefined,
      }).catch(err => console.error('Support message notification email error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      messageData: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderEmail: sender.email,
        senderFirstName: sender.firstName,
        senderLastName: sender.lastName,
        senderType: message.senderType,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    console.error('Send support message error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

/**
 * PATCH /api/support/requests/:id/status
 * Update support request status (Admin only)
 */
router.patch('/requests/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (status === 'closed') {
      updateData.closedAt = new Date();
    }

    const [updatedRequest] = await db
      .update(supportRequests)
      .set(updateData)
      .where(eq(supportRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Demande de support non trouvée' });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      status: updatedRequest.status,
    });
  } catch (error) {
    console.error('Update support request status error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

/**
 * PATCH /api/support/requests/:id/assign
 * Assign support request to an admin (Admin only)
 */
router.patch('/requests/:id/assign', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminUserId } = req.body;

    const [updatedRequest] = await db
      .update(supportRequests)
      .set({ 
        assignedToUserId: adminUserId || null,
        updatedAt: new Date(),
      })
      .where(eq(supportRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Demande de support non trouvée' });
    }

    res.json({
      success: true,
      message: 'Demande assignée avec succès',
      assignedToUserId: updatedRequest.assignedToUserId,
    });
  } catch (error) {
    console.error('Assign support request error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation de la demande' });
  }
});

export default router;
