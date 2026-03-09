import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DomainAnalyticsService } from 'src/domain/analytics/analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: DomainAnalyticsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.analytics.getAnalytics(user.sub, user.tenantId);
  }
}
