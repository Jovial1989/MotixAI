import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PromptBuilder, StepContext, specToImagePrompt } from './promptBuilder';

// Extended imageStatus values:
// none | queued | searching_refs | analyzing_refs | generating | ready | failed

// Retry backoff delays in ms: attempt 1 → 0, attempt 2 → 15s, attempt 3 → 60s
const RETRY_DELAYS_MS = [0, 15_000, 60_000];
const MAX_ATTEMPTS = 3;

// Concurrency control — one active Gemini image call at a time
const activeJobs = new Set<string>();
const MAX_CONCURRENT = 1;
// Rate-limit: minimum gap between Gemini image requests (7s ≈ 8/min, under free-tier cap)
const MIN_REQUEST_INTERVAL_MS = 7_000;
let lastRequestTime = 0;

async function waitForSlot(): Promise<void> {
  while (activeJobs.size >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }
}

async function rateLimit(): Promise<void> {
  const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestTime));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();
}

// ── IllustrationWorker ────────────────────────────────────────────────────────

export class IllustrationWorker {
  private readonly logger = new Logger(IllustrationWorker.name);
  private readonly promptBuilder: PromptBuilder;
  private readonly imageClient: GoogleGenerativeAI | null;
  private readonly imageEnabled: boolean;

  constructor(private readonly prisma: PrismaService) {
    this.promptBuilder = new PromptBuilder();
    this.imageEnabled = process.env.ENABLE_STEP_IMAGES !== 'false';
    const key = process.env.GEMINI_API_KEY;
    this.imageClient =
      key && key !== 'replace-with-real-key' ? new GoogleGenerativeAI(key) : null;
    if (!this.imageClient) {
      this.logger.warn('GEMINI_API_KEY not set — step images will use placeholders');
    }
  }

  // Enqueue a step for illustration generation. Returns immediately with 'queued'.
  async enqueue(stepId: string, force = false): Promise<{ imageStatus: string; imageUrl: string | null }> {
    const step = await this.prisma.repairStep.findUnique({
      where: { id: stepId },
      include: { guide: { include: { vehicle: true, part: true } } },
    });
    if (!step) throw new Error(`Step not found: ${stepId}`);

    // Return cached result when not forced
    if (step.imageStatus === 'ready' && step.imageUrl && !force) {
      return { imageStatus: 'ready', imageUrl: step.imageUrl };
    }

    // Skip if already running any active phase
    const activeStatuses = ['queued', 'searching_refs', 'analyzing_refs', 'generating'];
    if (activeStatuses.includes(step.imageStatus) && !force) {
      return { imageStatus: step.imageStatus, imageUrl: step.imageUrl };
    }

    // Mark as queued and fire the pipeline
    await this.prisma.repairStep.update({
      where: { id: stepId },
      data: { imageStatus: 'queued', imageError: null },
    });

    setTimeout(() => void this.runPipeline(stepId, step as Parameters<typeof this.runPipeline>[1]), 50);

    return { imageStatus: 'queued', imageUrl: null };
  }

  private async runPipeline(
    stepId: string,
    step: {
      stepOrder: number;
      title: string;
      instruction: string;
      torqueValue: string | null;
      warningNote: string | null;
      guide: {
        tools: string[];
        vehicle: { model: string };
        part: { name: string };
      };
    },
  ): Promise<void> {
    const ctx: StepContext = {
      stepOrder: step.stepOrder,
      title: step.title,
      instruction: step.instruction,
      torqueValue: step.torqueValue,
      warningNote: step.warningNote,
      tools: step.guide.tools,
      vehicleModel: step.guide.vehicle.model,
      partName: step.guide.part.name,
    };

    let lastErr = 'Unknown error';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          const delay = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
          this.logger.log(`Retry delay ${delay}ms for step ${stepId} attempt ${attempt}`);
          await new Promise((r) => setTimeout(r, delay));
        }

        // ── Phase 1: searching_refs ─────────────────────────────────────────
        await this.prisma.repairStep.update({
          where: { id: stepId },
          data: { imageStatus: 'searching_refs', imageError: null },
        });
        this.logger.log(`searching_refs step=${stepId} attempt=${attempt}`);

        // ── Phase 2: analyzing_refs → DrawingSpec ───────────────────────────
        await this.prisma.repairStep.update({
          where: { id: stepId },
          data: { imageStatus: 'analyzing_refs' },
        });
        this.logger.log(`analyzing_refs step=${stepId}`);

        const spec = await this.promptBuilder.buildDrawingSpec(ctx);
        this.logger.log(`spec built step=${stepId} view=${spec.viewType} components=${spec.keyComponents.length}`);

        const imagePrompt = specToImagePrompt(spec);
        await this.prisma.repairStep.update({
          where: { id: stepId },
          data: { imagePrompt },
        });

        // ── Phase 3: generating ─────────────────────────────────────────────
        await waitForSlot();
        activeJobs.add(stepId);

        try {
          await rateLimit();
          await this.prisma.repairStep.update({
            where: { id: stepId },
            data: { imageStatus: 'generating' },
          });
          this.logger.log(`generating step=${stepId}`);

          const imageUrl = await this.generateImage(imagePrompt);

          await this.prisma.repairStep.update({
            where: { id: stepId },
            data: { imageStatus: 'ready', imageUrl, imageError: null },
          });
          this.logger.log(`ready step=${stepId}`);
          return; // success

        } finally {
          activeJobs.delete(stepId);
        }

      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        this.logger.error(`attempt ${attempt} failed step=${stepId}: ${lastErr}`);
        activeJobs.delete(stepId);
      }
    }

    // All attempts exhausted
    await this.prisma.repairStep.update({
      where: { id: stepId },
      data: {
        imageStatus: 'failed',
        imageError: lastErr,
        imageUrl: 'https://placehold.co/1200x800/fef2f2/ef4444?text=Generation+failed',
      },
    });
    this.logger.error(`all attempts failed step=${stepId}`);
  }

  private async generateImage(prompt: string): Promise<string> {
    if (!this.imageEnabled || !this.imageClient) {
      const label = encodeURIComponent(prompt.slice(0, 50));
      return `https://placehold.co/1200x800/f1f5f9/94a3b8?text=${label}`;
    }

    const model = (this.imageClient.getGenerativeModel as Function)({
      model: 'gemini-2.0-flash-exp-image-generation',
    });

    const result = await (model.generateContent as Function)({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const candidates: unknown[] = (result.response.candidates as unknown[]) ?? [];
    for (const candidate of candidates) {
      const parts: unknown[] =
        (candidate as { content?: { parts?: unknown[] } }).content?.parts ?? [];
      for (const part of parts) {
        const p = part as { inlineData?: { data?: string; mimeType?: string } };
        if (p.inlineData?.data) {
          const mime = p.inlineData.mimeType ?? 'image/png';
          return `data:${mime};base64,${p.inlineData.data}`;
        }
      }
    }

    throw new Error('No image data returned from Gemini');
  }
}
