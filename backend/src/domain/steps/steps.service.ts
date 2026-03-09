import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IllustrationWorker } from 'src/services/illustration/illustrationWorker';

// Extended imageStatus values:
// none | queued | searching_refs | analyzing_refs | generating | ready | failed

const ACTIVE_STATUSES = ['queued', 'searching_refs', 'analyzing_refs', 'generating'];

@Injectable()
export class StepsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StepsService.name);
  private readonly worker: IllustrationWorker;

  constructor(private readonly prisma: PrismaService) {
    this.worker = new IllustrationWorker(prisma);
  }

  async onApplicationBootstrap(): Promise<void> {
    // Reset steps stuck in any active phase from a previous server run
    const reset = await this.prisma.repairStep.updateMany({
      where: { imageStatus: { in: ACTIVE_STATUSES } },
      data: { imageStatus: 'none' },
    });
    if (reset.count > 0) {
      this.logger.log(`Reset ${reset.count} stuck image job(s) to 'none' on startup`);
      // Re-enqueue steps that previously had a prompt (were already processed once)
      const steps = await this.prisma.repairStep.findMany({
        where: { imageStatus: 'none', imagePrompt: { not: null } },
        select: { id: true },
      });
      for (const step of steps) {
        void this.generateStepImage(step.id, false);
      }
    }
  }

  async generateStepImage(
    stepId: string,
    force = false,
  ): Promise<{ imageStatus: string; imageUrl: string | null }> {
    const step = await this.prisma.repairStep.findUnique({ where: { id: stepId } });
    if (!step) throw new NotFoundException('Step not found');

    return this.worker.enqueue(stepId, force);
  }

  async enqueueGuideImages(guideId: string): Promise<void> {
    const steps = await this.prisma.repairStep.findMany({
      where: { guideId, imageStatus: 'none' },
      orderBy: { stepOrder: 'asc' },
    });
    for (const step of steps) {
      void this.worker.enqueue(step.id, false);
    }
  }
}
