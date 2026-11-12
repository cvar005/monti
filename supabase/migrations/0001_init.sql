-- Monti: initial schema. Run in the Supabase SQL editor (or `supabase db push`).

-- Profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  currency text not null default 'GTQ' check (currency in ('GTQ','USD')),
  income numeric(12,2) not null default 0,
  split jsonb not null default '{"housing":30,"food":15,"transport":10,"fun":10,"bills":10,"goals":20,"other":5}',
  onboarded boolean not null default false,
  plan text not null default 'founding',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Expenses ---------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  merchant text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  date date not null default current_date,
  source text not null default 'manual' check (source in ('manual','scan','whatsapp')),
  receipt_path text,
  ai_confidence numeric(4,3),
  reviewed boolean not null default true,
  created_at timestamptz not null default now()
);
create index transactions_user_date on public.transactions (user_id, date desc);

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  match text not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- Goals (can be shared with a partner) -------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  target numeric(12,2) not null check (target > 0),
  deadline date not null,
  theme text not null default 'beach',
  owner_share int not null default 50 check (owner_share between 10 and 90),
  created_at timestamptz not null default now()
);

create table public.goal_members (
  goal_id uuid not null references public.goals on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'partner' check (role in ('owner','partner')),
  joined_at timestamptz not null default now(),
  primary key (goal_id, user_id)
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  amount numeric(12,2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index contributions_goal on public.contributions (goal_id, date desc);

create table public.goal_invites (
  code text primary key default substr(md5(random()::text), 1, 8),
  goal_id uuid not null references public.goals on delete cascade,
  created_by uuid not null references auth.users on delete cascade default auth.uid(),
  accepted_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- Owner is a member automatically
create function public.add_goal_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.goal_members (goal_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger on_goal_created after insert on public.goals
  for each row execute function public.add_goal_owner();

-- Membership check without RLS recursion
create function public.is_goal_member(g uuid) returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.goal_members where goal_id = g and user_id = auth.uid());
$$;

-- Accept a partner invite
create function public.accept_goal_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g uuid;
begin
  select goal_id into g from public.goal_invites where code = invite_code and accepted_by is null;
  if g is null then raise exception 'invalid_or_used_invite'; end if;
  insert into public.goal_members (goal_id, user_id, role) values (g, auth.uid(), 'partner')
    on conflict do nothing;
  update public.goal_invites set accepted_by = auth.uid() where code = invite_code;
  return g;
end $$;

-- Display names of the people on a shared goal
create function public.goal_people(g uuid) returns table (user_id uuid, name text, role text)
language sql security definer stable set search_path = '' as $$
  select m.user_id, p.name, m.role from public.goal_members m
  join public.profiles p on p.id = m.user_id
  where m.goal_id = g and public.is_goal_member(g);
$$;

-- Row level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.rules enable row level security;
alter table public.goals enable row level security;
alter table public.goal_members enable row level security;
alter table public.contributions enable row level security;
alter table public.goal_invites enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own transactions" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rules" on public.rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members read goals" on public.goals for select using (public.is_goal_member(id));
create policy "owner creates goals" on public.goals for insert with check (owner_id = auth.uid());
create policy "owner updates goals" on public.goals for update using (owner_id = auth.uid());
create policy "owner deletes goals" on public.goals for delete using (owner_id = auth.uid());

create policy "members read members" on public.goal_members for select using (public.is_goal_member(goal_id));

create policy "members read contributions" on public.contributions for select using (public.is_goal_member(goal_id));
create policy "members add contributions" on public.contributions for insert
  with check (user_id = auth.uid() and public.is_goal_member(goal_id));
create policy "own contributions delete" on public.contributions for delete using (user_id = auth.uid());

create policy "members read invites" on public.goal_invites for select using (public.is_goal_member(goal_id));
create policy "members create invites" on public.goal_invites for insert
  with check (created_by = auth.uid() and public.is_goal_member(goal_id));

-- Receipt images: private bucket, one folder per user ---------------------------
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;
create policy "own receipts read" on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own receipts write" on storage.objects for insert
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
