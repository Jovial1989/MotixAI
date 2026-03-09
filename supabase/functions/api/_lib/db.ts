import postgres from "npm:postgres@3";

// Lazily create the DB client so cold starts don't fail if DATABASE_URL is missing.
let _sql: ReturnType<typeof postgres> | null = null;

export function getDb(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = Deno.env.get("DATABASE_URL");
    if (!url) throw new Error("DATABASE_URL env var is required");
    _sql = postgres(url, {
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

// Tiny helper: generate a random ID compatible with TEXT primary keys.
export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
