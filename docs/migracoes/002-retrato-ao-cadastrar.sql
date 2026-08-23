-- O retrato é escolhido antes de a conta existir, então viaja em
-- raw_user_meta_data junto do nome e o gatilho o grava na criação do perfil.
--
-- O padrão continua sendo retrato-01, que já é o default da coluna: quem não
-- escolher cai nele por dois caminhos.
--
-- A expressão regular existe porque raw_user_meta_data é escrito pelo cliente
-- e aceita qualquer texto. Ela casa com o formato, e não com a lista de nomes,
-- para que ampliar a galeria não exija migração nova — o que a interface não
-- reconhecer, ela desenha no padrão.

create or replace function public.cria_perfil_ao_cadastrar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, nome, retrato)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(
        (select trim(new.raw_user_meta_data->>'retrato')
         where trim(new.raw_user_meta_data->>'retrato') ~ '^retrato-[0-9]{2}$'),
        ''
      ),
      'retrato-01'
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;
