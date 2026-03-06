import { corsPreflightResponse, errorResponse, json } from "./_lib/cors.ts";
import { extractUser } from "./_lib/jwt.ts";
import { handleAuth } from "./routes/auth.ts";
import { handleGuides } from "./routes/guides.ts";
import { handleSteps } from "./routes/steps.ts";
import { handleEnterprise } from "./routes/enterprise.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return corsPreflightResponse();

  const url = new URL(req.url);

  // Strip function prefix: /functions/v1/api → ""
  const pathRaw = url.pathname.replace(/^\/functions\/v1\/api/, "") || "/";
  const path = pathRaw || "/";
  const method = req.method;

  // Health
  if (path === "/" || path === "/health") {
    return json({ status: "ok", timestamp: new Date().toISOString() });
  }

  // Auth routes — no auth required
  if (path.startsWith("/auth")) {
    return handleAuth(req, method, path.replace("/auth", ""));
  }

  // Protected routes — require valid JWT
  const user = await extractUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  if (path.startsWith("/guides")) {
    return handleGuides(req, method, path.replace("/guides", ""), user);
  }

  if (path.startsWith("/steps")) {
    return handleSteps(req, method, path.replace("/steps", ""), user);
  }

  if (path.startsWith("/enterprise")) {
    return handleEnterprise(req, method, path.replace("/enterprise", ""), user);
  }

  return errorResponse("Not Found", 404);
});
