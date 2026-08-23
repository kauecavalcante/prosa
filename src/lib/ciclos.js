import { supabase } from './supabase'
import { garanteLivro } from './buscaLivros'

/* Diferente do clube, aqui o `select` na volta funciona: a leitura de ciclo e
   proposta exige participação, e quem abre ou propõe já é membro antes da
   inserção. A armadilha do brief anterior era outra — lá a permissão nascia de
   um gatilho que só terminava depois do retorno. */

/* Toda troca confere quantas linhas voltaram. Sob RLS, update e delete
   recusados não dão erro: a cláusula de uso filtra a linha antes e a operação
   termina bem sem tocar em nada. Confiar na ausência de erro faria a tela
   anunciar voto trocado que não foi. */

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

export async function cicloEmLeitura(clubeId) {
  const { data, error } = await supabase
    .from('ciclo')
    .select('id, status, prazo, criado_em, livro:livro_id (id, titulo, autores, capa_url, paginas, ano)')
    .eq('clube_id', clubeId)
    .eq('status', 'leitura')
    .order('criado_em', { ascending: false })
    .limit(1)

  if (error) return { ciclo: null, erro: error }
  return { ciclo: data?.[0] ?? null, erro: null }
}

export async function votosDoCiclo(cicloId) {
  const { data, error } = await supabase
    .from('voto')
    .select('proposta_id, perfil_id')
    .eq('ciclo_id', cicloId)

  if (error) return { votos: null, erro: error }
  return { votos: data ?? [], erro: null }
}

/* Um voto por pessoa por ciclo: a chave primária é (ciclo_id, perfil_id).
   Trocar é update; votar pela primeira vez é insert. */
export async function registraVoto({ cicloId, propostaId, jaVotou }) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  if (jaVotou) {
    const { data, error } = await supabase
      .from('voto')
      .update({ proposta_id: propostaId })
      .eq('ciclo_id', cicloId)
      .eq('perfil_id', perfilId)
      .select('proposta_id')

    if (error) return { erro: error }
    if (!data?.length) return { erro: { code: 'VOTO_RECUSADO' } }
    return { erro: null }
  }

  const { data, error } = await supabase
    .from('voto')
    .insert({ ciclo_id: cicloId, proposta_id: propostaId, perfil_id: perfilId })
    .select('proposta_id')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'VOTO_RECUSADO' } }
  return { erro: null }
}

export async function encerraVotacao({ cicloId, livroId, prazo }) {
  const { data, error } = await supabase
    .from('ciclo')
    .update({ livro_id: livroId, status: 'leitura', prazo })
    .eq('id', cicloId)
    .eq('status', 'votacao')
    .select('id, status, prazo')

  if (error) return { ciclo: null, erro: error }
  if (!data?.length) return { ciclo: null, erro: { code: 'ENCERRAMENTO_RECUSADO' } }
  return { ciclo: data[0], erro: null }
}
