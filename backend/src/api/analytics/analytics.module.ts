import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { DomainAnalyticsService } from 'src/domain/analytics/analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [DomainAnalyticsService],
})
export class AnalyticsModule {}
