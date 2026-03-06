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

  const prompt = `You are an expert automotive and heavy equipment repair technician.
Generate a detailed repair guide for:
- Vehicle: ${vehicle}
- Part: ${part}
${context ? `- Manual context: ${context}` : ""}

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
      "instruction": "string (detailed, 1-3 sentences)",
      "torqueValue": "string or null",
      "warningNote": "string or null"
    }
  ],
  "imagePlan": ["string (image description for each step)"]
}

Generate 8-10 steps. Include torque values where relevant. imagePlan should have one entry per step.`;

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

  // gemini-2.0-flash-exp supports responseModalities IMAGE
  const model = (client.getGenerativeModel as Function)({
    model: "gemini-2.0-flash-exp",
  });

  console.log("[image-gen] calling Gemini gemini-2.0-flash-exp");
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
