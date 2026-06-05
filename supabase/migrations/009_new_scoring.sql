create or replace function public.compute_skill_score(skill_id uuid)
returns int language plpgsql security definer as $$
declare
  s                   public.skills%rowtype;
  endorsement_count   int;
  evidence_pts        int := 0;
  proficiency_pts     int := 0;
  endorsement_pts     int := 0;
  context_pts         int := 0;
  total               int := 0;
  badge_val           text;
begin
  select * into s from public.skills where id = skill_id;
  select count(*) into endorsement_count from public.endorsements where skill_id = s.id;

  -- Proficiency anchor (30 pts max)
  proficiency_pts := case s.proficiency_anchor
    when 'architect_and_mentor'  then 30
    when 'build_independently'   then 20
    when 'follow_tutorials'      then 10
    else case s.level
      when 'expert'     then 25
      when 'proficient' then 15
      when 'beginner'   then 8
      else 0
    end
  end;

  -- Typed evidence (35 pts max)
  select coalesce(sum(w.points), 0)
  into evidence_pts
  from public.skill_evidence se
  join public.evidence_type_weights w on w.evidence_type = se.evidence_type
  where se.skill_id = s.id
    and se.url is not null
    and se.url != '';

  evidence_pts := least(evidence_pts, 35);

  -- Endorsements (25 pts max)
  endorsement_pts := case
    when endorsement_count >= 5 then 25
    when endorsement_count >= 3 then 20
    when endorsement_count >= 2 then 15
    when endorsement_count >= 1 then 8
    else 0
  end;

  -- Context quality (10 pts max)
  context_pts := case
    when s.context is null or length(s.context) = 0 then 0
    when length(s.context) >= 50 then 10
    else 5
  end;

  total := proficiency_pts + evidence_pts + endorsement_pts + context_pts;

  badge_val := case
    when total >= 85 then 'expert'
    when total >= 70 then 'proficient'
    when total >= 50 then 'beginner'
    else 'none'
  end;

  set local session_replication_role = replica;
  update public.skills set score = total, badge = badge_val, updated_at = now() where id = skill_id;
  set local session_replication_role = default;

  return total;
end;
$$;

-- Recompute all existing skill scores
do $$
declare
  r record;
begin
  for r in select id from public.skills loop
    perform public.compute_skill_score(r.id);
  end loop;
end;
$$;
