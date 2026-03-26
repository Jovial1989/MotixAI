ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS "generation" TEXT,
  ADD COLUMN IF NOT EXISTS "imageCacheKey" TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

CREATE TABLE IF NOT EXISTS vehicle_image_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  model_name TEXT NOT NULL,
  year INTEGER,
  generation TEXT,
  display_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instruction_images (
  id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  prompt TEXT,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT instruction_images_instruction_step_unique UNIQUE (instruction_id, step_number)
);

CREATE INDEX IF NOT EXISTS vehicle_image_cache_manufacturer_model_idx
  ON vehicle_image_cache (manufacturer, model_name, year, generation);

CREATE INDEX IF NOT EXISTS instruction_images_instruction_idx
  ON instruction_images (instruction_id);
