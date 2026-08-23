import { supabase } from './supabase'
import { garanteLivro } from './buscaLivros'

/* Diferente do clube, aqui o `select` na volta funciona: a leitura de ciclo e
   proposta exige participação, e quem abre ou propõe já é membro antes da
   inserção. A armadilha do brief anterior era outra — lá a permissão nascia de
   um gatilho que só terminava depois do retorno. */

export async function cicloAberto(clubeId) {
  const { data, error } = await supabase
    .from('ciclo')
    .select('id, status, votacao_ate, prazo, livro_id, criado_em')
    .eq('clube_id', clubeId)
    .eq('status', 'votacao')
    .order('criado_em', { ascending: false })
    .limit(1)

  if (error) return { ciclo: null, erro: error }
  return { ciclo: data?.[0] ?? null, erro: null }
}

export async function abreVotacao({ clubeId, votacaoAte }) {
  const { data, error } = await supabase
    .from('ciclo')
    .insert({ clube_id: clubeId, status: 'votacao', votacao_ate: votacaoAte })
    .select('id, status, votacao_ate')

  if (error) return { ciclo: null, erro: error }
  if (!data?.length) return { ciclo: null, erro: { code: 'SEM_LINHA' } }
  return { ciclo: data[0], erro: null }
}

export async function listaPropostas(cicloId) {
  const { data, error } = await supabase
    .from('proposta')
    .select('id, defesa, criado_em, livro:livro_id (id, titulo, autores, capa_url, paginas, ano), quem:proposto_por (id, nome, retrato)')
    .eq('ciclo_id', cicloId)
    .order('criado_em', { ascending: true })

  if (error) return { propostas: null, erro: error }
  return { propostas: (data ?? []).filter((p) => p.livro), erro: null }
}

export async function propoeLivro({ cicloId, achado, defesa }) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { proposta: null, erro: { code: 'SEM_SESSAO' } }

  const { livroId, erro: erroDoLivro } = await garanteLivro(achado)
  if (erroDoLivro) return { proposta: null, erro: erroDoLivro }

  const { data, error } = await supabase
    .from('proposta')
    .insert({
      ciclo_id: cicloId,
      livro_id: livroId,
      proposto_por: perfilId,
      defesa: defesa?.trim() || null,
    })
    .select('id')

  if (error) return { proposta: null, erro: error }
  if (!data?.length) return { proposta: null, erro: { code: 'SEM_LINHA' } }
  return { proposta: data[0], erro: null }
}
