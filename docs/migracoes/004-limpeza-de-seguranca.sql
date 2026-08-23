-- Limpeza de segurança apontada pelo Advisor e pela revisão manual.

-- ---------------------------------------------------- 1. superfície de RPC
-- As funções SECURITY DEFINER moram num schema que a API não expõe. Revogar
-- EXECUTE de e_membro não serviria: ela é chamada dentro das políticas de RLS,
-- que são avaliadas com o privilégio de quem consulta — sem EXECUTE, toda
-- consulta a clube, ciclo, proposta, voto e conversa passaria a dar erro de
-- permissão em vez de devolver vazio. Trocar de schema tira a função da API
-- sem tirar o direito de execução, porque o PostgREST só publica os schemas
-- que lhe foram declarados.
--
-- As políticas continuam válidas: elas guardam a referência da função pelo
-- identificador interno, que a mudança de schema não altera.

create schema if not exists privado;

grant usage on schema privado to anon, authenticated, service_role;

alter function public.e_membro(uuid)                 set schema privado;
alter function public.cria_perfil_ao_cadastrar()     set schema privado;
alter function public.registra_atividade()           set schema privado;

-- e_membro precisa continuar executável: quem consulta é quem a chama.
grant execute on function privado.e_membro(uuid) to anon, authenticated;

-- As duas de gatilho, não. O gatilho dispara como parte da operação na tabela
-- e não exige EXECUTE de quem escreve.
revoke execute on function privado.cria_perfil_ao_cadastrar() from public, anon, authenticated;
revoke execute on function privado.registra_atividade()       from public, anon, authenticated;

-- ---------------------------------------------------- 2. search_path
-- Sombrear a tabela que o gatilho consulta faria a regra de negócio mentir
-- em silêncio, que é pior do que recusar.

alter function public.exige_livro_lido()   set search_path = public;
alter function public.exige_prazo_futuro() set search_path = public;

-- ---------------------------------------------------- 3. atividade
-- Todo o resto do clube é fechado por e_membro; a atividade não era, e carrega
-- clube_id. Atividade nascida dentro de um clube ficava visível para quem não
-- participa. Sem clube ela segue pública — é o feed da rede aberta.

drop policy if exists atividade_leitura on atividade;

create policy atividade_leitura on atividade for select
  using (clube_id is null or privado.e_membro(clube_id));

-- ---------------------------------------------------- 4. resenha
-- vis_resenhas existia em perfil e ninguém consultava. Segue a mesma forma que
-- item_estante já usa para vis_lidos e vis_futuros. É a US-58.

drop policy if exists resenha_leitura on resenha;

create policy resenha_leitura on resenha for select
  using (
    perfil_id = auth.uid()
    or exists (
      select 1 from perfil p
      where p.id = resenha.perfil_id and p.vis_resenhas = 'publica'
    )
  );
