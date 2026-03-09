import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ImageGenerationProcessor } from './image-generation.processor';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [ImageGenerationProcessor],
})
export class JobsModule {}
