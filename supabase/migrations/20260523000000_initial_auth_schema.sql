create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.orders cascade;
drop table if exists public.exception_notes cascade;
drop table if exists public.client_account_users cascade;
drop table if exists public.drivers cascade;
drop table if exists public.client_accounts cascade;
drop table if exists public.profiles cascade;
drop function if exists public.prevent_client_role_change() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.user_can_access_client_account(uuid) cascade;
drop function if exists public.is_dispatcher() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.set_updated_at() cascade;
drop type if exists public.app_role cascade;

create type public.app_role as enum ('dispatcher', 'client');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_account_users (
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_account_id uuid not null references public.client_accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, client_account_id)
);

create table public.drivers (
  id text primary key,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exception_notes (
  id uuid primary key default gen_random_uuid(),
  note text not null unique,
  severity_score integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exception_notes_severity_score_check check (
    severity_score between 1 and 10
  )
);

create table public.orders (
  id text primary key,
  client_account_id uuid not null references public.client_accounts (id),
  order_time timestamptz,
  pickup_zip text,
  delivery_zip text,
  service_type text,
  driver_id text,
  dispatch_time timestamptz,
  pickup_time timestamptz,
  delivery_time timestamptz,
  promised_eta timestamptz,
  on_time boolean,
  exception_notes text,
  exception_note_id uuid references public.exception_notes (id),
  driver_idle_min integer,
  fuel_cost_usd numeric(10, 2),
  redelivery_flag boolean not null default false,
  severity text not null default 'severity three',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in ('pending', 'assigned', 'in_transit', 'delivered', 'delayed', 'cancelled')
  ),
  constraint orders_severity_check check (
    severity in ('severity one', 'severity two', 'severity three')
  )
);

create index client_account_users_client_account_id_idx
  on public.client_account_users (client_account_id);

create index orders_client_account_id_idx
  on public.orders (client_account_id);

create index orders_status_idx
  on public.orders (status);

create index orders_severity_idx
  on public.orders (severity);

create index orders_exception_note_id_idx
  on public.orders (exception_note_id);

create index drivers_active_idx
  on public.drivers (active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger client_accounts_set_updated_at
before update on public.client_accounts
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger exception_notes_set_updated_at
before update on public.exception_notes
for each row execute function public.set_updated_at();

create trigger drivers_set_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_dispatcher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'dispatcher', false)
$$;

create or replace function public.user_can_access_client_account(account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.client_account_users
    where user_id = auth.uid()
      and client_account_id = account_id
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    'client'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_client_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> new.role and auth.uid() is not null and not public.is_dispatcher() then
    raise exception 'Only dispatchers can change profile roles.';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_client_role_change
before update on public.profiles
for each row execute function public.prevent_client_role_change();

alter table public.profiles enable row level security;
alter table public.client_accounts enable row level security;
alter table public.client_account_users enable row level security;
alter table public.drivers enable row level security;
alter table public.exception_notes enable row level security;
alter table public.orders enable row level security;

grant usage on schema public to authenticated;
grant all on public.profiles to authenticated;
grant all on public.client_accounts to authenticated;
grant all on public.client_account_users to authenticated;
grant all on public.drivers to authenticated;
grant all on public.exception_notes to authenticated;
grant all on public.orders to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_dispatcher());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Dispatchers can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());

create policy "Clients can read their accounts"
on public.client_accounts
for select
to authenticated
using (
  public.is_dispatcher()
  or public.user_can_access_client_account(id)
);

create policy "Dispatchers can manage client accounts"
on public.client_accounts
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());

create policy "Users can read their client memberships"
on public.client_account_users
for select
to authenticated
using (user_id = auth.uid() or public.is_dispatcher());

create policy "Dispatchers can manage client memberships"
on public.client_account_users
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());

create policy "Dispatchers can read drivers"
on public.drivers
for select
to authenticated
using (public.is_dispatcher());

create policy "Dispatchers can manage drivers"
on public.drivers
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());

create policy "Dispatchers can read exception notes"
on public.exception_notes
for select
to authenticated
using (public.is_dispatcher());

create policy "Dispatchers can manage exception notes"
on public.exception_notes
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());

create policy "Clients can read their orders"
on public.orders
for select
to authenticated
using (
  public.is_dispatcher()
  or public.user_can_access_client_account(client_account_id)
);

create policy "Dispatchers can manage orders"
on public.orders
for all
to authenticated
using (public.is_dispatcher())
with check (public.is_dispatcher());
