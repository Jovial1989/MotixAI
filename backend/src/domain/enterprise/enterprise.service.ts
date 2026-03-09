import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DomainEnterpriseService {
  constructor(private readonly prisma: PrismaService) {}

  private assertTenant(tenantId: string | null): string {
    if (!tenantId) {
      throw new ForbiddenException('Tenant required for enterprise operations');
    }
    return tenantId;
  }

  async uploadManual(input: {
    tenantId: string | null;
    title: string;
    fileUrl: string;
    extractedText?: string;
    vehicleModel?: string;
  }) {
    const tenantId = this.assertTenant(input.tenantId);

    return this.prisma.manualDocument.create({
      data: {
        tenantId,
        title: input.title,
        fileUrl: input.fileUrl,
        extractedText: input.extractedText,
        vehicles: input.vehicleModel
          ? {
              create: [{
                tenantId,
                model: input.vehicleModel,
              }],
            }
          : undefined,
      },
    });
  }

  async listManuals(tenantId: string | null) {
    return this.prisma.manualDocument.findMany({
      where: { tenantId: this.assertTenant(tenantId) },
      orderBy: { createdAt: 'desc' },
      include: { vehicles: true },
    });
  }
}
