-- profiles
alter table public.profiles enable row level security;
create policy "users can read all profiles"  on public.profiles for select using (true);
create policy "users can update own profile" on public.profiles for update
  using (auth.uid()::text = id::text);

-- skills
alter table public.skills enable row level security;
create policy "anyone can read skills"    on public.skills for select using (true);
create policy "owner can insert"          on public.skills for insert
  with check (auth.uid()::text = submitted_by::text);
create policy "owner or admin can update" on public.skills for update using (
  auth.uid()::text = submitted_by::text or
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);

-- endorsements
alter table public.endorsements enable row level security;
create policy "anyone can read endorsements" on public.endorsements for select using (true);
create policy "authenticated can endorse"    on public.endorsements for insert
  with check (
    auth.uid() is not null and
    auth.uid()::text != (select submitted_by::text from public.skills where id = skill_id)
  );
create policy "endorser can delete own"      on public.endorsements for delete
  using (auth.uid()::text = endorsed_by::text);

-- skill_edges
alter table public.skill_edges enable row level security;
create policy "anyone can read approved edges" on public.skill_edges for select using (approved = true);
create policy "admins can manage edges"        on public.skill_edges for all using (
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);

-- skill_requests
alter table public.skill_requests enable row level security;
create policy "anyone can read requests" on public.skill_requests for select using (true);
create policy "owner can insert"         on public.skill_requests for insert
  with check (auth.uid()::text = requested_by::text);

-- audit_log — only admins can read
alter table public.audit_log enable row level security;
create policy "admins can read audit log" on public.audit_log for select using (
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);
