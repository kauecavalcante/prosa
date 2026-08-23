-- Duas lacunas que a tela de votação escancara.

-- ---------------------------------------------------- 1. voto fora de hora
-- As políticas de voto checavam participação e identidade, mas não o estado do
-- ciclo: quem é do clube conseguia votar, trocar e remover voto depois de a
-- votação encerrada, e depois de o livro já estar escolhido. A interface pode
-- esconder o botão, mas a apuração tem de ser defendida no banco.
--
-- A condição sai do status do ciclo, no mesmo formato que as outras já usam.

drop policy if exists voto_escrita on voto;

create policy voto_escrita on voto for insert
  with check (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
    and (select status from ciclo where ciclo.id = voto.ciclo_id) = 'votacao'
  );

drop policy if exists voto_troca on voto;

create policy voto_troca on voto for update
  using (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
    and (select status from ciclo where ciclo.id = voto.ciclo_id) = 'votacao'
  )
  with check (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
    and (select status from ciclo where ciclo.id = voto.ciclo_id) = 'votacao'
  );

drop policy if exists voto_remocao on voto;

create policy voto_remocao on voto for delete
  using (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
    and (select status from ciclo where ciclo.id = voto.ciclo_id) = 'votacao'
  );

-- ---------------------------------------------------- 2. o prazo no passado
-- A recusa existia, mas subia sem código próprio: chegava como P0001 genérico,
-- que a interface só saberia traduzir se lesse o texto do banco. Com código
-- próprio, a mensagem vira frase escrita para quem está definindo o prazo.

create or replace function public.exige_prazo_futuro()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.prazo is not null and new.prazo < current_date then
    raise exception 'O prazo do ciclo não pode estar no passado.' using errcode = 'PR006';
  end if;
  return new;
end $$;
