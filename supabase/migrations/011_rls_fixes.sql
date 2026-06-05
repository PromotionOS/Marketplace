-- Fix: split overly broad "for all" edge policy into specific operations
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

-- Fix: add role check constraint on profiles
alter table public.profiles add constraint if not exists profiles_role_check
  check (role in ('member', 'reviewer', 'admin'));
