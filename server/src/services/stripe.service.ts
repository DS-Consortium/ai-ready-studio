/**
 * Stripe Service
 * Handles all Stripe payment processing
 */
import Stripe from 'stripe';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create checkout session
 */
export async function createCheckoutSession(
  userId: string,
  credits: number,
  price: number,
  customerEmail: string
): Promise<{ sessionId: string; url: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} AI Ready Credits`,
              description: 'Vote for your favorite declarations',
              images: [`${config.FRONTEND_URL}/logo.png`],
            },
            unit_amount: Math.round(price * 100), // cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.FRONTEND_URL}/dashboard?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/credits?payment_status=cancelled`,
      customer_email: customerEmail,
      metadata: {
        userId,
        credits: credits.toString(),
        timestamp: new Date().toISOString(),
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve session
 */
export async function getSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Award credits to user on successful payment
 */
export async function awardCreditsForPayment(
  sessionId: string,
  userId: string,
  credits: number
): Promise<void> {
  try {
    // Get current credits
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newBalance = (user?.credits || 0) + credits;

    // Update credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: credits,
      type: 'purchase',
      description: `Stripe payment: ${credits} credits`,
      stripe_session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Awarded ${credits} credits to user ${userId}`);
  } catch (error) {
    console.error('Error awarding credits:', error);
    throw error;
  }
}

/**
 * Handle stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata) {
        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits);
        await awardCreditsForPayment(session.id, userId, credits);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log(`💰 Refund processed: ${charge.id}`);
      // Handle refunds (deduct credits from user)
      break;
    }

    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, config.STRIPE_WEBHOOK_SECRET);
}

export { stripe };
