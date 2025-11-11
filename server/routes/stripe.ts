import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { companies, transactions, invoices, companyPlanState, planHistory, plans, stripeEvents } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';
import { generateInvoicePDF } from '../services/invoice';

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Shared helper to create Stripe Checkout Session
 * Can be used both for registration and plan upgrades
 */
export async function createStripeCheckoutSession(params: {
  company: { id: string; email: string; name: string };
  plan: { id: string; name: string; monthlyPrice: string; annualPrice: string };
  billingCycle: 'monthly' | 'annual';
  userId: string;
  isRegistration?: boolean;
}) {
  const { company, plan, billingCycle, userId, isRegistration = false } = params;

  const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const unitAmount = Math.round(parseFloat(amount) * 100); // Convert to cents

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `TEAMMOVE - ${plan.name}`,
            description: `Abonnement ${billingCycle === 'annual' ? 'annuel' : 'mensuel'}`,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: billingCycle === 'annual' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/payment/cancel`,
    customer_email: company.email,
    client_reference_id: company.id,
    metadata: {
      companyId: company.id,
      planId: plan.id,
      billingCycle,
      userId,
      registrationFlow: isRegistration ? 'initial' : 'upgrade',
    },
  });

  return session;
}

/**
 * Create Stripe Checkout Session for ESSENTIEL plan payment
 */
router.post('/create-checkout-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Get company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // Get plan details
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: 'Plan non trouvé' });
    }

    // Create Stripe Checkout Session using shared helper
    const session = await createStripeCheckoutSession({
      company: {
        id: company.id,
        email: company.email,
        name: company.name,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
      },
      billingCycle: billingCycle as 'monthly' | 'annual',
      userId: user.userId,
      isRegistration: false,
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});

/**
 * Stripe Webhook Handler
 * Handles payment confirmation and subscription events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    if (WEBHOOK_SECRET) {
      // Use rawBody for signature verification (configured in server/index.ts)
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new Error('Raw body not available for webhook signature verification');
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    } else {
      // For development without webhook secret
      event = req.body as Stripe.Event;
      console.warn('WARNING: Stripe webhook called without STRIPE_WEBHOOK_SECRET verification');
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    // Check if event has already been processed (idempotency)
    const [existingEvent] = await db
      .select()
      .from(stripeEvents)
      .where(eq(stripeEvents.stripeEventId, event.id))
      .limit(1);

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return res.json({ received: true, processed: false });
    }

    // Process event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, processed: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle successful checkout session with idempotency
 */
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { companyId, planId, billingCycle, userId } = session.metadata || {};

  if (!companyId || !planId) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log('Processing checkout completion for company:', companyId);

  // Get plan details
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!plan) {
    console.error('Plan not found:', planId);
    return;
  }

  const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  // Retrieve subscription to get period dates
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const subscriptionData = subscription as any;

  let transactionId: string;

  try {
    // Wrap in database transaction for atomicity
    await db.transaction(async (tx) => {
      // 1. Record event processing (idempotency protection)
      await tx.insert(stripeEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        metadata: {
          companyId,
          planId,
          sessionId: session.id,
          subscriptionId: session.subscription as string,
        },
      });

      // 2. Create transaction record
      const [transaction] = await tx.insert(transactions).values({
        companyId,
        planId,
        amount,
        currency: 'EUR',
        status: 'completed',
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription as string,
        paymentMethod: 'card',
        billingCycle: billingCycle as 'monthly' | 'annual',
        paidAt: new Date(),
      }).returning();

      transactionId = transaction.id;
      console.log('Transaction created:', transaction.id);

      // 3. Update company plan state with subscription metadata
      await tx
        .update(companyPlanState)
        .set({
          quotePending: false,
          billingCycle: billingCycle as 'monthly' | 'annual',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
          currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(companyPlanState.companyId, companyId));

      // 4. Log plan activation in history
      await tx.insert(planHistory).values({
        companyId,
        oldPlanId: planId, // Same plan, just activated
        newPlanId: planId,
        reason: `Payment completed - ${billingCycle} subscription activated`,
        changedByUserId: userId || null,
      });

      console.log('Company plan activated for:', companyId);
    });

    // 5. Generate PDF invoice AFTER transaction success (outside DB transaction)
    try {
      const pdfUrl = await generateInvoicePDF(transactionId);
      console.log('Invoice PDF generated:', pdfUrl);
    } catch (error: any) {
      console.error('Failed to generate invoice PDF:', error);
      // Don't fail if PDF generation fails - can be regenerated later
    }
  } catch (error: any) {
    // Handle unique constraint violation (event already processed)
    if (error.code === '23505' && error.constraint === 'stripe_events_stripe_event_id_unique') {
      console.log(`Event ${event.id} already processed (caught constraint violation)`);
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Handle successful invoice payment with idempotency
 * Triggered for subscription renewals
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  // Extract subscription ID from invoice (can be string or expanded object)
  const invoiceData = invoice as any;
  const subscriptionId = typeof invoiceData.subscription === 'string' 
    ? invoiceData.subscription 
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // Skip initial subscription invoice (already handled by checkout.session.completed)
  if (invoiceData.billing_reason === 'subscription_create') {
    console.log('Skipping initial subscription invoice:', invoice.id);
    return;
  }

  // Find company by subscription ID
  const [existingTransaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!existingTransaction) {
    console.log('No existing transaction found for subscription:', subscriptionId);
    return;
  }

  const periodStart = invoiceData.period_start 
    ? new Date(invoiceData.period_start * 1000) 
    : undefined;
  const periodEnd = invoiceData.period_end 
    ? new Date(invoiceData.period_end * 1000) 
    : undefined;

  let transactionId: string;

  try {
    // Wrap in database transaction for atomicity
    await db.transaction(async (tx) => {
      // 1. Record event processing (idempotency protection)
      await tx.insert(stripeEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        metadata: {
          companyId: existingTransaction.companyId,
          planId: existingTransaction.planId,
          subscriptionId,
          invoiceId: invoice.id,
        },
      });

      // 2. Create new transaction for renewal
      const [transaction] = await tx.insert(transactions).values({
        companyId: existingTransaction.companyId,
        planId: existingTransaction.planId,
        amount: (invoice.amount_paid / 100).toString(), // Convert from cents
        currency: 'EUR',
        status: 'completed',
        stripeSubscriptionId: subscriptionId,
        stripeInvoiceId: invoice.id,
        paymentMethod: 'card',
        billingCycle: existingTransaction.billingCycle,
        paidAt: new Date(),
      }).returning();

      transactionId = transaction.id;
      console.log('Renewal transaction created:', transaction.id);

      // 3. Update company plan state with new period dates
      if (periodStart && periodEnd) {
        await tx
          .update(companyPlanState)
          .set({
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(companyPlanState.companyId, existingTransaction.companyId));
      }
    });

    // 4. Generate PDF invoice AFTER transaction success (outside DB transaction)
    try {
      const pdfUrl = await generateInvoicePDF(transactionId);
      console.log('Renewal invoice PDF generated:', pdfUrl);
    } catch (error: any) {
      console.error('Failed to generate renewal invoice PDF:', error);
      // Don't fail if PDF generation fails - can be regenerated later
    }
  } catch (error: any) {
    // Handle unique constraint violation (event already processed)
    if (error.code === '23505' && error.constraint === 'stripe_events_stripe_event_id_unique') {
      console.log(`Event ${event.id} already processed (caught constraint violation)`);
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  // Extract subscription ID from invoice (can be string or expanded object)
  const invoiceData = invoice as any;
  const subscriptionId = typeof invoiceData.subscription === 'string' 
    ? invoiceData.subscription 
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // Find company by subscription
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!transaction) {
    return;
  }

  console.log('Payment failed for company:', transaction.companyId);

  // TODO: Implement grace period logic
  // For now, just log the failure
  // In production, you might want to:
  // - Send notification email
  // - Set a grace period
  // - Downgrade to free plan after X days
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Find company by subscription ID
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!transaction) {
    return;
  }

  console.log('Subscription cancelled for company:', transaction.companyId);

  // Get DECOUVERTE (free) plan
  const [freePlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.tier, 'DECOUVERTE'))
    .limit(1);

  if (!freePlan) {
    console.error('Free plan not found');
    return;
  }

  // Downgrade to free plan
  await db
    .update(companyPlanState)
    .set({
      planId: freePlan.id,
      quotePending: false,
      updatedAt: new Date(),
    })
    .where(eq(companyPlanState.companyId, transaction.companyId));

  // Log plan change
  await db.insert(planHistory).values({
    companyId: transaction.companyId,
    oldPlanId: transaction.planId,
    newPlanId: freePlan.id,
    reason: 'Subscription cancelled - downgraded to free plan',
    changedByUserId: null,
  });

  console.log('Company downgraded to free plan:', transaction.companyId);
}

/**
 * Get checkout session status (for frontend polling)
 */
router.get('/checkout-session/:sessionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      status: session.payment_status,
      customerEmail: session.customer_email,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.companyId) {
      return res.status(403).json({ error: 'Utilisateur non associé à une entreprise' });
    }

    // Find active subscription
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.companyId, user.companyId),
          eq(transactions.status, 'completed')
        )
      )
      .orderBy(transactions.createdAt)
      .limit(1);

    if (!transaction || !transaction.stripeSubscriptionId) {
      return res.status(404).json({ error: 'Aucun abonnement actif trouvé' });
    }

    // Cancel at period end (don't immediately revoke access)
    const subscription = await stripe.subscriptions.update(
      transaction.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    return res.json({
      success: true,
      message: 'Abonnement annulé. Votre accès reste actif jusqu\'à la fin de la période payée.',
      cancelAt: subscription.cancel_at,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

export default router;
