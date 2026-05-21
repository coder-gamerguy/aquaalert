    // server.js — AquaAlert Tamale Backend
    require('dotenv').config();
    const express = require('express');
    const http = require('http');
    const { Server } = require('socket.io');
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    const rateLimit = require('express-rate-limit');
    const cron = require('node-cron');

    const zonesRouter = require('./routes/zones');
    const alertsRouter = require('./routes/alerts');
    const subscribersRouter = require('./routes/subscribers');
    const scheduleRouter = require('./routes/schedule');
    const authRouter = require('./routes/auth');
    const broadcastRouter = require('./routes/broadcast');
    const { checkScheduledSupply } = require('./services/scheduleService');
    const logger = require('./utils/logger');

    const app = express();
    const server = http.createServer(app);

  // WebSocket for real-time operator dashboard
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://aquaalert-drab.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

    // Make io available to routes
    app.set('io', io);

   // Security middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://aquaalert-drab.vercel.app'
  ],
  credentials: true
}));
    app.use(express.json());
    app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: { error: 'Too many requests, please try again later.' },
    });
    app.use('/api/', limiter);

    // Stricter limit for SMS-triggering endpoints
    const smsLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      message: { error: 'Subscribe limit reached. Try again in an hour.' },
    });
    app.use('/api/subscribers', smsLimiter);

    // Routes
    app.use('/api/auth', authRouter);
    app.use('/api/zones', zonesRouter);
    app.use('/api/alerts', alertsRouter);
    app.use('/api/subscribers', subscribersRouter);
    app.use('/api/schedule', scheduleRouter);
    app.use('/api/broadcast', broadcastRouter);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'AquaAlert Tamale API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // Scheduled jobs — check supply schedule every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.info('Running scheduled supply check...');
      await checkScheduledSupply(io);
    });

    // WebSocket events
    io.on('connection', (socket) => {
      logger.info(`Operator dashboard connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`Dashboard disconnected: ${socket.id}`);
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      });
    });

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`AquaAlert API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    module.exports = { app, server };
