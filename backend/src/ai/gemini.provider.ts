import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, GeneratedGuide, GuideGenerationInput } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI | null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    this.client = key && key !== 'replace-with-real-key' ? new GoogleGenerativeAI(key) : null;
    if (!this.client) {
      this.logger.warn('GEMINI_API_KEY not set — using mock guide data');
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      await model.generateContent('ping');
      return true;
    } catch {
      return false;
    }
  }

  async generateRepairGuide(input: GuideGenerationInput): Promise<GeneratedGuide> {
    if (!this.client) {
      return this.mockGuide(input);
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are an expert automotive and heavy equipment repair technician.
Generate a detailed repair guide for:
- Vehicle: ${input.vehicle}
- Part: ${input.part}
${input.context ? `- Manual context: ${input.context}` : ''}

WRITING RULES:
- title: short action phrase (e.g. "Loosen wheel nuts", "Remove caliper bracket")
- instruction: 2–4 numbered sub-steps. Format exactly:
  "1. First action with specific detail.\\n2. Second action.\\n3. Third action if needed."
  Each sub-step: one clear imperative action, beginner-friendly, include tool or spec where relevant.
- warningNote: only if a real safety risk exists. One sentence. Null otherwise.
- torqueValue: only if a specific torque applies. Format: "120 Nm". Null otherwise.
- safetyNotes: 2–3 concise pre-job safety checks.

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "string",
  "difficulty": "Beginner|Intermediate|Advanced|Expert",
  "timeEstimate": "string (e.g. '45-60 min')",
  "tools": ["string"],
  "safetyNotes": ["string"],
  "steps": [
    {
      "order": 1,
      "title": "string",
      "instruction": "string (2–4 numbered lines: '1. Action.\\n2. Action.\\n3. Action.')",
      "torqueValue": "string or null",
      "warningNote": "string or null"
    }
  ],
  "imagePlan": ["string (image description for each step)"]
}

Generate 8-10 steps. Include torque values where relevant. imagePlan should have one entry per step.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(json) as GeneratedGuide;
    } catch (err) {
      this.logger.error(`Gemini generation failed: ${err instanceof Error ? err.message : err}`);
      return this.mockGuide(input);
    }
  }

  private mockGuide(input: GuideGenerationInput): GeneratedGuide {
    const steps = Array.from({ length: 10 }).map((_, idx) => ({
      order: idx + 1,
      title: `Step ${idx + 1}: ${idx === 0 ? 'Preparation' : 'Procedure'}`,
      instruction:
        idx === 0
          ? `Stabilize ${input.vehicle}, disconnect power, and prepare workspace around ${input.part}.`
          : `Perform operation ${idx + 1} on ${input.part} using OEM-safe technique and verify alignment.`,
      torqueValue: idx % 3 === 0 ? `${25 + idx * 2} Nm` : undefined,
      warningNote: idx % 4 === 0 ? 'Wear eye and hand protection.' : undefined,
    }));

    return {
      title: `${input.part} replacement guide`,
      difficulty: 'Intermediate',
      timeEstimate: '90-120 min',
      tools: ['Socket set', 'Torque wrench', 'Trim tools', 'Thread locker'],
      safetyNotes: [
        'Isolate battery and hydraulic pressure before disassembly.',
        'Use jack stands and wheel chocks on level ground.',
      ],
      steps,
      imagePlan: steps.slice(0, 8).map((s) => `Engineering diagram for ${input.part}, ${s.title}`),
    };
  }
}
