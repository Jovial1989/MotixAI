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

  async findOrCreate(input: {
    userId: string;
    tenantId: string | null;
    vin?: string;
    vehicleModel?: string;
    partName: string;
    oemNumber?: string;
    sourceType: 'B2C' | 'ENTERPRISE';
  }) {
    const vehicleModel = (input.vehicleModel || input.vin || 'Unknown vehicle').trim();
    const partNorm = input.partName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Search for an existing guide with a matching vehicle + part
    const candidates = await this.prisma.repairGuide.findMany({
      where: {
        OR: [
          { inputModel: { contains: vehicleModel, mode: 'insensitive' } },
          { vehicle: { model: { contains: vehicleModel, mode: 'insensitive' } } },
        ],
      },
      include: { vehicle: true, part: true, steps: true, images: true },
      orderBy: { popularity: 'desc' },
      take: 20,
    });

    for (const g of candidates) {
      const gPart = g.part.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (gPart.includes(partNorm) || partNorm.includes(gPart)) {
        // Cache hit — increment popularity and return
        await this.prisma.repairGuide.update({
          where: { id: g.id },
          data: { popularity: { increment: 1 }, source: 'cached' },
        });
        return g;
      }
    }

    // Not found — generate a new guide and mark it
    const created = await this.createGuide({ ...input, sourceType: input.sourceType });
    return this.prisma.repairGuide.update({
      where: { id: created.id },
      data: { source: 'generated', confidence: 88 },
      include: { steps: true, images: true, vehicle: true, part: true },
    });
  }

  async askStep(guideId: string, stepId: string, question: string, userId: string, tenantId: string | null) {
    const guide = await this.getGuide(guideId, userId, tenantId);
    const step = (guide.steps as Array<{ id: string; title: string; instruction: string }>)
      .find(s => s.id === stepId);
    if (!step) throw new NotFoundException('Step not found');

    const answer = await this.gemini.explainStep({
      stepTitle: step.title,
      instruction: step.instruction,
      vehicleModel: guide.vehicle.model,
      partName: guide.part.name,
      question,
    });
    return { answer };
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
