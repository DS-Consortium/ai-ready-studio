/**
 * Firebase Cloud Messaging Service
 * Handles push notifications
 */
import * as admin from 'firebase-admin';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

// Initialize Firebase Admin SDK
if (admin && !admin.apps?.length && config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY && config.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: config.FIREBASE_PROJECT_ID,
        private_key_id: '',
        private_key: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: config.FIREBASE_CLIENT_EMAIL,
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      } as any),
    });
  } catch (error) {
    console.warn('Firebase initialization failed, push notifications will be disabled:', error);
  }
}

export const messaging = admin.messaging();

/**
 * Send push notification to device
 */
export async function sendNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: `${config.FRONTEND_URL}?notification=true`,
        },
      },
    };

    const messageId = await messaging.send(message as any);
    console.log('✅ Notification sent:', messageId);
    return messageId;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Register device token
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android' | 'web'
): Promise<void> {
  try {
    // Check if token already exists
    const { data: existing } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('token', token)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Insert new token
      await supabase.from('device_tokens').insert({
        user_id: userId,
        token,
        platform,
        created_at: new Date().toISOString(),
      });

      console.log(`✅ Device token registered for user ${userId}`);
    }
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
}

/**
 * Send notification to all user devices
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<number> {
  try {
    // Get all device tokens for user
    const { data: devices, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) throw error;

    if (!devices || devices.length === 0) {
      console.log(`No devices found for user ${userId}`);
      return 0;
    }

    // Send to all devices
    let sentCount = 0;
    for (const device of devices) {
      try {
        await sendNotification(device.token, title, body, data);
        sentCount++;
      } catch (err) {
        console.warn(`Failed to send to device ${device.token}:`, err);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    throw error;
  }
}

/**
 * Notification templates
 */
export const notificationTemplates = {
  videoVoted: (voterName: string, totalVotes: number) => ({
    title: '🎉 Your Video Got Voted!',
    body: `${voterName} just voted for your declaration! (${totalVotes} total votes)`,
    data: { type: 'vote', action: 'open_video' },
  }),

  newSeminar: (seminarName: string, date: string) => ({
    title: '📚 New Seminar Added',
    body: `${seminarName} on ${date}. Register now!`,
    data: { type: 'seminar', action: 'open_events' },
  }),

  declarationApproved: () => ({
    title: '✅ Declaration Approved!',
    body: 'Your declaration is now live and earning votes!',
    data: { type: 'declaration', action: 'open_dashboard' },
  }),

  creditsEarned: (credits: number) => ({
    title: `💰 Earned ${credits} Credits!`,
    body: 'You earned credits for submitting your declaration.',
    data: { type: 'credits', amount: credits.toString() },
  }),

  newFollower: (followerName: string) => ({
    title: '👤 New Follower',
    body: `${followerName} is now following you!`,
    data: { type: 'follow', action: 'open_profile' },
  }),
};
