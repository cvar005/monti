-- Monti: invite several people to a goal with a relationship, and let invitees join as free "goal guests".
-- Run after 0001_init.sql.

alter table public.goal_invites add column relationship text not null default 'pareja';
alter table public.goal_members add column relationship text;

-- Profiles: 'founding' = full app, 'guest' = only sees the goals they were invited to
alter table public.profiles add constraint profiles_plan_check check (plan in ('founding', 'guest', 'base', 'climber', 'summit'));

create or replace function public.accept_goal_invite(invite_code text, guest_name text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  g uuid;
  rel text;
  members int;
begin
  select goal_id, relationship into g, rel from public.goal_invites where code = invite_code and accepted_by is null;
  if g is null then raise exception 'invalid_or_used_invite'; end if;

  select count(*) into members from public.goal_members where goal_id = g;
  if members >= 5 then raise exception 'goal_full'; end if;

  insert into public.goal_members (goal_id, user_id, role, relationship) values (g, auth.uid(), 'partner', rel)
    on conflict (goal_id, user_id) do nothing;
  update public.goal_invites set accepted_by = auth.uid() where code = invite_code;

  -- Someone new to Monti joins free, only for the goals they're invited to
  update public.profiles
    set plan = 'guest', onboarded = true, name = coalesce(nullif(trim(guest_name), ''), name)
    where id = auth.uid() and onboarded = false;
  return g;
end $$;

drop function if exists public.goal_people(uuid);
create function public.goal_people(g uuid) returns table (user_id uuid, name text, role text, relationship text)
language sql security definer stable set search_path = '' as $$
  select m.user_id, p.name, m.role, m.relationship from public.goal_members m
  join public.profiles p on p.id = m.user_id
  where m.goal_id = g and public.is_goal_member(g)
  order by m.joined_at;
$$;

-- Let a person leave a goal they were invited to
create policy "members leave goals" on public.goal_members for delete using (user_id = auth.uid() and role = 'partner');
