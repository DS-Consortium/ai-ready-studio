/**
 * Environment configuration
 */

export const config = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_KEY!,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY!,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,

  // DeepAR
  DEEPAR_SDK_KEY: process.env.DEEPAR_SDK_KEY!,
};

// Validate required env vars
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

for (const varName of requiredVars) {
  if (!config[varName as keyof typeof config]) {
    console.warn(`⚠️  Missing environment variable: ${varName}`);
  }
}
