import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { Worker } from 'bullmq';
import { GeminiImageProvider } from 'src/ai/gemini-image.provider';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class ImageGenerationProcessor implements OnModuleInit {
  private readonly logger = new Logger(ImageGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProvider: GeminiImageProvider,
  ) {}

  onModuleInit(): void {
    const redisHost = process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost';
    const redisPort = Number(process.env.REDIS_URL?.split(':').pop() || 6379);

    const worker = new Worker(
      'guide-images',
      async (queueJob) => {
        const { jobId, guideId } = queueJob.data as { jobId: string; guideId: string };

        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.RUNNING },
        });

        const images = await this.prisma.generatedImage.findMany({
          where: { guideId },
          orderBy: { stepOrder: 'asc' },
          take: 8,
        });

        for (const image of images) {
          const generated = await this.imageProvider.generateImage(image.prompt);
          await this.prisma.generatedImage.update({
            where: { id: image.id },
            data: { imageUrl: generated.imageUrl, status: 'READY' },
          });
        }

        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.COMPLETED },
        });
      },
      {
        connection: {
          host: redisHost,
          port: redisPort,
        },
      },
    );

    worker.on('failed', async (queueJob, error) => {
      this.logger.error(`Image job failed: ${error.message}`);
      const payload = queueJob?.data as { jobId?: string } | undefined;
      if (payload?.jobId) {
        await this.prisma.job.update({
          where: { id: payload.jobId },
          data: {
            status: JobStatus.FAILED,
            error: error.message,
          },
        });
      }
    });
  }
}
