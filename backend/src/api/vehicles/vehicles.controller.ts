import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const where = user.tenantId
      ? { guides: { some: { tenantId: user.tenantId } } }
      : { guides: { some: { userId: user.sub } } };

    return this.prisma.vehicle.findMany({
      where,
      include: {
        guides: {
          where: user.tenantId ? { tenantId: user.tenantId } : { userId: user.sub },
          select: { id: true, title: true, createdAt: true, part: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        repairJobs: {
          where: user.tenantId ? { tenantId: user.tenantId } : { userId: user.sub },
          select: { id: true, status: true, problemDescription: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
