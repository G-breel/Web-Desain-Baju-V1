-- Keep updated_at current on updates

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_designs_updated_at on public.designs;
create trigger set_designs_updated_at
before update on public.designs
for each row execute function public.set_updated_at();

