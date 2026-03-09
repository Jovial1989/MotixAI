import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

export interface AnalyticsData {
  guidesThisMonth: number;
  timeSavedMinutes: number;
  activeVehicles: number;
  mostCommonRepairs: Array<{ partName: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'guide' | 'job';
    title: string;
    createdAt: string;
  }>;
}

// Assumed time saved per guide (minutes)
const TIME_SAVED_PER_GUIDE_MIN = 45;

@Injectable()
export class DomainAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string, tenantId: string | null): Promise<AnalyticsData> {
    const where = tenantId ? { tenantId } : { userId };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      guidesThisMonth,
      allGuides,
      activeVehicles,
      topParts,
      recentGuides,
      recentJobs,
    ] = await Promise.all([
      this.prisma.repairGuide.count({
        where: { ...where, createdAt: { gte: monthStart } },
      }),
      this.prisma.repairGuide.count({ where }),
      this.prisma.vehicle.count({ where: { guides: { some: where } } }),
      this.prisma.part.findMany({
        where: { guides: { some: where } },
        select: { name: true, _count: { select: { guides: true } } },
        orderBy: { guides: { _count: 'desc' } },
        take: 5,
      }),
      this.prisma.repairGuide.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      }),
      this.prisma.repairJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, problemDescription: true, createdAt: true },
      }),
    ]);

    const recentActivity = [
      ...recentGuides.map((g) => ({
        id: g.id,
        type: 'guide' as const,
        title: g.title,
        createdAt: g.createdAt.toISOString(),
      })),
      ...recentJobs.map((j) => ({
        id: j.id,
        type: 'job' as const,
        title: j.problemDescription,
        createdAt: j.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      guidesThisMonth,
      timeSavedMinutes: allGuides * TIME_SAVED_PER_GUIDE_MIN,
      activeVehicles,
      mostCommonRepairs: topParts.map((p) => ({
        partName: p.name,
        count: p._count.guides,
      })),
      recentActivity,
    };
  }
}
