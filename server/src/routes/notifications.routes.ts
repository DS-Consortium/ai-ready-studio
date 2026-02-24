/**
 * Notifications API Routes
 */
import { Router, Request, Response } from 'express';
import {
  registerDeviceToken,
  sendNotificationToUser,
  notificationTemplates,
} from '../services/firebase.service.js';

const router = Router();

/**
 * POST /api/notifications/register-device
 * Register device for push notifications
 */
router.post('/register-device', async (req: Request, res: Response) => {
  try {
    const { userId, token, platform } = req.body;

    if (!userId || !token || !platform) {
      return res.status(400).json({
        error: 'Missing required fields: userId, token, platform',
      });
    }

    await registerDeviceToken(userId, token, platform);

    res.json({
      success: true,
      message: 'Device registered for notifications',
    });
  } catch (error: any) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/send
 * Send notification to user
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { userId, templateType, data } = req.body;

    if (!userId || !templateType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, templateType',
      });
    }

    // Get template
    const templates = notificationTemplates as Record<string, Function>;
    const template = templates[templateType];

    if (!template) {
      return res.status(400).json({
        error: `Unknown notification template: ${templateType}`,
      });
    }

    // Generate notification content
    const notification = template(...(data?.args || []));

    // Send to user
    const sentCount = await sendNotificationToUser(
      userId,
      notification.title,
      notification.body,
      notification.data
    );

    res.json({
      success: true,
      sentCount,
      message: `Notification sent to ${sentCount} device(s)`,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
