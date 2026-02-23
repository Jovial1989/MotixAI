import 'dotenv/config';
import app from './app';
import { logger } from './config/logger';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 HammerAI API running on http://localhost:${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received – shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
