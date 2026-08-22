-- O perfil nasce junto com o usuário. É gatilho e não política de insert
-- porque no cadastro com confirmação de e-mail ainda não existe sessão,
-- e sem sessão auth.uid() é nulo — nenhuma política resolveria esse momento.
create or replace function public.cria_perfil_ao_cadastrar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, nome)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.cria_perfil_ao_cadastrar();

-- Quem já se cadastrou antes do gatilho existir
insert into public.perfil (id, nome)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'nome'), ''), split_part(u.email, '@', 1))
from auth.users u
left join public.perfil p on p.id = u.id
where p.id is null;
