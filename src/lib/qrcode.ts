import QRCode from 'qrcode';

const QR_CONFIG = {
  environment: import.meta.env.VITE_QR_ENVIRONMENT || 'production',
  baseUrls: {
    production: import.meta.env.VITE_QR_BASE_URL_PROD || 'https://aiready.dsconsortium.org',
    staging: import.meta.env.VITE_QR_BASE_URL_STAGING || 'https://staging.aiready.dsconsortium.org',
    development: import.meta.env.VITE_QR_BASE_URL_DEV || 'http://localhost:5173',
  },
};

/**
 * Generate QR code for a video
 */
export async function generateVideoQRCode(videoId: string): Promise<string> {
  try {
    const baseUrl = QR_CONFIG.baseUrls[QR_CONFIG.environment as keyof typeof QR_CONFIG.baseUrls];
    const videoUrl = `${baseUrl}/video/${videoId}`;

    const qrCode = await QRCode.toDataURL(videoUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCode;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
}

/**
 * Generate QR code for event registration
 */
export async function generateEventQRCode(eventId: string): Promise<string> {
  try {
    const baseUrl = QR_CONFIG.baseUrls[QR_CONFIG.environment as keyof typeof QR_CONFIG.baseUrls];
    const eventUrl = `${baseUrl}/events/${eventId}`;

    const qrCode = await QRCode.toDataURL(eventUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    return qrCode;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
}

/**
 * Generate QR code for user profile
 */
export async function generateProfileQRCode(userId: string): Promise<string> {
  try {
    const baseUrl = QR_CONFIG.baseUrls[QR_CONFIG.environment as keyof typeof QR_CONFIG.baseUrls];
    const profileUrl = `${baseUrl}/profile/${userId}`;

    const qrCode = await QRCode.toDataURL(profileUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    return qrCode;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
}

/**
 * Get current QR environment
 */
export function getQREnvironment() {
  return {
    environment: QR_CONFIG.environment,
    baseUrl: QR_CONFIG.baseUrls[QR_CONFIG.environment as keyof typeof QR_CONFIG.baseUrls],
  };
}

/**
 * Validate QR configuration
 */
export function validateQRConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!QR_CONFIG.baseUrls.production) missing.push('VITE_QR_BASE_URL_PROD');
  if (!QR_CONFIG.baseUrls.staging) missing.push('VITE_QR_BASE_URL_STAGING');

  return {
    valid: missing.length === 0,
    missing,
  };
}
