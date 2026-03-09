import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '@nestjs/common';

// ── Drawing specification ────────────────────────────────────────────────────

export interface DrawingSpec {
  vehicle: string;
  part: string;
  stepTitle: string;
  viewType: 'exploded' | 'cross-section' | 'perspective' | 'cutaway' | 'overhead' | 'side';
  keyComponents: string[];
  toolsShown: string[];
  callouts: Array<{ number: number; label: string }>;
  torqueNote: string | null;
  warningCallout: string | null;
  referenceContext: string;
}

export interface StepContext {
  stepOrder: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
  tools: string[];
  vehicleModel: string;
  partName: string;
}

// ── Fallback spec ─────────────────────────────────────────────────────────────

function fallbackSpec(ctx: StepContext): DrawingSpec {
  return {
    vehicle: ctx.vehicleModel,
    part: ctx.partName,
    stepTitle: ctx.title,
    viewType: 'perspective',
    keyComponents: [ctx.partName, 'mounting bracket', 'fasteners'],
    toolsShown: ctx.tools.slice(0, 3),
    callouts: [
      { number: 1, label: ctx.partName.split(' ').slice(0, 2).join(' ') },
      { number: 2, label: 'bolt' },
      { number: 3, label: 'bracket' },
    ],
    torqueNote: ctx.torqueValue ?? null,
    warningCallout: ctx.warningNote ? 'CAUTION' : null,
    referenceContext: `Standard OEM workshop diagram for ${ctx.partName} on ${ctx.vehicleModel}`,
  };
}

// ── Spec → image prompt ───────────────────────────────────────────────────────

export function specToImagePrompt(spec: DrawingSpec): string {
  const componentsStr = spec.keyComponents.join(', ');
  const toolsStr = spec.toolsShown.join(', ') || 'standard hand tools';
  const torqueLine = spec.torqueNote ? `Torque arrow showing: ${spec.torqueNote}` : '';
  const warningLine = spec.warningCallout ? 'Include a warning triangle symbol (no text).' : '';
  const calloutsNums = spec.callouts.map((c) => String(c.number)).join(', ');
  const viewNote =
    spec.viewType === 'exploded' ? 'Exploded-view with alignment guidelines.' :
    spec.viewType === 'cross-section' ? 'Cross-section with hatching on cut surfaces.' :
    spec.viewType === 'cutaway' ? 'Partial cutaway revealing internal components.' : '';

  return `Technical workshop manual line drawing. Black ink on white background. Style: Haynes/Chilton service manual.

Subject: ${spec.vehicle} — ${spec.stepTitle}
View: ${spec.viewType} close-up — ${spec.referenceContext}
Components: ${componentsStr}
Tools: ${toolsStr}
${torqueLine}
${warningLine}
${calloutsNums ? `Circled callout numbers ${calloutsNums} with thin leader lines pointing to relevant components.` : ''}
${viewNote}

ABSOLUTE RULES — no exceptions:
- Show ONLY the relevant component and the immediately surrounding area. Tight close-up framing.
- NO full human body, NO face, NO person shown. Disembodied hands holding tools are acceptable.
- NO artistic style, NO manga, NO sketch art, NO painterly effects. Engineering line art ONLY.
- ZERO text, ZERO letters, ZERO words anywhere — not even partial labels or numbers
- Only circled numerals (①②③) are permitted as callout markers
- Black outlines only — NO colour fills, NO grey shading, NO gradients
- Single diagram — NO split panels, NO multiple views
- NO title bar, NO border frame, NO watermark, NO background texture
- Directional arrows showing rotation, removal direction, or applied force where relevant`;
}

// ── Prompt builder service ────────────────────────────────────────────────────

export class PromptBuilder {
  private readonly logger = new Logger(PromptBuilder.name);
  private readonly client: GoogleGenerativeAI | null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    this.client = key && key !== 'replace-with-real-key' ? new GoogleGenerativeAI(key) : null;
  }

  // Phase 1+2: consult Gemini's knowledge of OEM manuals → DrawingSpec
  // Google Search grounding can be added here via tools: [{ googleSearch: {} }]
  // when a Search API quota is available.
  async buildDrawingSpec(ctx: StepContext): Promise<DrawingSpec> {
    if (!this.client) return fallbackSpec(ctx);

    const prompt = `You are a technical illustration director for an automotive workshop manual publisher.

Task: Specify the exact layout for a technical line drawing that will be created by an AI image model.

Vehicle: ${ctx.vehicleModel}
Part / System: ${ctx.partName}
Step action: ${ctx.title}
Step instruction: ${ctx.instruction}
${ctx.torqueValue ? `Torque spec: ${ctx.torqueValue}` : ''}
${ctx.warningNote ? `Safety note: ${ctx.warningNote}` : ''}
Available tools: ${ctx.tools.join(', ') || 'standard hand tools'}

Based on your knowledge of OEM workshop manuals (Haynes, Chilton, factory service manuals) for this vehicle type, specify the optimal illustration layout.

Respond ONLY with valid JSON — no prose, no markdown fences:
{
  "viewType": "exploded|cross-section|perspective|cutaway|overhead|side",
  "keyComponents": ["list of up to 6 specific component names to label in the drawing"],
  "toolsShown": ["list of up to 3 tools to include in the diagram"],
  "callouts": [
    { "number": 1, "label": "short component name" },
    { "number": 2, "label": "short component name" }
  ],
  "torqueNote": "e.g. '120 Nm' or null",
  "warningCallout": "one-word safety symbol label, or null",
  "referenceContext": "one sentence describing what a typical OEM diagram for this step shows"
}

Rules:
- callout labels: 1–3 words maximum, noun only (no verbs)
- keyComponents: specific part names (e.g. 'caliper bracket bolt', not 'part')
- viewType: choose the view that best exposes the action described`;

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        vehicle: ctx.vehicleModel,
        part: ctx.partName,
        stepTitle: ctx.title,
        viewType: parsed.viewType ?? 'perspective',
        keyComponents: Array.isArray(parsed.keyComponents) ? parsed.keyComponents.slice(0, 6) : [],
        toolsShown: Array.isArray(parsed.toolsShown) ? parsed.toolsShown.slice(0, 3) : [],
        callouts: Array.isArray(parsed.callouts) ? parsed.callouts.slice(0, 5) : [],
        torqueNote: parsed.torqueNote ?? null,
        warningCallout: parsed.warningCallout ?? null,
        referenceContext: parsed.referenceContext ?? '',
      };
    } catch (err) {
      this.logger.warn(`buildDrawingSpec failed, using fallback: ${err instanceof Error ? err.message : err}`);
      return fallbackSpec(ctx);
    }
  }
}
