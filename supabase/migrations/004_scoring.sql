create or replace function public.compute_skill_score(skill_id uuid)
returns int language plpgsql security definer as $$
declare
  s                 public.skills%rowtype;
  endorsement_count int;
  desc_pts          int := 0;
  evidence_pts      int := 0;
  years_pts         int := 0;
  recency_pts       int := 0;
  endorse_pts       int := 0;
  total             int := 0;
  badge_val         text;
  current_year      int := extract(year from now())::int;
begin
  select * into s from public.skills where id = skill_id;
  select count(*) into endorsement_count from public.endorsements where skill_id = s.id;

  desc_pts := case
    when length(s.description) > 150 then 20
    when length(s.description) >= 50  then 10
    else 0
  end;

  evidence_pts := case
    when cardinality(s.evidence_urls) >= 3 then 25
    when cardinality(s.evidence_urls) = 2  then 18
    when cardinality(s.evidence_urls) = 1  then 10
    else 0
  end;

  years_pts := case
    when s.years_experience >= 5 then 15
    when s.years_experience >= 3 then 10
    when s.years_experience >= 1 then 5
    else 0
  end;

  recency_pts := case
    when s.last_used_year is null                        then 0
    when current_year - s.last_used_year <= 1            then 15
    when current_year - s.last_used_year <= 2            then 10
    when current_year - s.last_used_year <= 3            then 5
    else 0
  end;

  endorse_pts := case
    when endorsement_count >= 3 then 25
    when endorsement_count = 2  then 18
    when endorsement_count = 1  then 10
    else 0
  end;

  total := desc_pts + evidence_pts + years_pts + recency_pts + endorse_pts;

  badge_val := case
    when total >= 85 then 'expert'
    when total >= 70 then 'proficient'
    when total >= 50 then 'beginner'
    else 'none'
  end;

  -- disable triggers temporarily to prevent recursive firing
  set local session_replication_role = replica;
  update public.skills set score = total, badge = badge_val, updated_at = now() where id = skill_id;
  set local session_replication_role = default;

  return total;
end;
$$;

create or replace function public.trigger_score_skill() returns trigger as $$
begin
  perform public.compute_skill_score(NEW.id);
  return NEW;
end;
$$ language plpgsql;

create trigger score_on_upsert
  after insert or update of description, evidence_urls, years_experience, last_used_year
  on public.skills for each row execute function public.trigger_score_skill();

create or replace function public.trigger_score_on_endorsement() returns trigger as $$
begin
  perform public.compute_skill_score(coalesce(NEW.skill_id, OLD.skill_id));
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger score_on_endorsement
  after insert or delete on public.endorsements
  for each row execute function public.trigger_score_on_endorsement();
