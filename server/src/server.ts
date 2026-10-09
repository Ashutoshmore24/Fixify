import http from 'http';
import { createApp } from './app';
import { env } from './common/config/env';
import { connectDatabase, disconnectDatabase } from './common/database/connection';
import { initSocketServer } from './common/socket/socket.server';
import { initEscalationCron } from './modules/tickets/escalation.cron';
import { logger } from './common/utils/logger';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Initialize Express Application
    const app = createApp();
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.IO Server
    initSocketServer(httpServer);

    // 4. Initialize Escalation Cron Job
    initEscalationCron();

    // 5. Start Listening
    httpServer.listen(env.PORT, () => {
      logger.info(`Fixify Server running on ${env.SERVER_URL} [Environment: ${env.NODE_ENV}]`);
      logger.info(`Allowed institutional domains: [${env.allowedDomainsList.join(', ')}]`);
    });

    // 5. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      httpServer.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed, database connection terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(error, 'Fatal error during server startup');
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}
