import { Injectable, NotFoundException } from '@nestjs/common';
import { JobType } from '@prisma/client';
import { Queue } from 'bullmq';
import { GeminiProvider } from 'src/ai/gemini.provider';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DomainGuidesService {
  private readonly imageQueue: Queue | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiProvider,
  ) {
    const redisUrl = process.env.REDIS_URL;
    this.imageQueue = redisUrl
      ? new Queue('guide-images', {
          connection: {
            host: redisUrl.replace('redis://', '').split(':')[0],
            port: Number(redisUrl.split(':').pop() || 6379),
          },
        })
      : null;
  }

  async createGuide(input: {
    userId: string;
    tenantId: string | null;
    vin?: string;
    vehicleModel?: string;
    partName: string;
    oemNumber?: string;
    manualText?: string;
    sourceType: 'B2C' | 'ENTERPRISE';
    manualId?: string;
  }) {
    const normalizedVehicle = (input.vehicleModel || input.vin || 'Unknown vehicle').trim();
    const normalizedPart = `${input.partName}${input.oemNumber ? ` (${input.oemNumber})` : ''}`.trim();

    const generated = await this.gemini.generateRepairGuide({
      vehicle: normalizedVehicle,
      part: normalizedPart,
      context: input.manualText,
    });

    const vehicle = await this.prisma.vehicle.create({
      data: {
        tenantId: input.tenantId,
        vin: input.vin,
        model: normalizedVehicle,
      },
    });

    const part = await this.prisma.part.create({
      data: {
        tenantId: input.tenantId,
        name: input.partName,
        oemNumber: input.oemNumber,
      },
    });

    const guide = await this.prisma.repairGuide.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        vehicleId: vehicle.id,
        partId: part.id,
        manualId: input.manualId,
        title: generated.title,
        difficulty: generated.difficulty,
        timeEstimate: generated.timeEstimate,
        safetyNotes: generated.safetyNotes,
        tools: generated.tools,
        inputVin: input.vin,
        inputModel: input.vehicleModel,
        inputPart: normalizedPart,
        sourceType: input.sourceType,
        steps: {
          create: generated.steps.map((step) => ({
            stepOrder: step.order,
            title: step.title,
            instruction: step.instruction,
            torqueValue: step.torqueValue,
            warningNote: step.warningNote,
          })),
        },
        images: {
          create: generated.imagePlan.map((prompt, idx) => ({
            stepOrder: idx + 1,
            prompt,
          })),
        },
      },
      include: {
        steps: true,
        images: true,
        vehicle: true,
        part: true,
      },
    });

    // Fire-and-forget: enqueue image generation without blocking the response
    if (this.imageQueue) {
      this.prisma.job.create({
        data: {
          guideId: guide.id,
          type: JobType.GUIDE_IMAGE_GENERATION,
          payload: { guideId: guide.id },
        },
      }).then((job) =>
        this.imageQueue!.add('generate-guide-images', { jobId: job.id, guideId: guide.id }),
      ).catch(() => {
        // Redis not available — images will stay in PENDING state
      });
    }

    return guide;
  }

  async getGuide(guideId: string, userId: string, tenantId: string | null) {
    const guide = await this.prisma.repairGuide.findFirst({
      where: {
        id: guideId,
        ...(tenantId ? { tenantId } : { userId }),
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        images: { orderBy: { stepOrder: 'asc' } },
        vehicle: true,
        part: true,
      },
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    return guide;
  }

  async deleteGuide(guideId: string, userId: string, tenantId: string | null) {
    const guide = await this.prisma.repairGuide.findFirst({
      where: { id: guideId, ...(tenantId ? { tenantId } : { userId }) },
    });
    if (!guide) throw new NotFoundException('Guide not found');
    await this.prisma.repairGuide.delete({ where: { id: guideId } });
  }

  async history(userId: string, tenantId: string | null) {
    return this.prisma.repairGuide.findMany({
      where: tenantId ? { tenantId } : { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        part: true,
        images: true,
      },
    });
  }
}
