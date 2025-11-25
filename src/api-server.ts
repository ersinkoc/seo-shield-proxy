/**
 * API-Only Server - Runs on port 8081
 * Only handles /shieldapi/* endpoints for admin dashboard
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import adminRoutes from './admin/admin-routes';
import configManager from './admin/config-manager';
import { adminRateLimiter } from './middleware/rate-limiter';
import { initializeWebSocket } from './admin/websocket';
import { databaseManager } from './database/database-manager';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.API_PORT || '8190', 10);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS for admin dashboard
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount admin API routes (rate limiting temporarily disabled)
app.use('/shieldapi', adminRoutes);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await databaseManager.healthCheck();
  res.json({
    status: 'ok',
    service: 'seo-shield-api',
    port: PORT,
    timestamp: new Date().toISOString(),
    database: dbHealth.connected ? 'connected' : 'disconnected',
    databaseStats: dbHealth.stats || null
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Path ${req.path} not found on API server`,
    availableEndpoints: ['/health', '/shieldapi/*']
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Initialize database connection
async function initializeDatabase() {
  try {
    const connected = await databaseManager.connect();
    if (connected) {
      console.log('✅ MongoDB storage initialized');

      // Make database manager available to admin routes
      (global as any).databaseManager = databaseManager;
    } else {
      console.warn('⚠️  MongoDB connection failed, falling back to memory-based storage');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Start server
const server = createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Initialize database before starting server
initializeDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                 SEO Shield API Server                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log('🎯 Admin API endpoints: /shieldapi/*');
  console.log('📡 WebSocket endpoint: /socket.io');
  console.log('💚 Health check: /health');
  console.log('');
});
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
  // Still start server even if database fails
  server.listen(PORT, '0.0.0.0', () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                 SEO Shield API Server                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 API Server running on port ${PORT} (Database fallback mode)`);
    console.log('🎯 Admin API endpoints: /shieldapi/*');
    console.log('📡 WebSocket endpoint: /socket.io');
    console.log('💚 Health check: /health');
    console.log('');
  });
});

export default app;