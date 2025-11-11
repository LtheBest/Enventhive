import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

/**
 * GET /api/registration/verify-payment
 * Verify Stripe payment status after checkout
 * This is called by the success page to confirm payment before redirecting to dashboard
 */
router.get('/verify-payment', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'session_id parameter is required' 
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify payment status
    if (session.payment_status === 'paid') {
      return res.json({
        success: true,
        paymentStatus: 'paid',
        companyId: session.metadata?.companyId,
        sessionId: session.id,
        message: 'Paiement confirmé',
      });
    } else if (session.payment_status === 'unpaid') {
      return res.json({
        success: false,
        paymentStatus: 'unpaid',
        message: 'Le paiement est en attente de traitement',
      });
    } else {
      return res.json({
        success: false,
        paymentStatus: session.payment_status,
        message: 'Le paiement n\'a pas été complété',
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la vérification du paiement' 
    });
  }
});

export default router;
