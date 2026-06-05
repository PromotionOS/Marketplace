# Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix profile-missing crash, add profile completion flow for new users, remove extra Clerk API call from proxy, fix admin RLS gap, add profile update functionality.

**Architecture:** New /onboarding page for new users with no profile row. Proxy updated to use JWT claims instead of currentUser() for domain check. New migration for admin RLS fix. Profile edit on profile page.

**Tech Stack:** Next.js 16, Clerk v7, Supabase JS v2

---

## Task 1: Migration 011 — Fix admin RLS on skill_edges

Create `supabase/migrations/011_rls_fixes.sql`:

```sql
-- Fix: admins should see unapproved edges but NOT rejected/deleted ones
-- The current "for all" policy is too broad — split into specific operations
drop policy if exists "admins can manage edges" on public.skill_edges;

create policy "admins can read all edges" on public.skill_edges
  for select using (
    approved = true or
    exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
  );

create policy "admins can insert edges" on public.skill_edges
  for insert with check (
    exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
  );

create policy "admins can update edges" on public.skill_edges
  for update using (
    exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
  );

create policy "admins can delete edges" on public.skill_edges
  for delete using (
    exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
  );

-- Fix: prevent self-endorsement at DB level, not just RLS
alter table public.endorsements add constraint no_self_endorsement
  check (endorsed_by != (select submitted_by from public.skills where id = skill_id));

-- Fix: add role check constraint on profiles
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'reviewer', 'admin'));
```

---

## Task 2: Fix proxy.ts — remove currentUser() call

The current `proxy.ts` calls `currentUser()` on every request which is an extra Clerk API call. Instead, use the JWT token claims which are available without a network call.

Replace `proxy.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher(['/sign-in(.*)', '/unauthorized', '/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return

  await auth.protect()

  // Use JWT claims instead of currentUser() — no extra API call
  const { sessionClaims } = await auth()
  const email = (sessionClaims?.email as string) ?? ''

  if (email && !email.endsWith('@zopsmart.com')) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
})

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
```

**Note:** `email` needs to be added to the Clerk JWT template. In Clerk Dashboard → JWT Templates → supabase template, add:

```json
{
  "role": "authenticated",
  "email": "{{user.primary_email_address}}"
}
```

---

## Task 3: /onboarding page for new users

Create `app/(app)/onboarding/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import CustomSelect from '@/components/CustomSelect'

const TEAM_OPTIONS = [
  { value: 'Engineering',      label: 'Engineering' },
  { value: 'Data Engineering', label: 'Data Engineering' },
  { value: 'Frontend',         label: 'Frontend' },
  { value: 'DevOps',           label: 'DevOps' },
  { value: 'Product',          label: 'Product' },
  { value: 'Design',           label: 'Design' },
  { value: 'Data Science',     label: 'Data Science' },
  { value: 'Analytics',        label: 'Analytics' },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [team, setTeam] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!team) { setError('Please select your team'); return }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/skills')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl elevation-2 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">👋</p>
          <h1 className="text-2xl font-black text-gray-900">Welcome to SkillOS</h1>
          <p className="text-gray-400 text-sm mt-2">
            Hi {user?.firstName ?? 'there'}! One quick thing before we start.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which team are you on? *</label>
            <CustomSelect value={team} onChange={setTeam} options={TEAM_OPTIONS} placeholder="Select your team" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all elevation-1"
          >
            {submitting ? 'Saving…' : 'Let\'s go →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## Task 4: /api/onboarding route handler

Create `app/api/onboarding/route.ts`:

```ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { team } = await req.json()
  if (!team) return NextResponse.json({ error: 'Team required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ team })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

---

## Task 5: Profile-missing guard in app layout

Update `app/(app)/layout.tsx` to check if profile exists and redirect to onboarding if not:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (userId) {
    const supabase = await createSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, team')
      .eq('id', userId)
      .single()

    // Profile doesn't exist yet (webhook hasn't fired) — wait, don't crash
    // Profile exists but no team — redirect to onboarding
    if (profile && !profile.team) {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-up">
        {children}
      </main>
    </div>
  )
}
```

---

## Task 6: Add profile edit to profile page

Update `app/(app)/profile/[id]/page.tsx` to show an "Edit" button when viewing your own profile.

Add the import and own-profile check:

```tsx
import { auth } from '@clerk/nextjs/server'

// In the page function, after getting userId:
const isOwnProfile = userId === id
```

Add to the profile hero section JSX, after the name:

```tsx
{isOwnProfile && (
  <Link href="/settings/profile"
    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors font-medium">
    Edit Profile
  </Link>
)}
```

---

## Task 7: /settings/profile page

Create `app/(app)/settings/profile/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'

const TEAM_OPTIONS = [
  { value: 'Engineering',      label: 'Engineering' },
  { value: 'Data Engineering', label: 'Data Engineering' },
  { value: 'Frontend',         label: 'Frontend' },
  { value: 'DevOps',           label: 'DevOps' },
  { value: 'Product',          label: 'Product' },
  { value: 'Design',           label: 'Design' },
  { value: 'Data Science',     label: 'Data Science' },
  { value: 'Analytics',        label: 'Analytics' },
]

export default function ProfileSettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [team, setTeam] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSuccess(true)
      setTimeout(() => router.push(`/profile/${user?.id}`), 1000)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Profile Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Update your team information</p>

      <div className="bg-white rounded-2xl elevation-1 p-6">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">✅ Saved!</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
            <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
              {user?.fullName ?? 'Managed by Clerk — update via your account settings'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Team</label>
            <CustomSelect value={team} onChange={setTeam} options={TEAM_OPTIONS} placeholder="Select team" />
          </div>

          <button type="submit" disabled={saving || !team}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## Commit

```bash
git add supabase/migrations/011_rls_fixes.sql
git add proxy.ts
git add app/'(app)'/onboarding/page.tsx
git add app/api/onboarding/route.ts
git add app/'(app)'/layout.tsx
git add app/'(app)'/profile/'[id]'/page.tsx
git add app/'(app)'/settings/profile/page.tsx
git commit -m "feat: auth hardening — fix RLS, remove currentUser() from proxy, onboarding flow, profile edit"
git push
```
