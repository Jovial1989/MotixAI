import { errorResponse, json } from "../_lib/cors.ts";
import { generateAssistantReply, type AssistantChatTurn } from "../_lib/gemini.ts";

const SUPPORT_EMAIL = "petrov.cpay@gmail.com";
const ESCALATION_KEYWORDS = [
  "contact human",
  "support",
  "manager",
  "talk to person",
  "talk to a person",
  "human",
];

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeTurns(value: unknown): AssistantChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = "role" in item && (item.role === "user" || item.role === "assistant") ? item.role : null;
      const content = "content" in item && typeof item.content === "string"
        ? item.content.trim().slice(0, 1500)
        : "";
      if (!role || !content) return null;
      return { role, content } satisfies AssistantChatTurn;
    })
    .filter((item): item is AssistantChatTurn => Boolean(item));
}

function messageSuggestsHuman(value: string): boolean {
  const normalized = value.toLowerCase();
  return ESCALATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

async function sendSupportEmail(params: {
  name: string;
  email: string;
  message: string;
  language: string;
  pagePath?: string;
  pageTitle?: string;
  transcript?: AssistantChatTurn[];
}): Promise<{ id: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const from = Deno.env.get("SUPPORT_FROM_EMAIL") || "Motixi Support <onboarding@resend.dev>";
  const transcriptHtml = (params.transcript ?? [])
    .slice(-8)
    .map((turn) => `<li><strong>${turn.role === "user" ? "User" : "Assistant"}:</strong> ${escapeHtml(turn.content)}</li>`)
    .join("");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New support request from Motixi</h2>
      <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      <p><strong>Language:</strong> ${escapeHtml(params.language || "en")}</p>
      <p><strong>Page:</strong> ${escapeHtml(params.pageTitle || "Unknown")} ${params.pagePath ? `(${escapeHtml(params.pagePath)})` : ""}</p>
      <p><strong>Message:</strong></p>
      <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
        ${escapeHtml(params.message).replaceAll("\n", "<br />")}
      </div>
      ${transcriptHtml ? `<p style="margin-top: 24px;"><strong>Recent chat transcript:</strong></p><ol>${transcriptHtml}</ol>` : ""}
    </div>
  `.trim();

  const text = [
    "New support request from Motixi",
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Language: ${params.language || "en"}`,
    `Page: ${params.pageTitle || "Unknown"}${params.pagePath ? ` (${params.pagePath})` : ""}`,
    "",
    "Message:",
    params.message,
    ...(params.transcript?.length
      ? [
        "",
        "Recent chat transcript:",
        ...params.transcript.slice(-8).map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`),
      ]
      : []),
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      from,
      to: [SUPPORT_EMAIL],
      subject: "New support request from Motixi",
      html,
      text,
      reply_to: params.email,
    }),
  });

  const raw = await response.text();
  let payload: { id?: string; message?: string } = {};
  try {
    payload = raw ? JSON.parse(raw) as { id?: string; message?: string } : {};
  } catch {
    payload = { message: raw || undefined };
  }
  if (!response.ok || !payload.id) {
    throw new Error(payload.message || `Resend request failed: ${response.status}`);
  }

  return { id: payload.id };
}

export async function handleChat(
  req: Request,
  method: string,
  subpath: string,
): Promise<Response> {
  if (subpath === "/message" && method === "POST") {
    const input = await body(req);
    const language = sanitizeText(input.language, 12) || "en";
    const pagePath = sanitizeText(input.pagePath, 200);
    const pageTitle = sanitizeText(input.pageTitle, 200);
    const messages = normalizeTurns(input.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

    if (!latestUserMessage) {
      return errorResponse("A user message is required", 400);
    }

    const reply = await generateAssistantReply(messages, language, { pagePath, pageTitle });
    return json({
      reply,
      escalationSuggested: messageSuggestsHuman(latestUserMessage),
    });
  }

  if (subpath === "/escalate" && method === "POST") {
    const input = await body(req);
    const name = sanitizeText(input.name, 120);
    const email = sanitizeText(input.email, 160).toLowerCase();
    const message = sanitizeText(input.message, 4000);
    const language = sanitizeText(input.language, 12) || "en";
    const pagePath = sanitizeText(input.pagePath, 200);
    const pageTitle = sanitizeText(input.pageTitle, 200);
    const transcript = normalizeTurns(input.transcript);

    if (!name || !email || !message) {
      return errorResponse("name, email, and message are required", 400);
    }
    if (!isValidEmail(email)) {
      return errorResponse("email must be a valid email", 400);
    }

    const result = await sendSupportEmail({
      name,
      email,
      message,
      language,
      pagePath,
      pageTitle,
      transcript,
    });

    return json({
      ok: true,
      id: result.id,
      submittedAt: new Date().toISOString(),
    });
  }

  return errorResponse("Not Found", 404);
}
