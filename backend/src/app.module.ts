import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './api/auth/auth.module';
import { GuidesModule } from './api/guides/guides.module';
import { EnterpriseModule } from './api/enterprise/enterprise.module';
import { HealthModule } from './api/health/health.module';
import { StepsModule } from './api/steps/steps.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    JobsModule,
    AuthModule,
    GuidesModule,
    EnterpriseModule,
    HealthModule,
    StepsModule,
  ],
})
export class AppModule {}
