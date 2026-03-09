import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DomainRequestsService } from 'src/domain/requests/requests.service';
import { createRequestSchema } from './schemas';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: DomainRequestsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = createRequestSchema.parse(body);
    return this.requests.createRequest({ userId: user.sub, tenantId: user.tenantId, ...parsed });
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.requests.listRequests(user.sub, user.tenantId);
  }
}
