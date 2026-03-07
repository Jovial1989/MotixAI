import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21";

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

function getClient(): GoogleGenerativeAI | null {
  const key = Deno.env.get("GEMINI_API_KEY");
  return key && key !== "replace-with-real-key" ? new GoogleGenerativeAI(key) : null;
}

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
- instruction: 1–2 sentences MAX. Imperative voice. Direct action only.
  Good: "Loosen the two M12 caliper bolts and slide the caliper off the bracket."
  Bad: "At this point you will want to carefully make sure that the caliper is loosened."
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
      "instruction": "string",
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

export async function generateStepImage(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return `https://placehold.co/1200x800/f1f5f9/94a3b8?text=${encodeURIComponent(prompt.slice(0, 50))}`;
  }

  // gemini-2.0-flash-exp-image-generation is the supported image generation model
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
