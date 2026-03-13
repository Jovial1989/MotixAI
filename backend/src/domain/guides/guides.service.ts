import { Injectable, NotFoundException } from '@nestjs/common';
import { JobType } from '@prisma/client';
import { Queue } from 'bullmq';
import { GeminiProvider } from 'src/ai/gemini.provider';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { SourceAdapterRegistry } from 'src/ai/source-adapters/source-adapter.registry';
import { TaskType } from 'src/ai/source-adapters/source-package.types';
import { ProviderRegistry } from 'src/providers/provider-registry';

@Injectable()
export class DomainGuidesService {
  private readonly imageQueue: Queue | null;
  private readonly sourceRegistry = new SourceAdapterRegistry();
  // New provider layer — wraps adapters with proper async interface
  private readonly providerRegistry = new ProviderRegistry();

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

  /**
   * Search stored guides by free-text query and optional structured filters.
   * This is the first step in the search → retrieve → generate flow.
   * Results are ordered by popularity so frequently-accessed guides surface first.
   */
  async searchGuides(params: { q?: string; make?: string; model?: string; component?: string }) {
    const term = params.q?.trim() ?? '';
    const makeFilter = params.make?.trim();
    const modelFilter = params.model?.trim();
    const componentFilter = params.component?.trim();

    // Build a combined OR filter across relevant text fields
    const textClauses = term
      ? [
          { title: { contains: term, mode: 'insensitive' as const } },
          { vehicle: { model: { contains: term, mode: 'insensitive' as const } } },
          { part: { name: { contains: term, mode: 'insensitive' as const } } },
          { inputPart: { contains: term, mode: 'insensitive' as const } },
        ]
      : [];

    const andClauses: object[] = [];
    if (makeFilter) {
      andClauses.push({ vehicle: { model: { contains: makeFilter, mode: 'insensitive' as const } } });
    }
    if (modelFilter) {
      andClauses.push({ vehicle: { model: { contains: modelFilter, mode: 'insensitive' as const } } });
    }
    if (componentFilter) {
      andClauses.push({
        OR: [
          { part: { name: { contains: componentFilter, mode: 'insensitive' as const } } },
          { inputPart: { contains: componentFilter, mode: 'insensitive' as const } },
        ],
      });
    }

    if (!term && andClauses.length === 0) {
      // No filters — return popular guides as suggestions
      return this.prisma.repairGuide.findMany({
        orderBy: { popularity: 'desc' },
        take: 10,
        include: { vehicle: true, part: true },
      });
    }

    return this.prisma.repairGuide.findMany({
      where: {
        ...(textClauses.length > 0 ? { OR: textClauses } : {}),
        ...(andClauses.length > 0 ? { AND: andClauses } : {}),
      },
      include: { vehicle: true, part: true },
      orderBy: { popularity: 'desc' },
      take: 15,
    });
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

  async createFromSource(input: {
    userId: string;
    tenantId: string | null;
    make: string;
    model: string;
    year: number;
    component: string;
    taskType: TaskType;
  }) {
    // Step 1: Search — check if this guide already exists before generating.
    // This is the core search → retrieve → generate flow.
    const partNorm = input.component.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    const existingCandidates = await this.prisma.repairGuide.findMany({
      where: { inputModel: { contains: `${input.make} ${input.model}`, mode: 'insensitive' } },
      include: { steps: true, images: true, vehicle: true, part: true },
      orderBy: { popularity: 'desc' },
      take: 10,
    });

    for (const g of existingCandidates) {
      const gPart = g.inputPart.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (gPart.includes(partNorm) || partNorm.includes(gPart)) {
        // Cache hit — return existing guide with bumped popularity
        await this.prisma.repairGuide.update({
          where: { id: g.id },
          data: { popularity: { increment: 1 }, source: 'cached' },
        });
        return { ...g, source: 'cached' };
      }
    }

    // Step 2: Not found — retrieve source package and synthesize.
    const pkg = this.sourceRegistry.getPackage(
      input.make,
      input.model,
      input.year,
      input.taskType,
    );

    const vehicleModel = `${input.year} ${input.make} ${input.model}`.trim();

    let generated: Awaited<ReturnType<typeof this.gemini.synthesizeFromSource>>;
    let sourceProvider: string;
    let sourceReferences: object[];
    let sourceTag: string;
    let confidence: number;

    if (pkg) {
      generated = await this.gemini.synthesizeFromSource(pkg);
      sourceProvider = pkg.sourceProvider;
      sourceReferences = pkg.sourceReferences as object[];
      sourceTag = 'source-backed';
      confidence = 95;
    } else {
      console.warn(
        `[GuidesService] No seeded source for ${input.make} ${input.model} (${input.taskType}) — using web fallback synthesis`,
      );
      generated = await this.gemini.synthesizeFromWeb(
        input.make,
        input.model,
        input.year,
        input.component,
        input.taskType,
      );
      sourceProvider = 'AI Web Synthesis';
      sourceReferences = [];
      sourceTag = 'web-fallback';
      confidence = 75;
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        tenantId: input.tenantId,
        model: vehicleModel,
        year: input.year,
      },
    });

    const part = await this.prisma.part.create({
      data: {
        tenantId: input.tenantId,
        name: input.component,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guide = await (this.prisma.repairGuide.create as any)({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        vehicleId: vehicle.id,
        partId: part.id,
        title: generated.title,
        difficulty: generated.difficulty,
        timeEstimate: generated.timeEstimate,
        safetyNotes: generated.safetyNotes,
        tools: generated.tools,
        inputModel: vehicleModel,
        inputPart: input.component,
        sourceType: 'B2C',
        source: sourceTag,
        confidence,
        taskType: input.taskType,
        sourceProvider,
        sourceReferences,
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

    return guide;
  }
}
