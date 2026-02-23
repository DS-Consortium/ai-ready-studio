-- Add voting_credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voting_credits INTEGER DEFAULT 0;

-- Create credits transaction log
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2),
    points_added INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to add credits
CREATE OR REPLACE FUNCTION add_voting_credits(p_user_id UUID, p_points INTEGER, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET voting_credits = voting_credits + p_points
    WHERE id = p_user_id;

    INSERT INTO credit_transactions (user_id, amount_paid, points_added)
    VALUES (p_user_id, p_amount, p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cast a paid vote (atomic)
CREATE OR REPLACE FUNCTION cast_paid_vote(p_video_id UUID, p_user_id UUID, p_points INTEGER)
RETURNS JSON AS $$
DECLARE
    current_balance INTEGER;
    new_vote_id UUID;
BEGIN
    SELECT voting_credits INTO current_balance FROM profiles WHERE id = p_user_id;
    
    IF current_balance < p_points THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct credits
    UPDATE profiles SET voting_credits = voting_credits - p_points WHERE id = p_user_id;

    -- Insert vote
    INSERT INTO votes (video_id, user_id, amount)
    VALUES (p_video_id, p_user_id, p_points)
    RETURNING id INTO new_vote_id;

    RETURN json_build_object('id', new_vote_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
