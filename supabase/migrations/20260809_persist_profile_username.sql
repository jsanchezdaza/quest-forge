-- Persist the username supplied during sign-up instead of replacing it with the email.
-- Existing legacy profiles are repaired by the client on the user's next authenticated session.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), new.email)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';
