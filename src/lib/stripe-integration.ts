/**
 * Stripe Payment Integration for Voting Credits
 * Frontend integration with backend API
 */

export interface StripeCheckoutConfig {
  userId: string;
  credits: number;
  price: number;
  customerEmail: string;
  packId?: string;
  description?: string;
}

/**
 * Get API URL from environment or defaults to localhost
 */
function getApiUrl(): string {
  if (typeof window !== 'undefined' && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to backend at same domain on port 3000
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

/**
 * Initiate Stripe checkout for credit purchase
 */
export const initiateStripeCheckout = async (
  config: StripeCheckoutConfig
): Promise<{ url: string; sessionId: string }> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No checkout URL returned from server');
    }

    return {
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    throw error;
  }
};

/**
 * Verify payment completion
 */
export const verifyPaymentCompletion = async (
  sessionId: string
): Promise<{ status: string; success: boolean }> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/stripe/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return {
      status: data.status || 'unknown',
      success: data.status === 'paid',
    };
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    throw error;
  }
};

/**
 * Format price for Stripe (convert to cents)
 */
export const formatPrice = (price: number): number => {
  return Math.round(price * 100);
};

/**
 * Get payment status from URL params
 */
export const getPaymentStatus = (): { status?: string; sessionId?: string } => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get('payment_status') || undefined,
    sessionId: params.get('session_id') || undefined,
  };
};
