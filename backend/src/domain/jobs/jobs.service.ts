import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DomainJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: {
    userId: string;
    tenantId: string | null;
    vehicleId: string;
    guideId?: string;
    problemDescription: string;
    assignedTechnicianId?: string;
    notes?: string;
  }) {
    return this.prisma.repairJob.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        vehicleId: input.vehicleId,
        guideId: input.guideId,
        problemDescription: input.problemDescription,
        assignedTechnicianId: input.assignedTechnicianId,
        notes: input.notes,
        status: 'pending',
      },
      include: { vehicle: true, guide: { include: { part: true } } },
    });
  }

  async listJobs(userId: string, tenantId: string | null) {
    return this.prisma.repairJob.findMany({
      where: tenantId ? { tenantId } : { userId },
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, guide: { include: { part: true } } },
    });
  }

  async updateJobStatus(
    jobId: string,
    userId: string,
    tenantId: string | null,
    status: string,
    notes?: string,
  ) {
    const job = await this.prisma.repairJob.findFirst({
      where: { id: jobId, ...(tenantId ? { tenantId } : { userId }) },
    });
    if (!job) throw new NotFoundException('Job not found');
    return this.prisma.repairJob.update({
      where: { id: jobId },
      data: { status, ...(notes !== undefined ? { notes } : {}) },
      include: { vehicle: true, guide: { include: { part: true } } },
    });
  }

  async deleteJob(jobId: string, userId: string, tenantId: string | null) {
    const job = await this.prisma.repairJob.findFirst({
      where: { id: jobId, ...(tenantId ? { tenantId } : { userId }) },
    });
    if (!job) throw new NotFoundException('Job not found');
    await this.prisma.repairJob.delete({ where: { id: jobId } });
  }
}
