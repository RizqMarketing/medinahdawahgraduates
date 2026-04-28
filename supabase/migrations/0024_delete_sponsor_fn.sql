-- Admin-only RPC to fully delete a sponsor: removes the sponsor row
-- (which cascades sponsorships via on-delete-cascade), and if the sponsor
-- had a login, also deletes the auth user (which cascades the profile row).
--
-- Mirrors delete_graduate_admin (migration 0023). Runs SECURITY DEFINER so
-- it can touch auth.users; gates by checking the caller's profiles.role
-- inside the function. Only callable by authenticated admins.

create or replace function public.delete_sponsor_admin(sponsor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  select profile_id into v_profile_id
  from public.sponsors
  where id = sponsor_id;

  delete from public.sponsors where id = sponsor_id;

  if v_profile_id is not null then
    delete from auth.users where id = v_profile_id;
  end if;
end;
$$;

revoke all on function public.delete_sponsor_admin(uuid) from public, anon;
grant execute on function public.delete_sponsor_admin(uuid) to authenticated;
