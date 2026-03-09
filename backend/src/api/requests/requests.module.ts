import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { RequestsController } from './requests.controller';
import { DomainRequestsService } from 'src/domain/requests/requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [RequestsController],
  providers: [DomainRequestsService],
})
export class GuideRequestsModule {}
