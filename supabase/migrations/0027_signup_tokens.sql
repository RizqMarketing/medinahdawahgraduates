-- Bulk graduate onboarding via per-graduate signup links.
--
-- Workflow:
--   1. Admin pastes a list of graduates (name + WhatsApp + country) into the
--      bulk-invite admin page. Edge function `bulk-invite-graduates` creates a
--      placeholder graduates row (no profile_id yet) plus one signup_tokens row
--      per graduate, returning a unique signup URL for each.
--   2. Admin forwards each URL to the corresponding graduate via WhatsApp.
--   3. Graduate opens /claim?token=xxx, sees their pre-filled name, supplies
--      their own email + password. Edge function `claim-signup-token` creates
--      the auth user, creates the profile, links profile_id on the graduates
--      row, marks the token used.
--
-- This avoids the friction of the admin needing to collect 20 email addresses
-- up front — graduates supply their own at claim time.

create table public.signup_tokens (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null,
  graduate_id uuid not null references public.graduates(id) on delete cascade,
  -- Captured at bulk-invite time and copied onto profiles.phone when the
  -- graduate claims. Profile doesn't exist yet at invite time, so it has to
  -- live somewhere temporary.
  phone       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  used_at     timestamptz,
  expires_at  timestamptz not null default (now() + interval '60 days')
);

create index idx_signup_tokens_graduate_id on public.signup_tokens(graduate_id);

alter table public.signup_tokens enable row level security;

-- Admins can manage tokens (list, audit, revoke). Nothing for anon at the
-- table level — the public-facing read goes through the RPC below, which
-- is SECURITY DEFINER and only exposes the bare minimum (graduate name).
create policy signup_tokens_admin_all on public.signup_tokens
  for all using (is_admin()) with check (is_admin());

-- Public-facing token lookup: given a token, return the graduate's full name
-- so the /claim page can show "Welcome <name>" before they submit. Returns
-- empty if the token doesn't exist, is already used, or is expired — the
-- claim page treats empty as "invalid link". SECURITY DEFINER bypasses RLS;
-- the function itself filters to safe rows.
create or replace function public.get_signup_token_info(p_token text)
returns table (full_name text, graduate_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select g.full_name, g.id
  from public.signup_tokens t
  join public.graduates g on g.id = t.graduate_id
  where t.token = p_token
    and t.used_at is null
    and t.expires_at > now()
  limit 1
$$;

-- Anon needs to call this from the unauthenticated /claim page.
grant execute on function public.get_signup_token_info(text) to anon, authenticated;
