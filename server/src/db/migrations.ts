/**
 * Database Migrations
 * Run this to set up all required tables
 */
import { supabase } from './supabase.js';

export async function runMigrations() {
  console.log('🔧 Starting database migrations...');

  try {
    // 1. Device Tokens table
    console.log('Creating device_tokens table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS device_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          platform VARCHAR(20) NOT NULL DEFAULT 'web',
          created_at TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
      `,
    });

    // 2. Credit Transactions table
    console.log('Creating credit_transactions table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          amount INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          stripe_session_id VARCHAR(255),
          timestamp TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_timestamp ON credit_transactions(timestamp);
      `,
    });

    // 3. Seminar Bookings table
    console.log('Creating seminar_bookings table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seminar_bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          seminar_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          booking_type VARCHAR(20) NOT NULL,
          credits_used INT,
          discount_amount DECIMAL(10, 2),
          final_price DECIMAL(10, 2),
          status VARCHAR(20) DEFAULT 'pending',
          booking_date TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_seminar_bookings_user_id ON seminar_bookings(user_id);
        CREATE INDEX IF NOT EXISTS idx_seminar_bookings_seminar_id ON seminar_bookings(seminar_id);
      `,
    });

    // 4. Readiness Scores table
    console.log('Creating readiness_scores table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS readiness_scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          video_id UUID,
          overall_score INT,
          clarity INT,
          confidence INT,
          articulation INT,
          pacing INT,
          keyword_relevance INT,
          transcription TEXT,
          keywords TEXT[],
          insights TEXT[],
          recommendations TEXT[],
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_readiness_scores_user_id ON readiness_scores(user_id);
        CREATE INDEX IF NOT EXISTS idx_readiness_scores_video_id ON readiness_scores(video_id);
      `,
    });

    // 5. Referral Codes table
    console.log('Creating referral_codes table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS referral_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          code VARCHAR(10) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
        CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
      `,
    });

    // 6. Referral History table
    console.log('Creating referral_history table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS referral_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          redeemed_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(referrer_id, referee_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_referral_history_referrer ON referral_history(referrer_id);
        CREATE INDEX IF NOT EXISTS idx_referral_history_referee ON referral_history(referee_id);
      `,
    });

    // 7. Video Records table
    console.log('Creating video_records table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS video_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          video_url TEXT NOT NULL,
          title VARCHAR(255),
          description TEXT,
          theme VARCHAR(100),
          watermarked BOOLEAN DEFAULT true,
          watermark_config JSONB,
          votes INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_video_records_user_id ON video_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_video_records_created_at ON video_records(created_at);
      `,
    });

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(console.error);
}
