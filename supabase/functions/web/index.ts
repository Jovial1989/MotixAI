/**
 * SPA static-file server for the Next.js export hosted in Supabase Storage.
 *
 * Bucket name: "web" (public)
 * Upload the contents of web/out/ to this bucket after `yarn build:web`.
 *
 * URL pattern: https://<project>.supabase.co/functions/v1/web/<path>
 * Falls back to /index.html for all unknown paths (client-side routing).
 */

import { CORS_HEADERS } from "../api/_lib/cors.ts";

const STORAGE_BASE =
  Deno.env.get("STORAGE_BASE_URL") ??
  `https://${Deno.env.get("SUPABASE_URL")?.replace("https://", "") ?? ""}/storage/v1/object/public/web`;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".txt":  "text/plain",
};

function ext(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot) : "";
}

async function fetchAsset(path: string): Promise<Response | null> {
  const url = `${STORAGE_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const contentType = CONTENT_TYPES[ext(path)] ?? "application/octet-stream";
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
  });
}

async function fetchIndex(): Promise<Response> {
  const res = await fetchAsset("/index.html");
  if (res) return res;
  return new Response("<html><body>App not deployed yet.</body></html>", {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  let path = url.pathname.replace(/^\/functions\/v1\/web/, "") || "/";
  if (path === "" || path === "/") path = "/index.html";

  // Try exact path first
  const asset = await fetchAsset(path);
  if (asset) return asset;

  // For paths without an extension (client-side routes), serve index.html
  if (!ext(path)) return fetchIndex();

  return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
});
