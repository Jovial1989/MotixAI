import { GoogleGenAI } from "npm:@google/genai";

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

export interface LocalizedGuide {
  title: string;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  partName: string;
  steps: GuideStep[];
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

// ── Language support ─────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  uk: "Ukrainian (Українська)",
  bg: "Bulgarian (Български)",
  de: "German (Deutsch)",
  fr: "French (Français)",
  es: "Spanish (Español)",
};

function languageInstruction(lang?: string): string {
  if (!lang || lang === "en") return "";
  const name = LANGUAGE_NAMES[lang] || lang;
  return `\nCRITICAL LANGUAGE REQUIREMENT: Generate ALL text output (title, every step title, every instruction, all tool names, all safety notes, all warnings) in ${name}. Do NOT use English for any generated text. Every single word must be in ${name}.\n`;
}

// ── Gemini client ────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI | null {
  const key = Deno.env.get("GEMINI_API_KEY");
  return key && key !== "replace-with-real-key" ? new GoogleGenAI({ apiKey: key }) : null;
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

// ── Source-backed synthesis ───────────────────────────────────────────────────
//
// Given a SourcePackage (seeded Nissan/Toyota data), uses Gemini to reformat
// the raw source steps into the standard GeneratedGuide format.
// Never invents steps or specs — only reformats what the source provides.

import type { SourcePackage } from "./sources/types.ts";

export async function synthesizeFromSource(pkg: SourcePackage, language?: string): Promise<GeneratedGuide> {
  const client = getClient();

  // Build structured source text to ground the prompt
  const stepsText = pkg.steps
    .map((s) => {
      const torque = s.torqueSpec ? `\n  Torque spec: ${s.torqueSpec}` : "";
      const warn = s.warningNote ? `\n  Warning: ${s.warningNote}` : "";
      return `Step ${s.order} — ${s.title}:\n  ${s.rawText}${torque}${warn}`;
    })
    .join("\n\n");

  const sourceLabel = `${pkg.sourceProvider} (${pkg.make} ${pkg.model} ${pkg.year})`;

  // Mock fallback: directly convert source data without Gemini
  if (!client) {
    return {
      title: `${pkg.component} — ${pkg.make} ${pkg.model} ${pkg.year}`,
      difficulty: pkg.difficulty,
      timeEstimate: pkg.timeEstimate,
      tools: pkg.tools,
      safetyNotes: pkg.safetyNotes,
      steps: pkg.steps.map((s) => ({
        order: s.order,
        title: s.title,
        instruction: s.rawText,
        torqueValue: s.torqueSpec ?? null,
        warningNote: s.warningNote ?? null,
      })),
      imagePlan: pkg.steps.map((s) =>
        `Technical diagram: ${pkg.make} ${pkg.model} — ${s.title}`
      ),
    };
  }

  const prompt = `You are a technical editor reviewing a verified repair procedure sourced from ${sourceLabel}.
Your task is to restructure the provided source text into a clean, beginner-friendly repair guide.
${languageInstruction(language)}
RULES:
- Do NOT invent steps, torque values, or specifications not present in the source text.
- Rephrase each source step into a clear, numbered instruction (2–4 sub-steps per step).
- Preserve all torque specs and warnings exactly as given.
- instruction format: "1. Action.\\n2. Action.\\n3. Action." (newlines as \\n)
- Keep the exact number of steps provided in the source.
- safetyNotes: use the provided safety notes exactly.
- tools: use the provided tools list exactly.

SOURCE DATA:
Vehicle: ${pkg.make} ${pkg.model} ${pkg.year}
Task: ${pkg.taskType.replace(/_/g, " ")}
Component: ${pkg.component}
Difficulty: ${pkg.difficulty}
Time: ${pkg.timeEstimate}
Tools: ${pkg.tools.join(", ")}
Safety notes: ${pkg.safetyNotes.join(" | ")}

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

  try {
    const result = await getClient()!.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const text = (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json) as GeneratedGuide;
  } catch (err) {
    console.error("[gemini] synthesizeFromSource failed, using direct conversion:", err instanceof Error ? err.message : err);
    // Direct conversion fallback
    return {
      title: `${pkg.component} — ${pkg.make} ${pkg.model} ${pkg.year}`,
      difficulty: pkg.difficulty,
      timeEstimate: pkg.timeEstimate,
      tools: pkg.tools,
      safetyNotes: pkg.safetyNotes,
      steps: pkg.steps.map((s) => ({
        order: s.order,
        title: s.title,
        instruction: s.rawText,
        torqueValue: s.torqueSpec ?? null,
        warningNote: s.warningNote ?? null,
      })),
      imagePlan: pkg.steps.map((s) =>
        `Technical diagram: ${pkg.make} ${pkg.model} — ${s.title}`
      ),
    };
  }
}

// ── Guide generation ─────────────────────────────────────────────────────────

export async function generateRepairGuide(
  vehicle: string,
  part: string,
  context?: string,
  language?: string,
): Promise<GeneratedGuide> {
  const client = getClient();
  if (!client) return mockGuide(vehicle, part);

  const prompt = `You are an automotive workshop technician writing a repair procedure.
${languageInstruction(language)}
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
    const result = await client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const text = (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
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

// Hard timeout for spec generation — prevents hanging on slow thinking model.
// On timeout the catch block returns mockDrawingSpec so the pipeline continues.
const SPEC_TIMEOUT_MS = 10_000;

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
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`spec timeout after ${SPEC_TIMEOUT_MS}ms`)), SPEC_TIMEOUT_MS),
    );
    const result = await Promise.race([
      client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt }),
      timeoutPromise,
    ]);
    const text = (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
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
  const torqueLine = spec.torqueNote ? `Torque reference: ${spec.torqueNote}.` : "";
  const warningLine = spec.warningCallout ? "Include a subtle warning marker only." : "";
  const calloutsNums = spec.callouts.map((c) => `(${c.number}) ${c.label}`).join(", ");
  const viewNote =
    spec.viewType === "exploded" ? "Exploded manual view with precise alignment." :
    spec.viewType === "cross-section" ? "Cross-section service-manual view." :
    spec.viewType === "cutaway" ? "Cutaway mechanical view." :
    spec.viewType === "overhead" ? "Overhead service-manual framing." :
    spec.viewType === "side" ? "Side technical framing." :
    "Perspective workshop-manual framing.";

  return `Clean technical line drawing of a car maintenance step:
${spec.referenceContext}. ${spec.stepTitle}. Components visible: ${componentsStr}. Tools visible: ${toolsStr}. ${viewNote} ${torqueLine} ${warningLine}

Minimalist, white background, precise mechanical details,
instructional manual style, no colors except subtle accents,
high clarity, professional automotive guide illustration.

Consistency requirements:
- same framing family across steps
- crisp black line art with light grey structure shading only
- subtle orange accent only for force direction, highlight, or warning cue
- no random icons, no emojis, no decorative UI elements
- no full human figure, no face, no photo-real rendering
- no text labels, no watermark, no title bar
- single technical composition only
${calloutsNums ? `- use discreet numbered callouts for: ${calloutsNums}` : ""}`;
}

// Hard timeout for image generation — Gemini image model can hang for minutes.
const IMAGE_TIMEOUT_MS = 35_000;

export async function generateIllustrationFromSpec(spec: DrawingSpec): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Gemini image generation is not configured");

  const prompt = specToImagePrompt(spec);

  console.log(`[image-gen] generating from spec: ${spec.stepTitle} (${spec.viewType} view)`);

  const imageTimeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Image generation timed out after ${IMAGE_TIMEOUT_MS}ms`)), IMAGE_TIMEOUT_MS),
  );

  const result = await Promise.race([
    client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: { responseModalities: ["IMAGE", "TEXT"] },
    }),
    imageTimeoutPromise,
  ]);
  console.log("[image-gen] Gemini response received");

  for (const part of result.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType ?? "image/png";
      console.log(`[image-gen] image ready mime=${mime}`);
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
}

// ── Ask AI: step explanation ─────────────────────────────────────────────────

export async function explainStep(
  stepTitle: string,
  instruction: string,
  vehicleModel: string,
  partName: string,
  question: string,
  language?: string,
): Promise<string> {
  const client = getClient();

  if (!client) {
    // Fallback when no Gemini key: summarise the step text locally
    const firstLine = instruction.split("\n")[0].replace(/^\d+\.\s*/, "").trim();
    return `This step (${stepTitle}) involves: ${firstLine}. Ensure all safety precautions are followed and use the specified tools for accurate results.`;
  }

  try {
    const prompt = `You are an expert automotive and heavy equipment repair technician.
${languageInstruction(language)}
A technician is following a repair guide for: ${vehicleModel} — ${partName}
Current step: "${stepTitle}"
Instruction: ${instruction}

${question ? `Question: ${question}` : "Explain this step in more detail with practical workshop tips."}

Provide a clear, concise answer (2-4 sentences) focused on practical workshop guidance.`;

    const result = await client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  } catch (err) {
    console.error("[gemini] explainStep failed:", err instanceof Error ? err.message : err);
    // Return a local fallback instead of crashing
    const firstLine = instruction.split("\n")[0].replace(/^\d+\.\s*/, "").trim();
    return `This step involves: ${firstLine}. Double-check torque specs and use the correct tools listed in the guide.`;
  }
}

export async function localizeGuide(
  guide: LocalizedGuide,
  language?: string,
): Promise<LocalizedGuide> {
  const lang = language ?? "en";
  if (lang === "en") return guide;

  const client = getClient();
  if (!client) return guide;

  try {
    const prompt = `You are a localization editor for automotive workshop procedures.
${languageInstruction(lang)}

Translate the guide JSON below into the requested language.

Rules:
- Keep the same step count and the same order values.
- Keep all numbering already present inside each instruction.
- Preserve torque values, warnings, safety notes, and workshop meaning exactly.
- Translate difficulty, time estimate, part name, tools, safety notes, step titles, and instructions.
- Do NOT leave English text unless it is a vehicle model, OEM code, or product code.
- For Ukrainian and Bulgarian, use Cyrillic script for every translated field. If a translated field is still English, the response is invalid.
- Keep the tone concise and professional.

Respond ONLY with valid JSON:
{
  "title": "string",
  "difficulty": "string",
  "timeEstimate": "string",
  "tools": ["string"],
  "safetyNotes": ["string"],
  "partName": "string",
  "steps": [
    {
      "order": 1,
      "title": "string",
      "instruction": "string",
      "torqueValue": "string or null",
      "warningNote": "string or null"
    }
  ]
}

Guide JSON:
${JSON.stringify(guide)}`;

    const result = await client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const text = (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const localized = JSON.parse(json) as LocalizedGuide;
    if (!localized.steps || localized.steps.length !== guide.steps.length) return guide;
    return localized;
  } catch (err) {
    console.error("[gemini] localizeGuide failed:", err instanceof Error ? err.message : err);
    return guide;
  }
}

// ── Legacy single-call generator (backward compat) ───────────────────────────

export async function generateStepImage(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Gemini image generation is not configured");

  console.log("[image-gen] calling Gemini gemini-2.5-flash-image");
  const result = await client.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });
  console.log("[image-gen] Gemini response received");

  for (const part of result.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType ?? "image/png";
      console.log("[image-gen] got inline image data, mime=" + mime);
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
}
