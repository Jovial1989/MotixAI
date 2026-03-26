import { corsPreflightResponse, errorResponse, json } from "./_lib/cors.ts";
import { extractUser } from "./_lib/jwt.ts";
import { handleAdmin } from "./routes/admin.ts";
import { handleAnalytics } from "./routes/analytics.ts";
import { handleAuth } from "./routes/auth.ts";
import { handleEnterprise } from "./routes/enterprise.ts";
import { handleGuides } from "./routes/guides.ts";
import { handleJobs } from "./routes/jobs.ts";
import { handleRequests } from "./routes/requests.ts";
import { handleSteps } from "./routes/steps.ts";
import { handleVehicles } from "./routes/vehicles.ts";
import { handleUser } from "./routes/user.ts";
import { handleBilling, handleBillingWebhook } from "./routes/billing.ts";
import { handleChat } from "./routes/chat.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const url = new URL(req.url);

    // Extract path after the function name "api", regardless of host prefix format.
    const pathMatch = url.pathname.match(/\/api(\/.*)?$/);
    const path = pathMatch ? (pathMatch[1] || "/") : "/";
    const method = req.method;

    // Health
    if (path === "/" || path === "/health") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // Auth routes — no auth required
    if (path.startsWith("/auth")) {
      return handleAuth(req, method, path.replace("/auth", ""));
    }

    // Public support assistant routes
    if (path.startsWith("/chat")) {
      return handleChat(req, method, path.replace("/chat", ""));
    }

    // Billing webhook — no auth required (uses Stripe signature verification)
    if (path === "/billing/webhook" && method === "POST") {
      return handleBillingWebhook(req);
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

    if (path.startsWith("/jobs")) {
      return handleJobs(req, method, path.replace("/jobs", ""), user);
    }

    if (path.startsWith("/requests")) {
      return handleRequests(req, method, path.replace("/requests", ""), user);
    }

    if (path.startsWith("/analytics")) {
      return handleAnalytics(req, method, path.replace("/analytics", ""), user);
    }

    if (path.startsWith("/vehicles")) {
      return handleVehicles(req, method, path.replace("/vehicles", ""), user);
    }

    if (path.startsWith("/admin")) {
      return handleAdmin(req, method, path.replace("/admin", ""), user);
    }

    if (path.startsWith("/user")) {
      return handleUser(req, method, path.replace("/user", ""), user);
    }

    if (path.startsWith("/billing")) {
      return handleBilling(req, method, path.replace("/billing", ""), user);
    }

    return errorResponse("Not Found", 404);
  } catch (err) {
    console.error("[api] unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
});
