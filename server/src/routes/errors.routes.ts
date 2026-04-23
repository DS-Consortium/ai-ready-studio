/**
 * Client error reporting route
 */
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/report', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.warn('📌 Client error report received:', JSON.stringify(payload, null, 2));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling client report:', error);
    res.status(500).json({ error: error.message || 'Failed to report error' });
  }
});

export default router;
