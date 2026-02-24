/**
 * Stripe Payment Integration for Voting Credits
 * 
 * This module handles credit purchases via Stripe.
 * Should be integrated with a backend endpoint that creates Stripe checkout sessions.
 */

export interface StripeCheckoutConfig {
  packId: string;
  credits: number;
  price: number;
  customerEmail?: string;
  userId?: string;
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url?: string;
}

/**
 * Initialize Stripe checkout for credit purchase
 * Backend should handle the actual Stripe API calls
 */
export const initiateStripeCheckout = async (
  config: StripeCheckoutConfig
): Promise<StripeCheckoutResponse> => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packId: config.packId,
        credits: config.credits,
        price: config.price,
        customerEmail: config.customerEmail,
        userId: config.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

/**
 * Handle successful payment webhook from Stripe
 * This would be called by backend when Stripe sends a checkout.session.completed event
 */
export const handleStripePaymentSuccess = async (
  userId: string,
  sessionId: string,
  creditsAwarded: number
) => {
  try {
    const response = await fetch('/api/stripe/handle-payment-success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sessionId,
        creditsAwarded,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Retrieve payment history for a user
 */
export const getUserPaymentHistory = async (userId: string) => {
  try {
    const response = await fetch(`/api/stripe/payment-history/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment history error:', error);
    throw error;
  }
};

/**
 * Cancel a pending/incomplete payment
 */
export const cancelPayment = async (sessionId: string) => {
  try {
    const response = await fetch('/api/stripe/cancel-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Cancel payment error:', error);
    throw error;
  }
};
