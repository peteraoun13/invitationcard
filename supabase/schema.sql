create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  bride_name text not null,
  groom_name text not null,
  wedding_date timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  family_name text not null,
  invite_token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  guest_name text not null,
  attending boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvp_submissions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  notes text
);

create table if not exists public.guest_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.rsvp_submissions(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  attending boolean not null,
  unique (submission_id, guest_id)
);

create index if not exists families_wedding_id_idx on public.families(wedding_id);
create index if not exists families_invite_token_idx on public.families(invite_token);
create index if not exists guests_family_id_idx on public.guests(family_id);
create index if not exists rsvp_submissions_family_id_idx on public.rsvp_submissions(family_id);
create index if not exists guest_responses_submission_id_idx on public.guest_responses(submission_id);
create index if not exists guest_responses_guest_id_idx on public.guest_responses(guest_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
before update on public.guests
for each row
execute function public.set_updated_at();

create or replace function public.submit_family_rsvp(
  p_invite_token text,
  p_attending_guest_ids uuid[],
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_submission_id uuid;
begin
  select id
  into v_family_id
  from public.families
  where invite_token = p_invite_token;

  if v_family_id is null then
    raise exception 'Invalid invitation token';
  end if;

  if exists (
    select 1
    from unnest(p_attending_guest_ids) as selected_guest_id
    where not exists (
      select 1
      from public.guests
      where id = selected_guest_id
        and family_id = v_family_id
    )
  ) then
    raise exception 'One or more selected guests do not belong to this invitation';
  end if;

  insert into public.rsvp_submissions (family_id, notes)
  values (v_family_id, nullif(trim(p_notes), ''))
  returning id into v_submission_id;

  insert into public.guest_responses (submission_id, guest_id, attending)
  select
    v_submission_id,
    guests.id,
    guests.id = any(coalesce(p_attending_guest_ids, array[]::uuid[]))
  from public.guests
  where guests.family_id = v_family_id;

  update public.guests
  set attending = guests.id = any(coalesce(p_attending_guest_ids, array[]::uuid[]))
  where guests.family_id = v_family_id;

  return v_submission_id;
end;
$$;

alter table public.weddings enable row level security;
alter table public.admin_users enable row level security;
alter table public.families enable row level security;
alter table public.guests enable row level security;
alter table public.rsvp_submissions enable row level security;
alter table public.guest_responses enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

drop policy if exists "Admins can read their own authorization" on public.admin_users;
create policy "Admins can read their own authorization"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated admins can manage weddings" on public.weddings;
create policy "Authenticated admins can manage weddings"
on public.weddings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated admins can manage families" on public.families;
create policy "Authenticated admins can manage families"
on public.families
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated admins can manage guests" on public.guests;
create policy "Authenticated admins can manage guests"
on public.guests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated admins can manage submissions" on public.rsvp_submissions;
create policy "Authenticated admins can manage submissions"
on public.rsvp_submissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated admins can manage guest responses" on public.guest_responses;
create policy "Authenticated admins can manage guest responses"
on public.guest_responses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on function public.submit_family_rsvp(text, uuid[], text) from public;
revoke all on function public.submit_family_rsvp(text, uuid[], text) from anon;
revoke all on function public.submit_family_rsvp(text, uuid[], text) from authenticated;
grant execute on function public.submit_family_rsvp(text, uuid[], text) to service_role;
