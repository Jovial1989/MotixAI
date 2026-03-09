import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DomainJobsService } from 'src/domain/jobs/jobs.service';
import { createJobSchema, updateJobSchema } from './schemas';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: DomainJobsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = createJobSchema.parse(body);
    return this.jobs.createJob({ userId: user.sub, tenantId: user.tenantId, ...parsed });
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.jobs.listJobs(user.sub, user.tenantId);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = updateJobSchema.parse(body);
    return this.jobs.updateJobStatus(id, user.sub, user.tenantId, parsed.status, parsed.notes);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.deleteJob(id, user.sub, user.tenantId);
  }
}
