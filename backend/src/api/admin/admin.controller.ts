import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { Roles } from 'src/common/roles.decorator';
import { RolesGuard } from 'src/common/roles.guard';
import { DomainRequestsService } from 'src/domain/requests/requests.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTERPRISE_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly requests: DomainRequestsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('requests')
  listRequests() {
    return this.requests.listAllPending();
  }

  @Patch('requests/:id')
  updateRequest(@Param('id') id: string, @Body() body: { status: string; guideId?: string }) {
    return this.requests.updateRequestStatus(id, body.status, body.guideId);
  }

  @Get('guides')
  listGuides() {
    return this.prisma.repairGuide.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { vehicle: true, part: true, user: { select: { email: true, fullName: true } } },
    });
  }

  @Patch('guides/:id')
  updateGuide(@Param('id') id: string, @Body() body: { status?: string; title?: string }) {
    return this.prisma.repairGuide.update({
      where: { id },
      data: { ...(body.status ? { status: body.status } : {}), ...(body.title ? { title: body.title } : {}) },
    });
  }

  @Get('users')
  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, tenantId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
