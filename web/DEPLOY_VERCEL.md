# Deploying web to Vercel

## Required environment variable

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api` |

---

## Option A — Vercel Git Integration (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import this Git repository.
2. When asked for settings, set **Root Directory** to `web`.
3. Vercel will auto-detect Next.js — leave Build Command and Output Directory at defaults.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api`
5. Click **Deploy**.

Every push to `main` will auto-deploy.

---

## Option B — Vercel CLI

```bash
# Install CLI
npm install -g vercel

# From the web directory
cd web

# First deploy (interactive — sets up project)
vercel

# When prompted:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N (first time)
#   What's your project's name? → motixai-web (or any)
#   In which directory is your code? → ./ (already in web/)
#   Want to override the settings? → N

# Set the env var
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api

# Production deploy
vercel --prod
```

---

## Expected URL

```
https://motixai-web.vercel.app
```

(exact subdomain depends on project name chosen during setup)
