/**
 * AI Ready Studio Backend API Server
 * Main Express application
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import { config } from './config.js';
import stripeRoutes from './routes/stripe.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import errorsRoutes from './routes/errors.routes.js';
import ogRoutes from './routes/og.routes.js';
import voteRoutes from './routes/votes.routes.js';
import { verifyDatabaseSchema } from './db/schema-check.js';

const app: Express = express();

// Middleware for raw body (needed for Stripe webhooks)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/webhooks/stripe') {
    // Store raw body for Stripe webhook verification
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString('utf8');
    });
    req.on('end', () => {
      (req as any).rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

// Standard middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Rate limiter for health endpoint to prevent abuse of schema checks
const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 health checks per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get('/health', healthRateLimiter, async (req: Request, res: Response) => {
  const base = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    const schemaStatus = await verifyDatabaseSchema();
    return res.json({
      ...base,
      schemaStatus,
    });
  } catch (error: any) {
    return res.status(500).json({
      ...base,
      status: 'error',
      schemaStatus: {
        ok: false,
        missingTables: [],
        expectedTables: [],
        foundTables: [],
        checkedAt: new Date().toISOString(),
        error: error?.message || 'Schema verification failed',
      },
    });
  }
});

// API Routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/og', ogRoutes);
app.use('/api/votes', voteRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'AI Ready Studio Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      stripe: '/api/stripe/*',
      notifications: '/api/notifications/*',
      errors: '/api/errors/*',
      og: '/api/og/*',
      votes: '/api/votes',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = config.PORT as number;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 AI Ready Studio Backend API                        ║
║  Server running at http://localhost:${PORT}                ║
║  Environment: ${config.NODE_ENV}                          ║
║  Frontend: ${config.FRONTEND_URL}            ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
