import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnterpriseController } from './enterprise.controller';
import { DomainEnterpriseService } from 'src/domain/enterprise/enterprise.service';
import { DomainGuidesService } from 'src/domain/guides/guides.service';
import { RolesGuard } from 'src/common/roles.guard';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [EnterpriseController],
  providers: [DomainEnterpriseService, DomainGuidesService, RolesGuard],
})
export class EnterpriseModule {}
