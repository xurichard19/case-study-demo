# Supabase Schema

This directory contains database migrations for the dispatch case study.

## Tables

- `profiles`: app profile for each Supabase Auth user, including `client` or `dispatcher` role.
- `client_accounts`: customer organizations such as hospitals, labs, and medical centers.
- `client_account_users`: many-to-many membership between client users and client accounts.
- `drivers`: dispatcher-visible driver records.
- `orders`: dispatch order records scoped to a client account.

## Access Model

- Clients can read only client accounts and orders connected to their memberships.
- Dispatchers can read and manage profiles, client accounts, memberships, and orders.
- New Auth users are created as `client` by default.
- Dispatcher promotion should be done through a trusted service-role path, Supabase SQL editor, or a future dispatcher-only admin screen.

Example dispatcher promotion:

```sql
update public.profiles
set role = 'dispatcher'
where email = 'dispatcher@example.com';
```

## Applying Migrations

With the Supabase CLI linked to your project:

```bash
supabase db push
```

Or copy the SQL in `migrations/20260523000000_initial_auth_schema.sql` into the Supabase SQL editor.
