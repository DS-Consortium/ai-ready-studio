/**
 * Stripe API Routes
 */
import { Router, Request, Response } from 'express';
import {
  createCheckoutSession,
  handleWebhookEvent,
  verifyWebhookSignature,
  getSession,
} from '../services/stripe.service.js';

const router = Router();

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session for credit purchase
 */
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { userId, credits, price, customerEmail } = req.body;

    if (!userId || !credits || !price || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: userId, credits, price, customerEmail',
      });
    }

    const { sessionId, url } = await createCheckoutSession(
      userId,
      credits,
      price,
      customerEmail
    );

    res.json({
      sessionId,
      url,
      success: true,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stripe/session/:sessionId
 * Get session details
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const session = await getSession(sessionId);

    res.json({
      session,
      status: session.payment_status,
      success: true,
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler
 */
router.post('/webhooks/stripe', async (req: Request, res: Response) => {
  try {
    // For webhooks, we need raw body as string/buffer
    // This middleware should parse raw body, not JSON
    const sig = req.headers['stripe-signature'] as string;
    const body = (req as any).rawBody;

    if (!sig || !body) {
      return res.status(400).json({ error: 'Missing signature or body' });
    }

    // Verify and construct event
    const event = verifyWebhookSignature(body, sig);

    // Handle the event
    await handleWebhookEvent(event);

    // Return success
    res.json({ received: true, eventId: event.id });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
