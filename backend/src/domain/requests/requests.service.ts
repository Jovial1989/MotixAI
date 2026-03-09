import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DomainRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(input: {
    userId: string;
    tenantId: string | null;
    vehicleModel: string;
    repairType: string;
    partNumber?: string;
    notes?: string;
  }) {
    return this.prisma.guideRequest.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        vehicleModel: input.vehicleModel,
        repairType: input.repairType,
        partNumber: input.partNumber,
        notes: input.notes,
        status: 'pending',
      },
    });
  }

  async listRequests(userId: string, tenantId: string | null) {
    return this.prisma.guideRequest.findMany({
      where: tenantId ? { tenantId } : { userId },
      orderBy: { createdAt: 'desc' },
      include: { guide: { select: { id: true, title: true } } },
    });
  }

  // Admin: list all pending requests (any tenant)
  async listAllPending() {
    return this.prisma.guideRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { guide: { select: { id: true, title: true } } },
    });
  }

  async updateRequestStatus(requestId: string, status: string, guideId?: string) {
    const req = await this.prisma.guideRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    return this.prisma.guideRequest.update({
      where: { id: requestId },
      data: { status, ...(guideId ? { guideId } : {}) },
    });
  }
}
