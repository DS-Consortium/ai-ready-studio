/**
 * Stripe Webhook Handler for Credit Purchases
 * 
 * This file provides the backend webhook handler for Stripe payment events.
 * Deploy this to your backend (Node.js/Express, Next.js, etc.)
 * 
 * Setup Instructions:
 * 1. Add STRIPE_WEBHOOK_SECRET to your environment variables
 * 2. Configure Stripe webhook URL in Stripe Dashboard:
 *    Endpoint: https://yourdomain.com/api/webhooks/stripe
 *    Events: checkout.session.completed, charge.refunded
 * 3. Install dependencies: npm install stripe
 */

import Stripe from 'stripe';

// This should be stored in environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Type definitions for payment metadata
 */
interface PaymentMetadata {
  userId: string;
  packId: string;
  credits: number;
}

/**
 * NEXT.JS EXAMPLE - POST /api/webhooks/stripe
 * 
 * import { NextRequest, NextResponse } from 'next/server';
 * import { handleStripeWebhook } from '@/lib/stripe-webhook';
 * 
 * export async function POST(req: NextRequest) {
 *   const body = await req.text();
 *   const signature = req.headers.get('stripe-signature')!;
 *   
 *   try {
 *     await handleStripeWebhook(body, signature);
 *     return NextResponse.json({ received: true });
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 400 });
 *   }
 * }
 */

/**
 * EXPRESS.JS EXAMPLE
 * 
 * app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
 *   try {
 *     await handleStripeWebhook(req.body, req.headers['stripe-signature']);
 *     res.json({ received: true });
 *   } catch (error) {
 *     res.status(400).json({ error: error.message });
 *   }
 * });
 */

export async function handleStripeWebhook(
  body: string | Buffer,
  signature: string
): Promise<void> {
  // Verify webhook signature
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

/**
 * Handle successful payment checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    // Extract metadata
    const metadata = session.metadata as unknown as PaymentMetadata;
    const { userId, packId, credits } = metadata;

    if (!userId || !credits) {
      throw new Error('Missing required metadata: userId or credits');
    }

    console.log(`Processing payment for user ${userId}: ${credits} credits`);

    // Update user credits in database via Supabase
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('Could not fetch existing credits:', fetchError);
    }

    const newBalance = (userCredits?.balance || 0) + parseInt(credits);
    const newTotalEarned = (userCredits?.total_earned || 0) + parseInt(credits);

    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.warn('Warning: Could not update credits, but transaction logged:', updateError);
    }

    // Log transaction for audit trail
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: parseInt(credits),
      type: 'purchase',
      description: `Purchased ${packId} pack`,
      stripe_session_id: session.id,
      created_at: new Date().toISOString()
    }).catch(e => console.warn('Could not log transaction:', e));

    console.log(`Successfully awarded ${credits} credits to user ${userId}`);
  } catch (error: any) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}

/**
 * Handle refunded charges (optional)
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  try {
    const sessionId = charge.payment_intent as string;
    console.log(`Processing refund for session ${sessionId}`);

    // Find original transaction and reverse credits
    const { data: transaction, error: fetchError } = await supabase
      .from('credit_transactions')
      .select('user_id, amount')
      .eq('stripe_session_id', sessionId)
      .eq('type', 'purchase')
      .single();

    if (fetchError) {
      console.warn('Could not find original transaction for refund:', fetchError);
      return;
    }

    if (transaction) {
      const { user_id, amount } = transaction;
      
      // Deduct credits from user account
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user_id)
        .single();

      const newBalance = Math.max(0, (userCredits?.balance || 0) - amount);
      
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', user_id);

      if (updateError) {
        console.warn('Could not update balance for refund:', updateError);
      }

      // Log refund transaction
      await supabase.from('credit_transactions').insert({
        user_id: user_id,
        amount: -amount,
        type: 'refund',
        description: 'Refund for returned purchase',
        stripe_session_id: sessionId,
        created_at: new Date().toISOString()
      }).catch(e => console.warn('Could not log refund:', e));
    }

    console.log(`Refund processed for session ${sessionId}`);
  } catch (error: any) {
    console.error('Error handling refund:', error);
    throw error;
  }
}

/**
 * Helper function to create a checkout session
 * Call this from your frontend API endpoint
 */
export async function createCheckoutSession(
  userId: string,
  packId: string,
  credits: number,
  price: number,
  customerEmail: string
): Promise<{ sessionId: string; url?: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} AI Ready Credits`,
              description: `Vote and boost your favorite declarations`,
              metadata: {
                credits: credits.toString(),
              },
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/credits`,
      customer_email: customerEmail,
      metadata: {
        userId,
        packId,
        credits: credits.toString(),
      },
    });

    return {
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve session details
 */
export async function getSessionDetails(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Environment variables required:
 * STRIPE_SECRET_KEY - Your Stripe secret key
 * STRIPE_WEBHOOK_SECRET - Webhook signing secret from Stripe
 * FRONTEND_URL - Your app's frontend URL for redirects
 */
