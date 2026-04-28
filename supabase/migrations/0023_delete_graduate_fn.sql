-- Admin-only RPC to fully delete a graduate: removes the graduate row
-- (which cascades reports, activities, monthly_plans, sponsorships,
-- graduate_bonus_awards, report_media via existing FK constraints) and,
-- if the graduate had a login, also deletes the auth user (which cascades
-- the profile row via on-delete-cascade on profiles.id).
--
-- Runs SECURITY DEFINER so it can touch auth.users; gates access by
-- checking the caller's profiles.role inside the function body, not via
-- RLS. Only callable by authenticated admins.

create or replace function public.delete_graduate_admin(grad_id uuid)
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
  from public.graduates
  where id = grad_id;

  delete from public.graduates where id = grad_id;

  if v_profile_id is not null then
    delete from auth.users where id = v_profile_id;
  end if;
end;
$$;

revoke all on function public.delete_graduate_admin(uuid) from public, anon;
grant execute on function public.delete_graduate_admin(uuid) to authenticated;
