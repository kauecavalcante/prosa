-- Três correções de segurança no esquema. Nenhuma toca nas migrações anteriores.

-- ---------------------------------------------------------------- 1. voto
-- voto_escrita exigia só que o voto fosse em nome próprio, e não que quem
-- vota participe do clube. Quem está de fora não lê a votação, mas escrevia
-- nela: dava para fraudar a apuração de um clube alheio. A participação sai
-- do clube do ciclo, como já faz a política de leitura, e a forma copia a de
-- fala_escrita, que ficou correta desde o início.

drop policy if exists voto_escrita on voto;

create policy voto_escrita on voto for insert
  with check (
    perfil_id = auth.uid()
    and e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
  );

-- ---------------------------------------------------------------- 2. e_membro
-- É a função que decide quem enxerga clube, ciclo, proposta, voto e conversa,
-- e roda com privilégio elevado. Sem search_path fixado, quem conseguisse
-- criar um esquema à frente do public na busca poderia sombrear membro_clube
-- e fazer a função responder o que quisesse.

alter function public.e_membro(uuid) set search_path = public;

-- ---------------------------------------------------------------- 3. feed
-- atividade tem RLS ligada e nenhuma política de insert, e o gatilho rodava
-- com o privilégio de quem escreve — então a primeira nota derrubaria a
-- própria nota junto.
--
-- A decisão 3.4 da arquitetura diz que o feed é gravado por gatilho justamente
-- para não depender da aplicação. Manter isso significa dar ao gatilho o
-- privilégio de escrever, e não abrir atividade para escrita direta do
-- cliente: com política de insert, qualquer um forjaria atividade alheia.

create or replace function public.registra_atividade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'nota' then
    insert into atividade (perfil_id, tipo, livro_id)
    values (new.perfil_id, 'avaliou', new.livro_id);
  elsif tg_table_name = 'resenha' then
    insert into atividade (perfil_id, tipo, livro_id)
    values (new.perfil_id, 'resenhou', new.livro_id);
  elsif tg_table_name = 'item_estante' and new.estado = 'futuro' then
    insert into atividade (perfil_id, tipo, livro_id, clube_id)
    values (new.perfil_id, 'quer_ler', new.livro_id, new.clube_id);
  end if;
  return new;
end $$;
