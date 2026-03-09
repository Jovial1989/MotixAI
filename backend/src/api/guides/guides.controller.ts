import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DomainGuidesService } from 'src/domain/guides/guides.service';
import { createGuideSchema } from './schemas';

@ApiTags('guides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guides')
export class GuidesController {
  constructor(private readonly guides: DomainGuidesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    if (user.role === 'GUEST') throw new ForbiddenException('Create an account to generate guides');
    const parsed = createGuideSchema.parse(body);
    return this.guides.createGuide({
      userId: user.sub,
      tenantId: user.tenantId,
      vin: parsed.vin,
      vehicleModel: parsed.vehicleModel,
      partName: parsed.partName,
      oemNumber: parsed.oemNumber,
      sourceType: user.role === 'ENTERPRISE_ADMIN' ? 'ENTERPRISE' : 'B2C',
    });
  }

  @Get(':id')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.guides.getGuide(id, user.sub, user.tenantId);
  }

  @Get()
  history(@CurrentUser() user: AuthUser) {
    return this.guides.history(user.sub, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.guides.deleteGuide(id, user.sub, user.tenantId);
  }
}
