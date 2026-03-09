import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { StepsService } from 'src/domain/steps/steps.service';
import { StepsController } from './steps.controller';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [StepsController],
  providers: [StepsService],
  exports: [StepsService],
})
export class StepsModule {}
