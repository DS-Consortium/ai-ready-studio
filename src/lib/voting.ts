import { supabase } from '@/integrations/supabase/client';

export interface VoteRecord {
  id: string;
  video_id: string;
  user_id: string;
  amount: number; // Represents the number of "points" or "credits" used
  created_at: string;
}

export interface VideoLeaderboard {
  video_id: string;
  title: string;
  total_votes: number;
  total_amount: number; // Total points/credits cast
  user_id: string;
  created_at: string;
}

/**
 * Gaming-style Paid Voting System
 * Users cast "points" or "credits" which they purchase.
 */

/**
 * Get user's current voting credit balance from their profile
 */
export async function getUserBalance(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('profiles')
      .select('voting_credits')
      .eq('id', user.id)
      .single();

    if (error) {
      // If column doesn't exist yet, we'll return 0
      console.warn('Credits column might be missing, check migrations.');
      return 0;
    }
    return data?.voting_credits || 0;
  } catch (error) {
    console.error('Balance fetch error:', error);
    return 0;
  }
}

/**
 * Submit a paid vote using credits (Gaming model)
 */
export async function submitVote(videoId: string, points: number): Promise<VoteRecord | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const balance = await getUserBalance();
    if (balance < points) {
      throw new Error(`Insufficient credits. You have ${balance} but need ${points}.`);
    }

    // Use a RPC call to ensure atomicity (deduct credits and insert vote)
    const { data, error } = await supabase.rpc('cast_paid_vote', {
      p_video_id: videoId,
      p_user_id: user.id,
      p_points: points
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Vote submission error:', error);
    throw error;
  }
}

/**
 * Get leaderboard for a specific filter category
 */
export async function getLeaderboard(filter: string, limit: number = 10): Promise<VideoLeaderboard[]> {
  try {
    const { data, error } = await supabase
      .from('video_leaderboard')
      .select('*')
      .eq('filter', filter)
      .order('total_amount', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Purchase credits (Simulation for the gaming model)
 */
export async function purchaseCredits(amount: number, points: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('add_voting_credits', {
      p_user_id: user.id,
      p_points: points,
      p_amount: amount
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Purchase error:', error);
    return false;
  }
}
