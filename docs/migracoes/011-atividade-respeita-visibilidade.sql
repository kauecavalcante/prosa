-- A tabela atividade e as colunas de visibilidade de perfil nasceram no mesmo
-- esquema e nunca foram ligadas. A leitura só olhava o clube, então quem
-- fechava as resenhas continuava anunciando no feed que tinha resenhado — o
-- texto ficava escondido e o fato ficava à mostra. O mesmo valia para
-- quer_ler contra vis_futuros.
--
-- A regra: a atividade só é legível por quem poderia ler o dado que a
-- originou. Nota é coisa de livro terminado, então 'avaliou' segue vis_lidos.
--
-- Por política, e não deixando de gravar a linha: a visibilidade muda depois,
-- e quem fecha o perfil hoje espera que o passado feche junto. Gravar
-- condicionalmente congelaria a decisão do dia em que a atividade nasceu.
--
-- A condição de clube continua: atividade nascida dentro de um clube fechado
-- não pode escapar por aqui — ver a migração 004.

drop policy if exists atividade_leitura on atividade;

create policy atividade_leitura on atividade for select
  using (
    perfil_id = auth.uid()
    or (
      (clube_id is null or privado.e_membro(clube_id))
      and exists (
        select 1 from perfil p
        where p.id = atividade.perfil_id
          and case atividade.tipo
                when 'resenhou' then p.vis_resenhas
                when 'quer_ler' then p.vis_futuros
                when 'avaliou'  then p.vis_lidos
              end = 'publica'
      )
    )
  );
