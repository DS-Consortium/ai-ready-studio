import { supabase } from '@/integrations/supabase/client';

const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/google`,
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/linkedin`,
  },
};

/**
 * Initiate Google OAuth sign-in
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_CONFIG.google.redirectUri,
        scopes: 'profile email',
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
}

/**
 * Initiate LinkedIn OAuth sign-in
 */
export async function signInWithLinkedIn() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
      options: {
        redirectTo: OAUTH_CONFIG.linkedin.redirectUri,
        scopes: 'profile email',
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return null;
  }
}

/**
 * Get OAuth configuration
 */
export function getOAuthConfig() {
  return OAUTH_CONFIG;
}

/**
 * Validate OAuth environment variables
 */
export function validateOAuthConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!OAUTH_CONFIG.google.clientId) missing.push('VITE_GOOGLE_CLIENT_ID');
  if (!OAUTH_CONFIG.linkedin.clientId) missing.push('VITE_LINKEDIN_CLIENT_ID');

  return {
    valid: missing.length === 0,
    missing,
  };
}
