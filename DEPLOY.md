# Supabase Deployment Guide

Project ref: `hxzpbvgwujuisxheykcr`
Region: ap-southeast-1 (Singapore)
API base: `https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api`
Web base: `https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/web`

---

## 0. One-time setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Authenticate
supabase login

# Link to the project
cd /Users/kpetrov/Documents/MotixAI
supabase link --project-ref hxzpbvgwujuisxheykcr
```

---

## 1. Apply the DB migration (adds image columns to RepairStep)

```bash
# Using psql directly against the Supabase pooler:
PGPASSWORD='*NissanQashqai5630' psql \
  "postgresql://postgres.hxzpbvgwujuisxheykcr@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20260305000000_add_step_image_cols.sql
```

Verify:
```bash
PGPASSWORD='*NissanQashqai5630' psql \
  "postgresql://postgres.hxzpbvgwujuisxheykcr@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -c '\d "RepairStep"'
```

---

## 2. Set Edge Function secrets

```bash
supabase secrets set \
  DATABASE_URL="postgresql://postgres.hxzpbvgwujuisxheykcr:*NissanQashqai5630@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" \
  JWT_ACCESS_SECRET="change-me-access-REPLACE-WITH-STRONG-SECRET" \
  JWT_REFRESH_SECRET="change-me-refresh-REPLACE-WITH-STRONG-SECRET" \
  JWT_ACCESS_EXPIRES_IN="15m" \
  JWT_REFRESH_EXPIRES_IN="7d" \
  GEMINI_API_KEY="your-gemini-api-key-here"
```

> Replace `change-me-*` with strong random secrets before deploying to production:
> ```bash
> openssl rand -hex 32   # run twice for access + refresh secrets
> ```

---

## 3. Deploy Edge Functions

```bash
# Deploy the API function (handles all /auth, /guides, /steps, /enterprise routes)
supabase functions deploy api --no-verify-jwt

# Deploy the web SPA function
supabase functions deploy web --no-verify-jwt
```

---

## 4. Create the Supabase Storage bucket for the web app

```bash
# Create a public bucket named "web"
supabase storage create-bucket web --public
```

Or via the Supabase dashboard: Storage → New bucket → name: `web`, public: yes.

---

## 5. Build and upload the web app

```bash
# Build the Next.js static export
cd /Users/kpetrov/Documents/MotixAI
yarn build:web

# The output is in web/out/
# Upload all files to the "web" bucket
supabase storage cp web/out/ ss://web/ --recursive
```

Alternatively, use the Supabase dashboard: Storage → web bucket → Upload → select all files from `web/out/`.

---

## 6. Verify

### API health check
```bash
curl https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Auth signup
```bash
curl -s -X POST https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .
# Expected: {"accessToken":"...","refreshToken":"...","user":{...}}
```

### Guest login
```bash
curl -s -X POST https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api/auth/guest | jq .
```

### Web app
Open in browser: `https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/web`

---

## 7. Mobile app (Flutter)

The Flutter app reads `API_BASE_URL` from `mobile_flutter/dart_defines.env`.
It is already set to the Supabase API URL via `--dart-define`.

For local development:
```bash
cd mobile_flutter
flutter pub get

# Run on simulator/emulator (reads dart_defines.env automatically)
flutter run -d ios
flutter run -d android
```

To build for release:
```bash
flutter build ipa    # iOS
flutter build apk    # Android
```

> **Legacy note:** The React Native / Expo app is in `mobile_rn_legacy/` and is deprecated.
> It is **not** used in production. See `mobile_rn_legacy/DEPRECATED.md`.

---

## Re-deploying after changes

```bash
# After changing Edge Function code:
supabase functions deploy api --no-verify-jwt
supabase functions deploy web --no-verify-jwt

# After changing web UI:
yarn build:web
supabase storage cp web/out/ ss://web/ --recursive
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` from API | JWT secrets must match between `supabase secrets set` and what clients use |
| `500` on guide creation | Check `GEMINI_API_KEY` secret is set; without it the mock guide is returned |
| Web app shows blank page | Make sure `web/out/` was uploaded to the `web` storage bucket |
| DB connection error | Verify `DATABASE_URL` uses the Session Pooler host: `aws-1-ap-southeast-1.pooler.supabase.com:5432` |
| `RepairStep` column missing | Run the migration in step 1 |
