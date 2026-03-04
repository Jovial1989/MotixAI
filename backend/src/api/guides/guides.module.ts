import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GuidesController } from './guides.controller';
import { DomainGuidesService } from 'src/domain/guides/guides.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [GuidesController],
  providers: [DomainGuidesService],
  exports: [DomainGuidesService],
})
export class GuidesModule {}
