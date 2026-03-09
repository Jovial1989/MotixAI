import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';

// Import all modules EXCEPT JobsModule (BullMQ worker cannot run on Vercel serverless)
import { AuthModule } from '../src/api/auth/auth.module';
import { GuidesModule } from '../src/api/guides/guides.module';
import { EnterpriseModule } from '../src/api/enterprise/enterprise.module';
import { HealthModule } from '../src/api/health/health.module';
import { StepsModule } from '../src/api/steps/steps.module';
import { PrismaModule } from '../src/infrastructure/prisma/prisma.module';
import { AiModule } from '../src/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    GuidesModule,
    EnterpriseModule,
    HealthModule,
    StepsModule,
    // JobsModule intentionally excluded — BullMQ Redis worker cannot run serverless
  ],
})
class ServerlessAppModule {}

let app: INestApplication | undefined;

async function getApp(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(ServerlessAppModule, {
      logger: ['error', 'warn'],
    });
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const nestApp = await getApp();
    const expressInstance = nestApp.getHttpAdapter().getInstance() as (
      req: IncomingMessage,
      res: ServerResponse,
    ) => void;
    expressInstance(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error('[serverless] handler error:', message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
}
