/**
 * Referral Credits System
 * 
 * Allow users to earn credits by inviting other leaders
 * - Generate unique referral codes
 * - Track referral stats
 * - Award credits on successful referral
 */

import { supabase } from '@/lib/supabase';

/**
 * Referral reward structure
 */
export const REFERRAL_REWARDS = {
  referrerCredits: 50, // Credits for person making referral
  refereeCredits: 25, // Bonus for new user entering code
  referralBonus: 25, // Additional bonus after referee completes declaration
};

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(userId: string): Promise<string> {
  try {
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return existing.code;
    }

    // Generate new code: [first 3 letters of name]-[4 random chars]-[user id first 4]
    const code = generateCode();

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data.code;
  } catch (error) {
    console.error('Failed to generate referral code:', error);
    throw error;
  }
}

/**
 * Generate random referral code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get user's referral code
 */
export async function getUserReferralCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.code || null;
  } catch (error) {
    console.error('Failed to get referral code:', error);
    return null;
  }
}

/**
 * Redeem a referral code as a new user
 */
export async function redeemReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; creditsAwarded?: number }> {
  try {
    // Find the referrer
    const { data: referralData, error: referralError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single();

    if (referralError || !referralData) {
      return { success: false, message: 'Invalid referral code' };
    }

    const referrerId = referralData.user_id;

    // Check if new user already has a referrer
    const { data: existingReferral } = await supabase
      .from('referral_history')
      .select('referrer_id')
      .eq('referee_id', newUserId)
      .single();

    if (existingReferral) {
      return { success: false, message: 'You already have a referrer' };
    }

    // Record the referral
    const { error: historyError } = await supabase
      .from('referral_history')
      .insert({
        referrer_id: referrerId,
        referee_id: newUserId,
        redeemed_at: new Date().toISOString(),
      });

    if (historyError) throw historyError;

    // Award credits to new user
    await awardReferralCredits(newUserId, REFERRAL_REWARDS.refereeCredits, 'referral_signup');

    // Award credits to referrer
    await awardReferralCredits(referrerId, REFERRAL_REWARDS.referrerCredits, 'referral_success');

    return {
      success: true,
      message: `Welcome! You earned ${REFERRAL_REWARDS.refereeCredits} credits`,
      creditsAwarded: REFERRAL_REWARDS.refereeCredits,
    };
  } catch (error) {
    console.error('Failed to redeem referral code:', error);
    return { success: false, message: 'Failed to redeem referral code' };
  }
}

/**
 * Award credits for referral activity
 */
async function awardReferralCredits(
  userId: string,
  amount: number,
  type: 'referral_signup' | 'referral_success' | 'referral_bonus'
): Promise<void> {
  try {
    // Get current credits
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Update credits
    const newBalance = (user?.credits || 0) + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      type: 'referral_award',
      description: getTransactionDescription(type),
      timestamp: new Date().toISOString(),
    });

    console.log(`Awarded ${amount} credits to user ${userId} for ${type}`);
  } catch (error) {
    console.error('Failed to award referral credits:', error);
  }
}

/**
 * Get transaction description
 */
function getTransactionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    referral_signup: 'Welcome bonus - referral code redeemed',
    referral_success: 'Referral bonus - new user joined',
    referral_bonus: 'Referral bonus - referee completed declaration',
  };
  return descriptions[type] || 'Referral reward';
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  try {
    // Get referral code
    const referralCode = await getUserReferralCode(userId);

    // Get number of successful referrals
    const { data: referrals, error: referralError } = await supabase
      .from('referral_history')
      .select('id, redeemed_at')
      .eq('referrer_id', userId);

    if (referralError) throw referralError;

    // Calculate total credits earned from referrals
    const totalCreditsEarned =
      (referrals?.length || 0) * REFERRAL_REWARDS.referrerCredits;

    return {
      referralCode: referralCode || undefined,
      totalReferrals: referrals?.length || 0,
      totalCreditsEarned,
      referralReward: REFERRAL_REWARDS.referrerCredits,
      refereeBonus: REFERRAL_REWARDS.refereeCredits,
    };
  } catch (error) {
    console.error('Failed to get referral stats:', error);
    return null;
  }
}

/**
 * Get referral code URL for sharing
 */
export function getReferralURL(referralCode: string): string {
  const baseURL = process.env.REACT_APP_BASE_URL || 'https://aireadystudio.com';
  return `${baseURL}?ref=${referralCode}`;
}

/**
 * Share referral code on social media
 */
export function shareReferralCode(referralCode: string, userName: string): void {
  const message = `Join me on AI Ready Studio! Use my referral code ${referralCode} to earn free credits. ${getReferralURL(referralCode)}`;

  // Create share menu
  const options = [
    {
      platform: 'twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    },
    {
      platform: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getReferralURL(referralCode))}`,
    },
    {
      platform: 'linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getReferralURL(referralCode))}`,
    },
    {
      platform: 'whatsapp',
      url: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
  ];

  return options as any;
}

/**
 * Database schema for referral system
 *
 * -- Create referral_codes table
 * CREATE TABLE referral_codes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   code VARCHAR(10) UNIQUE NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
 * CREATE INDEX idx_referral_codes_code ON referral_codes(code);
 *
 * -- Create referral_history table
 * CREATE TABLE referral_history (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   redeemed_at TIMESTAMP DEFAULT NOW(),
 *   UNIQUE(referrer_id, referee_id)
 * );
 *
 * CREATE INDEX idx_referral_history_referrer ON referral_history(referrer_id);
 * CREATE INDEX idx_referral_history_referee ON referral_history(referee_id);
 */

interface ReferralStats {
  referralCode?: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  referralReward: number;
  refereeBonus: number;
}
