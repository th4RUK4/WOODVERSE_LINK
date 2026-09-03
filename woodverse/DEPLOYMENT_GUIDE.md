# WoodVerse Deployment Guide

## Prerequisites
- GitHub repo with this codebase
- Accounts on the platforms you choose below

---

## Railway + Vercel + Supabase (Recommended)

### 1. Database: Supabase PostgreSQL

1. Go to https://supabase.com → Sign up
2. New project → Name: `woodverse-db`
3. Go to **Settings → Database → Connection string**
4. Copy the **URI** format connection string
5. Save this as `DATABASE_URL`

### 2. Backend API: Railway

1. Push your code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo, root dir: `woodverse/backend/api`
4. Railway auto-detects Node.js
5. Add environment variables:
   - `DATABASE_URL` = your Supabase connection string
   - `JWT_SECRET` = random 32+ character string
   - `AI_SERVICE_URL` = your AI service URL (set after step 3)
   - `WEB_ORIGIN` = your frontend URL
   - `DB_SSL` = `true`
   - `AI_SERVICE_API_KEY` = random string
6. Railway gives you a public URL like `https://woodverse-api.up.railway.app`

### 3. AI Service: Railway

1. New Project → Deploy from GitHub (same repo)
2. Root dir: `woodverse/backend/ai-service`
3. Add environment variable:
   - `AI_SERVICE_API_KEY` = same value as API service
4. Railway gives you a public URL like `https://woodverse-ai.up.railway.app`
5. Go back to API service settings and update `AI_SERVICE_URL` to this URL

### 4. Frontend: Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Root directory: `woodverse/frontend`
4. Framework: Vite (auto-detected)
5. Add environment variable:
   - `VITE_API_URL` = your Railway API URL, for example `https://woodverse-api.up.railway.app`
6. Deploy → Vercel gives you `https://your-project.vercel.app`
7. Go back to Railway API and update `WEB_ORIGIN` to this Vercel URL

---

---

## Environment Variables Summary

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `JWT_SECRET` | API | Random secret for JWT signing |
| `AI_SERVICE_API_KEY` | API + AI | Shared secret for AI service auth |
| `AI_SERVICE_URL` | API | Public URL of AI service |
| `WEB_ORIGIN` | API | Frontend URL (comma-separated if multiple) |
| `DB_SSL` | API | `true` for managed databases such as Supabase |
| `VITE_API_URL` | Frontend | Public URL of API service |

---

## Verify Deployment

```bash
# API health
curl https://your-api-url/api/health

# AI health
curl https://your-ai-url/health

# Test login (requires user in DB)
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Database Notes

- The API auto-runs `database/schema.sql` on first connection
- For Supabase, the connection string from Settings → Database includes SSL by default
- Never use `rejectUnauthorized: false` with managed databases

---

## Security Checklist Before Production

- [ ] `JWT_SECRET` is a strong random string (32+ chars)
- [ ] `AI_SERVICE_API_KEY` is set and not the default
- [ ] `DATABASE_URL` uses SSL (Supabase/Render do this automatically)
- [ ] `WEB_ORIGIN` is your actual frontend domain
- [ ] Leaked credentials revoked (Vercel OIDC token, old DB passwords)
- [ ] CORS only allows your frontend origin
