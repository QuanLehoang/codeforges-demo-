-- Admin moderation helpers for banning and deleting users.

alter table public.profiles
  add column if not exists status text not null default 'active';

drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.admin_delete_user(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can delete users';
  end if;

  if _user_id = auth.uid() then
    raise exception 'Admins cannot delete their own account';
  end if;

  delete from auth.users
  where id = _user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
