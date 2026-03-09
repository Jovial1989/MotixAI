import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24";

export interface GuideStep {
  order: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
}

export interface GeneratedGuide {
  title: string;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  steps: GuideStep[];
  imagePlan: string[];
}

// ── Drawing specification ────────────────────────────────────────────────────

export interface DrawingSpec {
  vehicle: string;
  part: string;
  stepTitle: string;
  viewType: "exploded" | "cross-section" | "perspective" | "cutaway" | "overhead" | "side";
  keyComponents: string[];
  toolsShown: string[];
  callouts: Array<{ number: number; label: string }>;
  torqueNote: string | null;
  warningCallout: string | null;
  referenceContext: string;
}

// ── Gemini client ────────────────────────────────────────────────────────────

function getClient(): GoogleGenerativeAI | null {
  const key = Deno.env.get("GEMINI_API_KEY");
  return key && key !== "replace-with-real-key" ? new GoogleGenerativeAI(key) : null;
}

// ── Mock fallbacks ───────────────────────────────────────────────────────────

function mockGuide(vehicle: string, part: string): GeneratedGuide {
  const steps: GuideStep[] = Array.from({ length: 10 }, (_, i) => ({
    order: i + 1,
    title: `Step ${i + 1}: ${i === 0 ? "Preparation" : "Procedure"}`,
    instruction:
      i === 0
        ? `Stabilize ${vehicle}, disconnect power, and prepare workspace around ${part}.`
        : `Perform operation ${i + 1} on ${part} using OEM-safe technique and verify alignment.`,
    torqueValue: i % 3 === 0 ? `${25 + i * 2} Nm` : null,
    warningNote: i % 4 === 0 ? "Wear eye and hand protection." : null,
  }));
  return {
    title: `${part} replacement guide`,
    difficulty: "Intermediate",
    timeEstimate: "90-120 min",
    tools: ["Socket set", "Torque wrench", "Trim tools", "Thread locker"],
    safetyNotes: [
      "Isolate battery and hydraulic pressure before disassembly.",
      "Use jack stands and wheel chocks on level ground.",
    ],
    steps,
    imagePlan: steps.slice(0, 8).map((s) => `Engineering diagram for ${part}, ${s.title}`),
  };
}

function mockDrawingSpec(vehicle: string, part: string, stepTitle: string): DrawingSpec {
  return {
    vehicle,
    part,
    stepTitle,
    viewType: "perspective",
    keyComponents: [part, "mounting bracket", "fasteners"],
    toolsShown: ["socket wrench", "torque wrench"],
    callouts: [
      { number: 1, label: part },
      { number: 2, label: "bolt" },
      { number: 3, label: "bracket" },
    ],
    torqueNote: null,
    warningCallout: null,
    referenceContext: `Standard OEM workshop diagram for ${part} on ${vehicle}`,
  };
}

// ── Guide generation ─────────────────────────────────────────────────────────

export async function generateRepairGuide(
  vehicle: string,
  part: string,
  context?: string,
): Promise<GeneratedGuide> {
  const client = getClient();
  if (!client) return mockGuide(vehicle, part);

  const prompt = `You are an automotive workshop technician writing a repair procedure.

Vehicle: ${vehicle}
Part: ${part}
${context ? `Manual context: ${context}` : ""}

WRITING RULES — strictly follow these:
- title: short action phrase (e.g. "Loosen wheel nuts", "Remove caliper bracket")
- instruction: 2–4 numbered sub-steps. Format exactly:
  "1. First action with specific details.\n2. Second action.\n3. Third action if needed."
  Each sub-step: one clear imperative action, beginner-friendly, include tool or spec where relevant.
  Good sub-step: "1. Insert a 14mm socket onto the drain plug and turn counter-clockwise to remove."
  Bad sub-step: "1. Make sure the plug is removed carefully."
- warningNote: only if a real safety risk exists. One sentence. Null otherwise.
- torqueValue: only if a specific torque applies. Format: "120 Nm". Null otherwise.
- safetyNotes: 2–3 concise pre-job safety checks. One sentence each.
- Never write filler: "Make sure to", "It is important to", "carefully", "at this point"

Respond ONLY with valid JSON:
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
  "imagePlan": ["string (visual subject for diagram, e.g. 'caliper bolt removal tool engaged on M12 bolt')"]
}

Generate 8–10 steps. Include real torque specs and clearances where standard specs apply.`;

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json) as GeneratedGuide;
  } catch {
    return mockGuide(vehicle, part);
  }
}

// ── Phase 1+2: Reference search & analysis → DrawingSpec ────────────────────
//
// Uses gemini-2.5-flash to consult its knowledge of OEM workshop manuals and
// output a structured DrawingSpec describing the optimal illustration layout.
// Google Search grounding can be enabled here by adding tools: [{ googleSearch: {} }]
// when a Search API quota is available — it will ground the response in real
// OEM diagram references from the web.

export async function buildDrawingSpec(step: {
  stepOrder: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
  tools: string[];
  vehicleModel: string;
  partName: string;
}): Promise<DrawingSpec> {
  const client = getClient();
  if (!client) return mockDrawingSpec(step.vehicleModel, step.partName, step.title);

  const prompt = `You are a technical illustration director for an automotive workshop manual publisher.

Task: Specify the exact layout for a technical line drawing that will be created by an AI image model.

Vehicle: ${step.vehicleModel}
Part / System: ${step.partName}
Step action: ${step.title}
Step instruction: ${step.instruction}
${step.torqueValue ? `Torque spec: ${step.torqueValue}` : ""}
${step.warningNote ? `Safety note: ${step.warningNote}` : ""}
Available tools: ${step.tools.join(", ") || "standard hand tools"}

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
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      vehicle: step.vehicleModel,
      part: step.partName,
      stepTitle: step.title,
      viewType: parsed.viewType ?? "perspective",
      keyComponents: Array.isArray(parsed.keyComponents) ? parsed.keyComponents.slice(0, 6) : [],
      toolsShown: Array.isArray(parsed.toolsShown) ? parsed.toolsShown.slice(0, 3) : [],
      callouts: Array.isArray(parsed.callouts) ? parsed.callouts.slice(0, 5) : [],
      torqueNote: parsed.torqueNote ?? null,
      warningCallout: parsed.warningCallout ?? null,
      referenceContext: parsed.referenceContext ?? "",
    };
  } catch (err) {
    console.error("[gemini] buildDrawingSpec failed, using fallback:", err instanceof Error ? err.message : err);
    return mockDrawingSpec(step.vehicleModel, step.partName, step.title);
  }
}

// ── Phase 3: Image generation from structured spec ──────────────────────────

export function specToImagePrompt(spec: DrawingSpec): string {
  const componentsStr = spec.keyComponents.join(", ");
  const toolsStr = spec.toolsShown.join(", ") || "standard hand tools";
  const torqueLine = spec.torqueNote ? `Torque arrow showing: ${spec.torqueNote}` : "";
  const warningLine = spec.warningCallout ? "Include a warning triangle symbol (no text)." : "";
  const calloutsNums = spec.callouts.map((c) => String(c.number)).join(", ");
  const viewNote =
    spec.viewType === "exploded" ? "Exploded-view with alignment guidelines." :
    spec.viewType === "cross-section" ? "Cross-section with hatching on cut surfaces." :
    spec.viewType === "cutaway" ? "Partial cutaway revealing internal components." : "";

  return `Technical workshop manual line drawing. Black ink on white background. Style: Haynes/Chilton service manual.

Subject: ${spec.vehicle} — ${spec.stepTitle}
View: ${spec.viewType} close-up — ${spec.referenceContext}
Components: ${componentsStr}
Tools: ${toolsStr}
${torqueLine}
${warningLine}
${calloutsNums ? `Circled callout numbers ${calloutsNums} with thin leader lines pointing to relevant components.` : ""}
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

export async function generateIllustrationFromSpec(spec: DrawingSpec): Promise<string> {
  const client = getClient();
  if (!client) {
    const label = encodeURIComponent(`${spec.part} — ${spec.stepTitle}`.slice(0, 50));
    return `https://placehold.co/1200x800/f1f5f9/94a3b8?text=${label}`;
  }

  const prompt = specToImagePrompt(spec);

  const model = (client.getGenerativeModel as Function)({
    model: "gemini-2.0-flash-exp-image-generation",
  });

  console.log(`[image-gen] generating from spec: ${spec.stepTitle} (${spec.viewType} view)`);
  const result = await (model.generateContent as Function)({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  });
  console.log("[image-gen] Gemini response received");

  const candidates: unknown[] = (result.response.candidates as unknown[]) ?? [];
  for (const candidate of candidates) {
    const parts: unknown[] =
      (candidate as { content?: { parts?: unknown[] } }).content?.parts ?? [];
    for (const part of parts) {
      const p = part as { inlineData?: { data?: string; mimeType?: string } };
      if (p.inlineData?.data) {
        const mime = p.inlineData.mimeType ?? "image/png";
        console.log(`[image-gen] image ready mime=${mime}`);
        return `data:${mime};base64,${p.inlineData.data}`;
      }
    }
  }

  throw new Error("No image data returned from Gemini");
}

// ── Legacy single-call generator (backward compat) ───────────────────────────

export async function generateStepImage(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return `https://placehold.co/1200x800/f1f5f9/94a3b8?text=${encodeURIComponent(prompt.slice(0, 50))}`;
  }

  const model = (client.getGenerativeModel as Function)({
    model: "gemini-2.0-flash-exp-image-generation",
  });

  console.log("[image-gen] calling Gemini gemini-2.0-flash-exp-image-generation");
  const result = await (model.generateContent as Function)({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  });
  console.log("[image-gen] Gemini response received");

  const candidates: unknown[] = (result.response.candidates as unknown[]) ?? [];
  for (const candidate of candidates) {
    const parts: unknown[] =
      (candidate as { content?: { parts?: unknown[] } }).content?.parts ?? [];
    for (const part of parts) {
      const p = part as { inlineData?: { data?: string; mimeType?: string } };
      if (p.inlineData?.data) {
        const mime = p.inlineData.mimeType ?? "image/png";
        console.log("[image-gen] got inline image data, mime=" + mime);
        return `data:${mime};base64,${p.inlineData.data}`;
      }
    }
  }

  throw new Error("No image data returned from Gemini");
}
