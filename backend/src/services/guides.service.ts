import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { fetchConnectorContext } from '../connectors';
import { guideQueue } from './queue.service';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

const MODEL = 'claude-sonnet-4-6';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Guide Request ─────────────────────────────────────────────────────────────

export interface CreateGuideInput {
  userId: string;
  vin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  partName?: string;
  partOem?: string;
}

// ─── AI Response Schema ────────────────────────────────────────────────────────

interface GeneratedGuide {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  safetyNotes: string[];
  tools: string[];
  materials: string[];
  oemSummary: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    warning?: string;
  }>;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class GuidesService {
  async create(input: CreateGuideInput) {
    const { userId, vin, vehicleMake, vehicleModel, vehicleYear, partName, partOem } = input;

    if (!vehicleMake && !vin) throw new AppError('Provide VIN or vehicle make/model', 400);
    if (!partName && !partOem) throw new AppError('Provide part name or OEM number', 400);

    // Upsert vehicle
    const vehicle = await prisma.vehicleModel.upsert({
      where: { vin: vin ?? '__none__' },
      create: { make: vehicleMake ?? 'Unknown', model: vehicleModel ?? 'Unknown', year: vehicleYear, vin },
      update: {},
    });

    // Upsert part
    const part = await prisma.part.upsert({
      where: { id: partOem ? `oem-${partOem}` : `name-${partName}` },
      create: { id: partOem ? `oem-${partOem}` : `name-${partName}`, name: partName ?? partOem!, oemNumber: partOem },
      update: {},
    });

    // Create guide placeholder
    const guide = await prisma.repairGuide.create({
      data: {
        title: `${partName ?? partOem} — ${vehicleMake ?? vin} ${vehicleModel ?? ''}`.trim(),
        vehicleId: vehicle.id,
        partId: part.id,
        userId,
        safetyNotes: [],
        tools: [],
        materials: [],
        images: [],
      },
      include: { vehicle: true, part: true, steps: true },
    });

    // Save to history
    await prisma.searchHistory.create({
      data: {
        userId,
        query: `${vehicleMake ?? vin} ${vehicleModel ?? ''} — ${partName ?? partOem}`.trim(),
        guideId: guide.id,
      },
    });

    // Enqueue AI generation (non-blocking)
    guideQueue.enqueue(guide.id, () => this.generateGuide(guide.id, input));

    return guide;
  }

  async getById(id: string, userId: string) {
    const guide = await prisma.repairGuide.findUnique({
      where: { id },
      include: {
        vehicle: true,
        part: true,
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!guide) throw new AppError('Guide not found', 404);
    if (guide.userId !== userId) throw new AppError('Access denied', 403);

    return guide;
  }

  async getStatus(id: string, userId: string) {
    const guide = await prisma.repairGuide.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, errorMessage: true },
    });

    if (!guide) throw new AppError('Guide not found', 404);
    if (guide.userId !== userId) throw new AppError('Access denied', 403);

    return guide;
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [guides, total] = await Promise.all([
      prisma.repairGuide.findMany({
        where: { userId },
        include: { vehicle: true, part: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.repairGuide.count({ where: { userId } }),
    ]);

    return { guides, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ─── AI Generation ──────────────────────────────────────────────────────────

  private async generateGuide(guideId: string, input: CreateGuideInput): Promise<void> {
    try {
      await prisma.repairGuide.update({ where: { id: guideId }, data: { status: 'generating' } });

      // Fetch connector context (external sources)
      const connectorResults = await fetchConnectorContext({
        vehicleMake: input.vehicleMake ?? '',
        vehicleModel: input.vehicleModel ?? '',
        vehicleYear: input.vehicleYear,
        vin: input.vin,
        partName: input.partName ?? '',
        partOem: input.partOem,
      });

      const contextBlock = connectorResults.length
        ? `\nReference material from external sources:\n${connectorResults.map((r) => `[${r.source}] ${r.content}`).join('\n\n')}`
        : '';

      const prompt = `You are an expert automotive and heavy machinery repair technician.
Generate a detailed, accurate repair guide for the following:

Vehicle: ${input.vehicleMake ?? 'Unknown'} ${input.vehicleModel ?? ''} ${input.vehicleYear ?? ''} ${input.vin ? `(VIN: ${input.vin})` : ''}
Part/System: ${input.partName ?? input.partOem ?? 'Unknown'}
${contextBlock}

Return a JSON object with EXACTLY this structure (no markdown, pure JSON):
{
  "title": "string — concise title, e.g. 'Brake Pad Replacement — Toyota Camry 2020'",
  "difficulty": "easy|medium|hard",
  "estimatedTime": "string, e.g. '1-2 hours'",
  "safetyNotes": ["string", ...],
  "tools": ["string", ...],
  "materials": ["string", ...],
  "oemSummary": "string — 2-3 sentences about the OEM part specification, torque specs, compatibility",
  "steps": [
    {
      "stepNumber": 1,
      "title": "string",
      "description": "string — detailed, clear instruction",
      "warning": "string or null"
    }
  ]
}

Rules:
- Include 6-12 steps
- Safety notes must be specific to this repair
- Tools list must be complete and specific
- OEM summary must include torque specs if applicable
- Use metric units primarily`;

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse JSON from Claude's response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in AI response');

      const generated: GeneratedGuide = JSON.parse(jsonMatch[0]);

      // Persist steps and update guide
      await prisma.$transaction(async (tx) => {
        await tx.guideStep.deleteMany({ where: { guideId } });

        await tx.guideStep.createMany({
          data: generated.steps.map((s) => ({
            guideId,
            stepNumber: s.stepNumber,
            title: s.title,
            description: s.description,
            warning: s.warning ?? null,
          })),
        });

        await tx.repairGuide.update({
          where: { id: guideId },
          data: {
            title: generated.title,
            status: 'ready',
            difficulty: generated.difficulty,
            estimatedTime: generated.estimatedTime,
            safetyNotes: generated.safetyNotes,
            tools: generated.tools,
            materials: generated.materials,
            oemSummary: generated.oemSummary,
            errorMessage: null,
          },
        });
      });

      logger.info(`Guide ${guideId} generated successfully`);
    } catch (error) {
      logger.error(`Guide ${guideId} generation failed`, error);
      await prisma.repairGuide.update({
        where: { id: guideId },
        data: { status: 'failed', errorMessage: String(error) },
      });
    }
  }
}

export const guidesService = new GuidesService();
