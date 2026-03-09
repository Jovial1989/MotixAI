import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AdminController } from './admin.controller';
import { DomainRequestsService } from 'src/domain/requests/requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [DomainRequestsService],
})
export class AdminModule {}
