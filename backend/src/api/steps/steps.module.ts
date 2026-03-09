import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { StepsService } from 'src/domain/steps/steps.service';
import { StepsController } from './steps.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StepsController],
  providers: [StepsService],
  exports: [StepsService],
})
export class StepsModule {}
