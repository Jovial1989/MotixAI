import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DomainGuidesService } from 'src/domain/guides/guides.service';
import { createGuideSchema, createSourceGuideSchema, searchGuidesSchema } from './schemas';

@ApiTags('guides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guides')
export class GuidesController {
  constructor(private readonly guides: DomainGuidesService) {}

  @Post('source-backed')
  createSourceBacked(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    if (user.role === 'GUEST') throw new ForbiddenException('Create an account to use source-backed guides');
    const parsed = createSourceGuideSchema.parse(body);
    return this.guides.createFromSource({
      userId: user.sub,
      tenantId: user.tenantId,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      component: parsed.component,
      taskType: parsed.taskType,
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    if (user.role === 'GUEST') throw new ForbiddenException('Create an account to generate guides');
    const parsed = createGuideSchema.parse(body);
    return this.guides.findOrCreate({
      userId: user.sub,
      tenantId: user.tenantId,
      vin: parsed.vin,
      vehicleModel: parsed.vehicleModel,
      partName: parsed.partName,
      oemNumber: parsed.oemNumber,
      sourceType: user.role === 'ENTERPRISE_ADMIN' ? 'ENTERPRISE' : 'B2C',
    });
  }

  @Post(':id/ask')
  ask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { stepId: string; question?: string },
  ) {
    return this.guides.askStep(id, body.stepId, body.question ?? '', user.sub, user.tenantId);
  }

  /**
   * GET /guides/search?q=...&make=...&model=...&component=...
   *
   * Public-accessible search across all stored guides. Follows the product's
   * search → retrieve → generate flow: always search before generating.
   * GUEST users can call this endpoint (no generation happens here).
   */
  @Get('search')
  search(
    @Query('q') q: string | undefined,
    @Query('make') make: string | undefined,
    @Query('model') model: string | undefined,
    @Query('component') component: string | undefined,
  ) {
    const parsed = searchGuidesSchema.parse({ q, make, model, component });
    return this.guides.searchGuides(parsed);
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
