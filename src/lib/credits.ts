import { supabase } from "@/integrations/supabase/client";

export interface UserCredits {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export const CREDIT_COSTS = {
  VOTE: 1, // 1 credit per standard vote
  POWER_VOTE: 10, // 10 credits for a power vote
};

export const PURCHASE_PACKS = [
  { id: 'pack_small', name: 'Starter Pack', credits: 50, price: 4.99 },
  { id: 'pack_medium', name: 'Leader Pack', credits: 150, price: 12.99 },
  { id: 'pack_large', name: 'Visionary Pack', credits: 500, price: 39.99 },
];

export const getUserCredits = async (userId: string): Promise<UserCredits | null> => {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching credits:', error);
    return null;
  }

  if (!data) {
    // Initialize credits for new user
    const { data: newData, error: initError } = await supabase
      .from('user_credits')
      .insert({ user_id: userId, balance: 10, total_earned: 10 }) // Give 10 starter credits
      .select()
      .single();
    
    if (initError) return null;
    return newData as UserCredits;
  }

  return data as UserCredits;
};

export const spendCredits = async (userId: string, amount: number, reason: string) => {
  const { data: credits, error: fetchError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (fetchError || !credits || credits.balance < amount) {
    throw new Error('Insufficient credits');
  }

  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ 
      balance: credits.balance - amount,
      total_spent: supabase.rpc('increment', { row_id: userId, column_name: 'total_spent', amount })
    })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'spend',
    description: reason
  });

  return true;
};
