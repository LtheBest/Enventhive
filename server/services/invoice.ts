import PDFDocument from 'pdfkit';
import { db } from '../db';
import { companies, plans, transactions, invoices } from '@shared/schema';
import { eq, gte } from 'drizzle-orm';
import { Client } from '@replit/object-storage';

interface InvoiceData {
  transactionId: string;
  companyId: string;
  planId: string;
  amount: string;
  currency: string;
  billingCycle: 'monthly' | 'annual' | null;
  stripeInvoiceId?: string | null;
  createdAt: Date;
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX
 */
async function generateInvoiceNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of invoices created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayInvoices = await db
    .select()
    .from(invoices)
    .where(gte(invoices.createdAt, today));
  
  const sequence = String(todayInvoices.length + 1).padStart(5, '0');
  return `INV-${dateStr}-${sequence}`;
}

/**
 * Generate invoice PDF and store it in object storage
 * Returns the public URL of the generated PDF
 */
export async function generateInvoicePDF(transactionId: string): Promise<string> {
  // Fetch transaction data with company and plan info
  const [transaction] = await db
    .select({
      transaction: transactions,
      company: companies,
      plan: plans,
    })
    .from(transactions)
    .innerJoin(companies, eq(transactions.companyId, companies.id))
    .innerJoin(plans, eq(transactions.planId, plans.id))
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Generate unique invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Build PDF content
  buildInvoicePDF(doc, {
    invoiceNumber,
    transaction: transaction.transaction,
    company: transaction.company,
    plan: transaction.plan,
  });

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

  // Store PDF in Object Storage for persistence
  const storage = new Client();
  const objectKey = `invoices/${invoiceNumber}.pdf`;
  
  const uploadResult = await storage.uploadFromBytes(objectKey, pdfBuffer);
  
  if (!uploadResult.ok) {
    throw new Error(`Failed to upload PDF to object storage: ${uploadResult.error}`);
  }
  
  // URL path (will be served via authenticated Express endpoint)
  // We store the object key, not a full URL
  const pdfUrl = `/api/invoices/${invoiceNumber}`;

  // Create invoice record
  await db.insert(invoices).values({
    transactionId,
    companyId: transaction.transaction.companyId,
    invoiceNumber,
    pdfUrl,
  });

  return pdfUrl;
}

/**
 * Build PDF invoice content
 */
function buildInvoicePDF(
  doc: PDFKit.PDFDocument,
  data: {
    invoiceNumber: string;
    transaction: typeof transactions.$inferSelect;
    company: typeof companies.$inferSelect;
    plan: typeof plans.$inferSelect;
  }
) {
  const { invoiceNumber, transaction, company, plan } = data;

  // Header - Company branding area
  doc.fontSize(20).text('FACTURE', 50, 50);
  doc.fontSize(10).text(invoiceNumber, 50, 75, { align: 'left' });
  doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('fr-FR')}`, 50, 90);

  // Add line
  doc.moveTo(50, 110).lineTo(550, 110).stroke();

  // Platform information (Vendor)
  doc.fontSize(12).text('TEAMMOVE', 50, 130);
  doc.fontSize(10)
    .text('Plateforme de gestion d\'événements', 50, 145)
    .text('Paris, France', 50, 160);

  // Customer information
  doc.fontSize(12).text('Facturé à:', 350, 130);
  doc.fontSize(10)
    .text(company.name, 350, 145)
    .text(`SIREN: ${company.siren}`, 350, 160)
    .text(company.address, 350, 175)
    .text(`${company.postalCode} ${company.city}`, 350, 190)
    .text(company.email, 350, 205);

  // Invoice details table
  const tableTop = 250;
  doc.fontSize(12).text('Détails de la facturation', 50, tableTop);

  // Table headers
  const itemY = tableTop + 25;
  doc.fontSize(10)
    .text('Description', 50, itemY)
    .text('Cycle', 280, itemY)
    .text('Montant', 450, itemY, { align: 'right' });

  // Table line
  doc.moveTo(50, itemY + 15).lineTo(550, itemY + 15).stroke();

  // Table content
  const contentY = itemY + 25;
  const billingCycleLabel = transaction.billingCycle === 'annual' ? 'Annuel' : 'Mensuel';
  
  doc.fontSize(10)
    .text(`Plan ${plan.name}`, 50, contentY)
    .text(billingCycleLabel, 280, contentY)
    .text(`${parseFloat(transaction.amount).toFixed(2)} ${transaction.currency}`, 450, contentY, { align: 'right' });

  // Subtotal and Total
  const totalY = contentY + 50;
  doc.moveTo(50, totalY - 10).lineTo(550, totalY - 10).stroke();

  doc.fontSize(10)
    .text('Sous-total:', 350, totalY)
    .text(`${parseFloat(transaction.amount).toFixed(2)} ${transaction.currency}`, 450, totalY, { align: 'right' });

  doc.fontSize(12)
    .text('Total TTC:', 350, totalY + 25)
    .text(`${parseFloat(transaction.amount).toFixed(2)} ${transaction.currency}`, 450, totalY + 25, { align: 'right' });

  // Payment information
  const paymentY = totalY + 70;
  doc.fontSize(10)
    .text('Informations de paiement', 50, paymentY)
    .text(`Méthode: ${transaction.paymentMethod || 'Carte bancaire'}`, 50, paymentY + 20)
    .text(`Statut: ${transaction.status === 'completed' ? 'Payé' : transaction.status}`, 50, paymentY + 35)
    .text(`Date de paiement: ${new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('fr-FR')}`, 50, paymentY + 50);

  // Footer
  const footerY = 720;
  doc.fontSize(8)
    .text('TEAMMOVE - Plateforme SaaS de gestion d\'événements professionnels', 50, footerY, { align: 'center' })
    .text('Merci pour votre confiance', 50, footerY + 15, { align: 'center' });
}

/**
 * Get invoice by transaction ID
 */
export async function getInvoiceByTransactionId(transactionId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.transactionId, transactionId))
    .limit(1);

  return invoice;
}

/**
 * Get all invoices for a company
 */
export async function getCompanyInvoices(companyId: string) {
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.companyId, companyId))
    .orderBy(invoices.createdAt);
}
