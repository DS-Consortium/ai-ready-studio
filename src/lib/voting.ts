import { supabase } from '@/integrations/supabase/client';

export interface VoteRecord {
  id: string;
  video_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface VideoLeaderboard {
  video_id: string;
  title: string;
  total_votes: number;
  total_amount: number;
  user_id: string;
  created_at: string;
}

/**
 * Submit a paid vote for a video
 */
export async function submitVote(videoId: string, amount: number): Promise<VoteRecord | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('votes')
      .insert({
        video_id: videoId,
        user_id: user.id,
        amount,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Vote submission error:', error);
    return null;
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
 * Get total votes for a specific video
 */
export async function getVideoVoteCount(videoId: string): Promise<{ count: number; amount: number }> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('amount')
      .eq('video_id', videoId);

    if (error) throw error;

    const count = data?.length || 0;
    const amount = data?.reduce((sum, vote) => sum + vote.amount, 0) || 0;

    return { count, amount };
  } catch (error) {
    console.error('Vote count error:', error);
    return { count: 0, amount: 0 };
  }
}

/**
 * Check if user has already voted for this video
 */
export async function hasUserVoted(videoId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Vote check error:', error);
    return false;
  }
}

/**
 * Get user's voting history
 */
export async function getUserVotingHistory(): Promise<VoteRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Voting history error:', error);
    return [];
  }
}
