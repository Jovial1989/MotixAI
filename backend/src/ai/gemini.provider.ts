import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, ExplainStepInput, GeneratedGuide, GuideGenerationInput } from './ai-provider.interface';
import { SourcePackage } from './source-adapters/source-package.types';

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

  async explainStep(input: ExplainStepInput): Promise<string> {
    if (!this.client) {
      return `This step involves: ${input.instruction.split('\n')[0]}. Ensure all safety precautions are followed and use the specified tools for accurate results.`;
    }
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are an expert automotive and heavy equipment repair technician.
A technician is following a repair guide for: ${input.vehicleModel} — ${input.partName}
Current step: "${input.stepTitle}"
Instruction: ${input.instruction}

${input.question ? `Question: ${input.question}` : 'Explain this step in more detail with practical workshop tips.'}

Provide a clear, concise answer (2-4 sentences) focused on practical workshop guidance.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      this.logger.error(`explainStep failed: ${err instanceof Error ? err.message : err}`);
      return 'Could not get AI explanation at this time. Please try again.';
    }
  }

  async synthesizeFromSource(pkg: SourcePackage): Promise<GeneratedGuide> {
    // Build the step-by-step source text to ground Gemini's output
    const stepsText = pkg.steps
      .map((s) => {
        const torque = s.torqueSpec ? `\n  Torque spec: ${s.torqueSpec}` : '';
        const warn = s.warningNote ? `\n  Warning: ${s.warningNote}` : '';
        return `Step ${s.order} — ${s.title}:\n  ${s.rawText}${torque}${warn}`;
      })
      .join('\n\n');

    const sourceLabel = `${pkg.sourceProvider} (${pkg.make} ${pkg.model} ${pkg.year})`;

    // If Gemini is unavailable fall back to a direct synthesis from the source data
    if (!this.client) {
      return this.synthesizeFromSourceMock(pkg);
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are a technical editor reviewing a verified repair procedure sourced from ${sourceLabel}.
Your task is to restructure the provided source text into a clean, beginner-friendly repair guide.

RULES:
- Do NOT invent steps, torque values, or specifications not present in the source text.
- Rephrase each source step into a clear, numbered instruction (2–4 sub-steps per step).
- Preserve all torque specs and warnings exactly as given.
- instruction format: "1. Action.\\n2. Action.\\n3. Action." (newlines as \\n)
- Keep the exact number of steps provided in the source.
- safetyNotes: use the provided safety notes.
- tools: use the provided tools list.

SOURCE DATA:
Vehicle: ${pkg.make} ${pkg.model} ${pkg.year}
Task: ${pkg.taskType.replace(/_/g, ' ')}
Component: ${pkg.component}
Difficulty: ${pkg.difficulty}
Time: ${pkg.timeEstimate}
Tools: ${pkg.tools.join(', ')}
Safety notes: ${pkg.safetyNotes.join(' | ')}

SOURCE STEPS:
${stepsText}

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "string",
  "difficulty": "${pkg.difficulty}",
  "timeEstimate": "${pkg.timeEstimate}",
  "tools": ["string"],
  "safetyNotes": ["string"],
  "steps": [
    {
      "order": 1,
      "title": "string",
      "instruction": "string (2–4 numbered lines)",
      "torqueValue": "string or null",
      "warningNote": "string or null"
    }
  ],
  "imagePlan": ["string (one brief image description per step)"]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(json) as GeneratedGuide;
    } catch (err) {
      this.logger.error(`synthesizeFromSource failed: ${err instanceof Error ? err.message : err}`);
      return this.synthesizeFromSourceMock(pkg);
    }
  }

  async synthesizeFromWeb(
    make: string,
    model: string,
    year: number,
    component: string,
    taskType: string,
  ): Promise<GeneratedGuide> {
    const vehicleLabel = `${year} ${make} ${model}`;
    const taskLabel = taskType.replace(/_/g, ' ');

    if (!this.client) {
      return this.mockGuide({ vehicle: vehicleLabel, part: component });
    }

    try {
      const geminiModel = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are an expert automotive and heavy equipment repair technician.
Generate a detailed, workshop-grade repair guide for:
- Vehicle: ${vehicleLabel}
- Task: ${taskLabel}
- Component: ${component}

Use your general knowledge of this vehicle and task. Be as specific as possible for this make/model/year.

WRITING RULES:
- title: short action phrase (e.g. "Drain engine oil", "Remove drain plug")
- instruction: 2–4 numbered sub-steps. Format exactly:
  "1. First action with specific detail.\\n2. Second action.\\n3. Third action if needed."
  Each sub-step: one clear imperative action, beginner-friendly, include tool or spec where relevant.
- warningNote: only if a real safety risk exists. One sentence. Null otherwise.
- torqueValue: only if a specific torque applies to this vehicle. Format: "120 Nm". Null otherwise.
- safetyNotes: 2–3 concise pre-job safety checks specific to this vehicle/task.
- tools: list the specific tools needed for this task on this vehicle.

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

Generate 8-10 steps. Include torque values where relevant for this specific vehicle. imagePlan should have one entry per step.`;

      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(json) as GeneratedGuide;
    } catch (err) {
      this.logger.error(`synthesizeFromWeb failed: ${err instanceof Error ? err.message : err}`);
      return this.mockGuide({ vehicle: vehicleLabel, part: component });
    }
  }

  private synthesizeFromSourceMock(pkg: SourcePackage): GeneratedGuide {
    return {
      title: `${pkg.make} ${pkg.model} — ${pkg.component}`,
      difficulty: pkg.difficulty,
      timeEstimate: pkg.timeEstimate,
      tools: pkg.tools,
      safetyNotes: pkg.safetyNotes,
      steps: pkg.steps.map((s) => ({
        order: s.order,
        title: s.title,
        instruction: s.rawText,
        torqueValue: s.torqueSpec ?? undefined,
        warningNote: s.warningNote ?? undefined,
      })),
      imagePlan: pkg.steps.map(
        (s) => `Technical diagram: ${pkg.make} ${pkg.model} ${s.title}`,
      ),
    };
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
