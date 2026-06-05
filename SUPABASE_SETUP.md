# Supabase Setup Guide

## Step 1 — Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in:
   - **Name:** `SkillOS`
   - **Database password:** choose a strong one — save it somewhere safe
   - **Region:** pick closest to your users (US East recommended)
4. Click **"Create new project"** — takes ~2 minutes to provision

---

## Step 2 — Enable Extensions

Once the project is ready:

1. Left sidebar → **Database → Extensions**
2. Search for **`vector`** → click **Enable**
3. Search for **`pg_trgm`** → click **Enable**

Both are required:
- `vector` — for AI-powered skill similarity (pgvector)
- `pg_trgm` — for fuzzy skill name search

---

## Step 3 — Get Your API Keys

1. Left sidebar → **Project Settings → API**
2. Copy these three values — you'll need them for `.env.production`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (e.g. `https://abcdefgh.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon / public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key — click "Reveal" to see it |

---

## Step 4 — Run Database Migrations

After the API keys are added to `.env.production`, run from the `skillos/` directory:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The `project-ref` is the string in your project URL:
`https://supabase.com/dashboard/project/<project-ref>`

This applies all 5 migrations:
- `001_schema.sql` — all tables (profiles, skills, endorsements, skill_edges, skill_requests, audit_log)
- `002_rls.sql` — Row Level Security policies
- `003_search.sql` — full-text + fuzzy search RPC
- `004_scoring.sql` — auto-scoring triggers
- `005_pgvector.sql` — embedding column + similarity search

---

## Step 5 — Get a Groq API Key

The edge function uses Groq's free embedding API to power skill similarity.

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in
3. Left sidebar → **API Keys → Create API key**
4. Copy the key — you'll use it in Step 7

---

## Step 6 — Deploy Edge Functions

From the `skillos/` directory:

```bash
supabase functions deploy suggest-edges
supabase functions deploy sync-profile
```

These deploy:
- `suggest-edges` — fires on skill INSERT, generates embeddings via Groq, creates AI-suggested skill graph edges
- `sync-profile` — fires on Clerk `user.created` webhook, inserts a row into `profiles` table

---

## Step 7 — Set Groq Secret

```bash
supabase secrets set GROQ_API_KEY=<your-groq-api-key>
```

This stores the key securely in Supabase Vault — the edge function reads it at runtime.

---

## Step 8 — Set Up Database Webhook (for suggest-edges)

1. Supabase Dashboard → **Database → Webhooks**
2. Click **"Create a new hook"**
3. Fill in:
   - **Name:** `on_skill_insert`
   - **Table:** `skills`
   - **Events:** check `INSERT`
   - **Type:** Supabase Edge Functions
   - **Edge Function:** select `suggest-edges`
4. Click **"Confirm"**

This automatically triggers AI edge suggestions whenever a new skill is submitted.

---

## Step 9 — Configure Clerk JWT Template

This lets Supabase verify Clerk JWTs and enforce Row Level Security.

1. Clerk Dashboard → **Configure → JWT Templates**
2. Click **"New template"**
3. Fill in:
   - **Name:** `supabase` (must be exactly this)
   - **Claims:**
     ```json
     {
       "role": "authenticated"
     }
     ```
4. Copy the **JWKS Endpoint URL** — you'll need it for Supabase
5. Click **"Save"**

Then in Supabase:
1. Left sidebar → **Project Settings → API**
2. Scroll to **JWT Settings**
3. Change **JWT Secret** to use the Clerk JWKS URL instead
   - Or add it under **Auth → Providers → Custom JWT**

---

## Step 10 — Configure Clerk Webhook (after Vercel deploy)

Once you have your Vercel URL:

1. Clerk Dashboard → **Configure → Webhooks**
2. Click **"Add endpoint"**
3. Fill in:
   - **URL:** `https://<your-vercel-domain>/api/webhooks/clerk`
   - **Events:** check `user.created`
4. Click **"Create"**
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add it to `.env.production` as `CLERK_WEBHOOK_SECRET`

---

## Step 11 — Promote First Admin

After your first sign-in, run this in Supabase Dashboard → **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'your@zopsmart.com';
```

---

## Summary — All Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Signing Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` (hardcoded) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/skills` (hardcoded) |
