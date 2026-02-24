/**
 * Push Notifications Service for AI Ready Studio
 * 
 * Handles push notifications for:
 * - Video voted for
 * - New seminar added
 * - Declaration approved
 * - Community activity
 * 
 * Supported Platforms:
 * - iOS (APNs via Capacitor)
 * - Android (Firebase Cloud Messaging)
 * - Web (Service Worker Push API)
 */

import { Capacitor } from '@capacitor/core';
import type { PushNotificationSchema } from '@capacitor/push-notifications';

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(): Promise<void> {
  if (!Capacitor.isPluginAvailable('PushNotifications')) {
    console.warn('Push Notifications not available on this platform');
    return;
  }

  try {
    // Register for push notifications
    await registerForPushNotifications();

    // Listen for incoming notifications
    setupNotificationListeners();

    console.log('Push notifications initialized');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
}

/**
 * Register device for push notifications
 */
async function registerForPushNotifications(): Promise<void> {
  try {
    let permStatus = 'granted';

    // Check permissions (iOS)
    if (Capacitor.getPlatform() === 'ios') {
      const permission = await Capacitor.Plugins.PushNotifications.checkPermissions();
      permStatus = permission.receive || 'denied';

      if (permStatus === 'denied') {
        const request = await Capacitor.Plugins.PushNotifications.requestPermissions();
        permStatus = request.receive;
      }
    }

    if (permStatus === 'granted') {
      // Get device token
      const token = await Capacitor.Plugins.PushNotifications.getDeliveryTokens();
      console.log('Device tokens:', token);

      // Send token to backend for storing
      await saveDeviceToken(token);
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
}

/**
 * Save device token to backend
 */
async function saveDeviceToken(token: any): Promise<void> {
  try {
    await fetch('/api/notifications/register-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: Capacitor.getPlatform(),
        token: token.ios?.token || token.android?.token,
      }),
    });
  } catch (error) {
    console.error('Failed to save device token:', error);
  }
}

/**
 * Setup notification listeners
 */
function setupNotificationListeners(): void {
  // Handle notification when app is in foreground
  Capacitor.Plugins.PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      handleNotificationReceived(notification);
    }
  );

  // Handle notification action (when user taps notification)
  Capacitor.Plugins.PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification: PushNotificationSchema) => {
      handleNotificationTapped(notification);
    }
  );
}

/**
 * Handle incoming notification
 */
function handleNotificationReceived(notification: PushNotificationSchema): void {
  const { title, body, data } = notification;

  console.log('Notification received:', { title, body });

  // Show local notification if app is in foreground
  showLocalNotification(title || '', body || '', data);
}

/**
 * Handle notification tap/action
 */
function handleNotificationTapped(notification: PushNotificationSchema): void {
  const data = notification.data as any;

  // Route to appropriate screen
  if (data?.type === 'vote') {
    window.location.href = `/gallery?video=${data.videoId}`;
  } else if (data?.type === 'seminar') {
    window.location.href = `/events`;
  } else if (data?.type === 'declaration') {
    window.location.href = `/dashboard`;
  }
}

/**
 * Show local notification
 */
function showLocalNotification(
  title: string,
  body: string,
  data?: any
): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png',
      tag: data?.type || 'default',
      data,
    });
  }
}

/**
 * Request notification permissions (Web)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send notification event to user
 * Call this from backend when specific events occur
 */
export async function notifyUser(userId: string, event: NotificationEvent): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event }),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Notification event types
 */
export interface NotificationEvent {
  type: 'vote' | 'seminar' | 'declaration' | 'follow' | 'comment';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Pre-defined notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  videoVoted: (userName: string, votes: number): NotificationEvent => ({
    type: 'vote',
    title: '🎉 Your Video Got Voted!',
    body: `${userName} just voted for your declaration! (${votes} total votes)`,
    data: { notificationType: 'vote' },
  }),

  newSeminar: (seminarName: string, date: string): NotificationEvent => ({
    type: 'seminar',
    title: '📚 New Seminar Added',
    body: `${seminarName} on ${date}. Register now!`,
    data: { notificationType: 'seminar' },
  }),

  declarationApproved: (): NotificationEvent => ({
    type: 'declaration',
    title: '✅ Declaration Approved!',
    body: 'Your declaration is now live and earning votes!',
    data: { notificationType: 'declaration' },
  }),

  declarationEarned: (credits: number): NotificationEvent => ({
    type: 'declaration',
    title: `💰 Earned ${credits} Credits!`,
    body: 'You earned credits for submitting your declaration.',
    data: { notificationType: 'earned' },
  }),

  newFollower: (userName: string): NotificationEvent => ({
    type: 'follow',
    title: '👤 New Follower',
    body: `${userName} is now following you!`,
    data: { notificationType: 'follow' },
  }),
};

/**
 * Unsubscribe from notifications
 */
export async function unsubscribeFromNotifications(): Promise<void> {
  try {
    await Capacitor.Plugins.PushNotifications.removeAllListeners();
    console.log('Unsubscribed from push notifications');
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
  }
}
