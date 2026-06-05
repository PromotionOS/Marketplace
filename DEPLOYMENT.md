# SkillOS Deployment Checklist

## 1. Supabase Setup
- Create a new Supabase project
- Enable extensions: Project Settings → Extensions → enable `vector` and `pg_trgm`
- Run migrations: `supabase db push` (requires [Supabase CLI](https://supabase.com/docs/guides/cli))
- Deploy Edge Functions:
  ```bash
  supabase functions deploy suggest-edges
  supabase functions deploy sync-profile
  ```
- Store Groq API key: `supabase secrets set GROQ_API_KEY=<key>`
- Set up DB webhook: Supabase Dashboard → Database → Webhooks → New webhook
  - Table: `skills`, Event: `INSERT`, URL: Edge Function URL for `suggest-edges`

## 2. Clerk Setup
- Create a Clerk application
- Add domain allowlist: Dashboard → Restrictions → Allowlist → `@yourdomain.com`
- Create JWT template named `supabase`:
  - Dashboard → JWT Templates → New template
  - Name: `supabase`
  - Claims: `{ "role": "authenticated" }`
- Configure webhook:
  - Dashboard → Webhooks → Add endpoint
  - URL: `https://<your-domain>/api/webhooks/clerk`
  - Events: `user.created`
  - Copy signing secret → set as `CLERK_WEBHOOK_SECRET` env var

## 3. Environment Variables

Set these in Vercel (or your hosting provider):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/skills
```

## 4. Vercel Deployment
1. Push repo to GitHub
2. Connect to Vercel: [vercel.com/new](https://vercel.com/new)
3. Set all environment variables above
4. Deploy

## 5. Post-Deploy
- Verify sign-in works (Clerk hosted UI at `/sign-in`)
- Create a test user — verify profile row appears in Supabase `profiles` table
- Submit a test skill — verify score is computed and badge is assigned
- Endorse a skill — verify score updates
- Check `/graph` — verify graph renders

## 6. Promoting a User to Admin
Run in Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```
