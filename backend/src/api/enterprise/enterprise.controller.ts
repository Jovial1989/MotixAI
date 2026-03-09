import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { Roles } from 'src/common/roles.decorator';
import { RolesGuard } from 'src/common/roles.guard';
import { DomainEnterpriseService } from 'src/domain/enterprise/enterprise.service';
import { DomainGuidesService } from 'src/domain/guides/guides.service';
import { enterpriseGuideSchema, uploadManualSchema } from './schemas';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@ApiTags('enterprise')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTERPRISE_ADMIN')
@Controller('enterprise')
export class EnterpriseController {
  constructor(
    private readonly enterprise: DomainEnterpriseService,
    private readonly guides: DomainGuidesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('manuals')
  uploadManual(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = uploadManualSchema.parse(body);
    return this.enterprise.uploadManual({
      tenantId: user.tenantId,
      ...parsed,
    });
  }

  @Get('manuals')
  listManuals(@CurrentUser() user: AuthUser) {
    return this.enterprise.listManuals(user.tenantId);
  }

  @Post('guides')
  async createGuideFromManual(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = enterpriseGuideSchema.parse(body);

    const manual = await this.prisma.manualDocument.findFirst({
      where: {
        id: parsed.manualId,
        tenantId: user.tenantId || undefined,
      },
    });

    return this.guides.createGuide({
      userId: user.sub,
      tenantId: user.tenantId,
      vehicleModel: parsed.vehicleModel,
      partName: parsed.partName,
      oemNumber: parsed.oemNumber,
      manualText: manual?.extractedText || undefined,
      sourceType: 'ENTERPRISE',
      manualId: manual?.id,
    });
  }
}
