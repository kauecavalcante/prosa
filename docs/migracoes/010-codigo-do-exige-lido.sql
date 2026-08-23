-- O gatilho que exige livro lido antes da nota já recusava, mas subia sem
-- código próprio: chegava como P0001 genérico, e a interface só saberia
-- traduzir lendo o texto do banco. Mesmo motivo da 008 para o prazo.
--
-- A regra em si não muda: quem não marcou o livro como lido não avalia,
-- venha a tentativa da tela ou direto da API.

create or replace function public.exige_livro_lido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from item_estante
    where perfil_id = new.perfil_id
      and livro_id  = new.livro_id
      and estado    = 'lido'
  ) then
    raise exception 'Só é possível avaliar um livro marcado como lido.'
      using errcode = 'PR007';
  end if;
  return new;
end $$;
