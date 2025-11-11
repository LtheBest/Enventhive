import { Router, Request, Response } from 'express';
import { Client } from '@replit/object-storage';
import { db } from '../db';
import { invoices, companies } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';

const router = Router();

/**
 * GET /api/invoices/company/:companyId
 * List all invoices for a company (authenticated)
 * IMPORTANT: This route MUST be before /:invoiceNumber to avoid greedy matching
 */
router.get('/company/:companyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Check permissions: user must belong to the same company or be an admin
    if (user.role !== 'admin' && user.companyId !== companyId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Fetch all invoices for company
    const companyInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(invoices.createdAt);

    res.json({ invoices: companyInvoices });
  } catch (error: any) {
    console.error('Error listing invoices:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des factures' });
  }
});

/**
 * GET /api/invoices/:invoiceNumber
 * Download invoice PDF (authenticated)
 * Only accessible by the company that owns the invoice or admins
 */
router.get('/:invoiceNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Fetch invoice metadata
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    // Check permissions: user must belong to the same company or be an admin
    if (user.role !== 'admin' && user.companyId !== invoice.companyId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Fetch PDF from Object Storage
    const storage = new Client();
    const objectKey = `invoices/${invoiceNumber}.pdf`;
    
    const downloadResult = await storage.downloadAsBytes(objectKey);

    if (!downloadResult.ok) {
      console.error('Failed to download PDF from object storage:', downloadResult.error);
      return res.status(500).json({ error: 'Erreur lors du téléchargement de la facture' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Send PDF bytes (downloadResult.value is Uint8Array)
    res.send(downloadResult.value);
  } catch (error: any) {
    console.error('Error serving invoice:', error);
    res.status(500).json({ error: 'Erreur serveur lors du téléchargement de la facture' });
  }
});

export default router;
