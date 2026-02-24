/**
 * Direct Seminar Booking with Credits
 * 
 * Allow users to book seminars directly within the app
 * Using credits to pay or discount registrations
 */

import { supabase } from '@/lib/supabase';

/**
 * Seminar booking configuration
 */
export interface SeminarBooking {
  seminarId: string;
  userId: string;
  bookingType: 'credits' | 'stripe' | 'free';
  creditsUsed?: number;
  discountAmount?: number;
  finalPrice?: number;
  bookingDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

/**
 * Seminar pricing configuration
 */
export const SEMINAR_PRICING = {
  creditDiscount: 0.1, // 10% discount if paying with credits
  creditsPerDollar: 50, // Conversion rate
};

/**
 * Get seminar details with pricing
 */
export async function getSeminarDetails(seminarId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('seminars')
      .select('*')
      .eq('id', seminarId)
      .single();

    if (error) throw error;

    return {
      ...data,
      creditsRequired: Math.ceil(data.price * SEMINAR_PRICING.creditsPerDollar),
      creditsWithDiscount: Math.ceil(
        data.price *
          SEMINAR_PRICING.creditsPerDollar *
          (1 - SEMINAR_PRICING.creditDiscount)
      ),
    };
  } catch (error) {
    console.error('Failed to get seminar details:', error);
    throw error;
  }
}

/**
 * Book seminar using credits
 */
export async function bookSeminarWithCredits(
  seminarId: string,
  userId: string
): Promise<{ success: boolean; message: string; bookingId?: string }> {
  try {
    // Get seminar details
    const seminar = await getSeminarDetails(seminarId);

    // Get user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const creditsNeeded = seminar.creditsWithDiscount;
    const userCredits = user?.credits || 0;

    if (userCredits < creditsNeeded) {
      return {
        success: false,
        message: `Insufficient credits. You need ${creditsNeeded}, you have ${userCredits}`,
      };
    }

    // Deduct credits
    const newBalance = userCredits - creditsNeeded;
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('seminar_bookings')
      .insert({
        seminar_id: seminarId,
        user_id: userId,
        booking_type: 'credits',
        credits_used: creditsNeeded,
        discount_amount: seminar.price * SEMINAR_PRICING.creditDiscount,
        final_price: seminar.price * (1 - SEMINAR_PRICING.creditDiscount),
        status: 'confirmed',
        booking_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -creditsNeeded,
      type: 'seminar_booking',
      description: `Booked seminar: ${seminar.title}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully booked ${seminar.title}! ${creditsNeeded} credits deducted.`,
      bookingId: booking.id,
    };
  } catch (error) {
    console.error('Failed to book seminar:', error);
    return { success: false, message: 'Failed to book seminar' };
  }
}

/**
 * Book seminar with Stripe
 */
export async function bookSeminarWithStripe(
  seminarId: string,
  userId: string
): Promise<{ success: boolean; sessionId?: string; message: string }> {
  try {
    const seminar = await getSeminarDetails(seminarId);

    // Create Stripe checkout session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        seminarId,
        price: seminar.price,
        title: seminar.title,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    return {
      success: true,
      sessionId,
      message: 'Redirecting to payment...',
    };
  } catch (error) {
    console.error('Failed to book with Stripe:', error);
    return { success: false, message: 'Failed to process payment' };
  }
}

/**
 * Get user's booked seminars
 */
export async function getUserBookedSeminars(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('seminar_bookings')
      .select('*, seminars(*)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to get booked seminars:', error);
    return [];
  }
}

/**
 * Cancel seminar booking and refund credits
 */
export async function cancelSeminarBooking(
  bookingId: string,
  userId: string
): Promise<{ success: boolean; message: string; creditsRefunded?: number }> {
  try {
    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('seminar_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    if (booking.status === 'cancelled') {
      return { success: false, message: 'Booking already cancelled' };
    }

    // Refund credits
    const creditsToRefund = booking.credits_used || 0;

    if (creditsToRefund > 0) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newBalance = (user?.credits || 0) + creditsToRefund;

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log refund transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: creditsToRefund,
        type: 'booking_refund',
        description: 'Seminar booking cancelled',
        timestamp: new Date().toISOString(),
      });
    }

    // Update booking status
    const { error: cancelError } = await supabase
      .from('seminar_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (cancelError) throw cancelError;

    return {
      success: true,
      message: 'Booking cancelled. Credits refunded.',
      creditsRefunded: creditsToRefund,
    };
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    return { success: false, message: 'Failed to cancel booking' };
  }
}

/**
 * Check if user is registered for seminar
 */
export async function isUserRegisteredForSeminar(
  seminarId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('seminar_bookings')
      .select('id')
      .eq('seminar_id', seminarId)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .single();

    if (error && error.code === 'PGRST116') {
      return false; // Not registered
    }

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Failed to check registration:', error);
    return false;
  }
}

/**
 * Get available seminars
 */
export async function getAvailableSeminars(): Promise<any[]> {
  try {
    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('seminars')
      .select('*')
      .gt('date', today)
      .order('date', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to get available seminars:', error);
    return [];
  }
}

/**
 * Database schema
 *
 * CREATE TABLE seminars (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title VARCHAR NOT NULL,
 *   description TEXT,
 *   date TIMESTAMP NOT NULL,
 *   location VARCHAR NOT NULL,
 *   price DECIMAL(10, 2) NOT NULL,
 *   max_capacity INT,
 *   current_registrations INT DEFAULT 0,
 *   image_url VARCHAR,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE TABLE seminar_bookings (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   seminar_id UUID REFERENCES seminars(id) ON DELETE CASCADE,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   booking_type VARCHAR NOT NULL,
 *   credits_used INT,
 *   discount_amount DECIMAL(10, 2),
 *   final_price DECIMAL(10, 2),
 *   status VARCHAR DEFAULT 'pending',
 *   booking_date TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_bookings_user ON seminar_bookings(user_id);
 * CREATE INDEX idx_bookings_seminar ON seminar_bookings(seminar_id);
 */

/**
 * React component integration example:
 *
 * import { bookSeminarWithCredits, getSeminarDetails } from '@/lib/seminar-booking';
 *
 * export function SeminarBookingButton({ seminarId }: { seminarId: string }) {
 *   const { user } = useUser();
 *   const [loading, setLoading] = useState(false);
 *   const [seminar, setSeminar] = useState<any>(null);
 *
 *   useEffect(() => {
 *     getSeminarDetails(seminarId).then(setSeminar);
 *   }, [seminarId]);
 *
 *   const handleBook = async () => {
 *     setLoading(true);
 *     const result = await bookSeminarWithCredits(seminarId, user?.id!);
 *     if (result.success) {
 *       // Show success toast and redirect
 *     } else {
 *       // Show error toast
 *     }
 *     setLoading(false);
 *   };
 *
 *   return (
 *     <Button onClick={handleBook} disabled={loading}>
 *       Book with {seminar?.creditsWithDiscount} Credits
 *     </Button>
 *   );
 * }
 */
