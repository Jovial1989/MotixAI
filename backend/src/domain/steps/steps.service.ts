import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { GeminiImageProvider } from 'src/ai/gemini-image.provider';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

// Simple in-process queue with concurrency limit of 1.
const activeJobs = new Set<string>();
const MAX_CONCURRENT = 1;
// Rate-limit: minimum gap between Gemini image requests (7s = ~8/min, under free-tier cap).
const MIN_REQUEST_INTERVAL_MS = 7000;
let lastRequestTime = 0;

function buildPrompt(step: {
  stepOrder: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
  guide: {
    title: string;
    tools: string[];
    safetyNotes: string[];
    vehicle: { model: string };
    part: { name: string };
  };
}): string {
  const toolsStr = step.guide.tools.join(', ');
  const torque = step.torqueValue ? `Torque: ${step.torqueValue}.` : '';
  const warning = step.warningNote ? `Warning: ${step.warningNote}.` : '';

  return `Technical service-manual illustration, white background, clean instructional diagram, engineering style.
No people, no brand logos, no copyrighted marks. Minimal linework, clear arrows and labels.
Show only the relevant component and tool interaction.

Vehicle: ${step.guide.vehicle.model}
Component: ${step.guide.part.name}
Step ${step.stepOrder}: ${step.title}
Procedure: ${step.instruction}
Tools required: ${toolsStr || 'standard hand tools'}
${torque}
${warning}

Style: technical exploded-view or cross-section diagram, neutral background, labels in English, service manual aesthetic.`;
}

@Injectable()
export class StepsService {
  private readonly logger = new Logger(StepsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProvider: GeminiImageProvider,
  ) {}

  async generateStepImage(stepId: string, force = false): Promise<{ imageStatus: string; imageUrl: string | null }> {
    const step = await this.prisma.repairStep.findUnique({
      where: { id: stepId },
      include: {
        guide: {
          include: { vehicle: true, part: true },
        },
      },
    });

    if (!step) throw new NotFoundException('Step not found');

    // Skip if already ready and not forced
    if (step.imageStatus === 'ready' && step.imageUrl && !force) {
      return { imageStatus: step.imageStatus, imageUrl: step.imageUrl };
    }

    // Skip if already in progress
    if ((step.imageStatus === 'generating' || step.imageStatus === 'queued') && !force) {
      return { imageStatus: step.imageStatus, imageUrl: step.imageUrl };
    }

    const prompt = buildPrompt(step as Parameters<typeof buildPrompt>[0]);
    const promptHash = createHash('md5').update(prompt).digest('hex');

    // Cache check: reuse if same prompt hash already succeeded
    if (!force && step.imageStatus === 'ready' && step.imageUrl) {
      return { imageStatus: 'ready', imageUrl: step.imageUrl };
    }

    // Mark as queued immediately so UI can respond
    await this.prisma.repairStep.update({
      where: { id: stepId },
      data: { imageStatus: 'queued', imagePrompt: prompt, imageError: null },
    });

    // Fire-and-forget processing respecting concurrency limit
    this.processAsync(stepId, prompt, promptHash);

    return { imageStatus: 'queued', imageUrl: null };
  }

  async enqueueGuideImages(guideId: string): Promise<void> {
    const steps = await this.prisma.repairStep.findMany({
      where: { guideId, imageStatus: 'none' },
      orderBy: { stepOrder: 'asc' },
    });

    for (const step of steps) {
      // Don't await — fire and forget with staggered start
      void this.generateStepImage(step.id, false);
    }
  }

  private processAsync(stepId: string, prompt: string, _promptHash: string): void {
    // Schedule with slight delay to not block the response
    setTimeout(() => {
      void this.runGeneration(stepId, prompt);
    }, 50);
  }

  private async runGeneration(stepId: string, prompt: string): Promise<void> {
    // Wait if at concurrency limit
    if (activeJobs.size >= MAX_CONCURRENT) {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (activeJobs.size < MAX_CONCURRENT) {
            clearInterval(check);
            resolve();
          }
        }, 500);
      });
    }

    activeJobs.add(stepId);

    try {
      // Rate-limit: ensure minimum gap between Gemini requests
      const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestTime));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastRequestTime = Date.now();

      await this.prisma.repairStep.update({
        where: { id: stepId },
        data: { imageStatus: 'generating' },
      });

      this.logger.log(`Generating image for step ${stepId}`);
      const result = await this.imageProvider.generateImage(prompt);

      await this.prisma.repairStep.update({
        where: { id: stepId },
        data: { imageStatus: 'ready', imageUrl: result.imageUrl, imageError: null },
      });

      this.logger.log(`Image ready for step ${stepId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Image generation failed for step ${stepId}: ${msg}`);

      await this.prisma.repairStep.update({
        where: { id: stepId },
        data: {
          imageStatus: 'failed',
          imageError: msg,
          imageUrl: `https://placehold.co/1200x800/fef2f2/ef4444?text=Generation+failed`,
        },
      });
    } finally {
      activeJobs.delete(stepId);
    }
  }
}
