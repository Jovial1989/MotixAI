import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { JobsController } from './jobs.controller';
import { DomainJobsService } from 'src/domain/jobs/jobs.service';

@Module({
  imports: [PrismaModule],
  controllers: [JobsController],
  providers: [DomainJobsService],
})
export class RepairJobsModule {}
