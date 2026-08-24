import { supabase } from './supabase'

/* A restrição nao_segue_a_si e a política segue_escrita já defendem o banco.
   Aqui a única regra própria é conferir a contagem de linhas: recusa de
   insert e delete sob RLS não levanta erro, e a tela anunciaria um "seguindo"
   que não aconteceu. */

async function meuPerfil() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

export async function euSigo(perfilId) {
  const eu = await meuPerfil()
  if (!eu || !perfilId || eu === perfilId) return { segue: false, erro: null }

  const { data, error } = await supabase
    .from('segue')
    .select('seguido_id')
    .eq('seguidor_id', eu)
    .eq('seguido_id', perfilId)
    .maybeSingle()

  if (error) return { segue: false, erro: error }
  return { segue: Boolean(data), erro: null }
}

export async function seguir(perfilId) {
  const eu = await meuPerfil()
  if (!eu) return { erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('segue')
    .insert({ seguidor_id: eu, seguido_id: perfilId })
    .select('seguido_id')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'SEGUIR_RECUSADO' } }
  return { erro: null }
}

export async function deixarDeSeguir(perfilId) {
  const eu = await meuPerfil()
  if (!eu) return { erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('segue')
    .delete()
    .eq('seguidor_id', eu)
    .eq('seguido_id', perfilId)
    .select('seguido_id')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'SEGUIR_RECUSADO' } }
  return { erro: null }
}

export async function quemEuSigo() {
  const eu = await meuPerfil()
  if (!eu) return { ids: [], erro: null }

  const { data, error } = await supabase.from('segue').select('seguido_id').eq('seguidor_id', eu)
  if (error) return { ids: [], erro: error }
  return { ids: (data ?? []).map((l) => l.seguido_id), erro: null }
}

/* O feed é a atividade de quem se segue, e só. A própria atividade fica de
   fora: a US-52 pede "a atividade de quem sigo", e o que a pessoa acabou de
   fazer ela já sabe — vê no próprio perfil.

   A visibilidade não é reimplementada aqui. A política de atividade já
   esconde o que o perfil fechou, desde a migração 011: esta consulta pede
   tudo de quem segue e recebe o que pode ver. */
export async function feedDeQuemSigo() {
  const { ids } = await quemEuSigo()
  if (!ids.length) return { itens: [], seguindo: 0, erro: null }

  const { data, error } = await supabase
    .from('atividade')
    .select(
      'id, tipo, criado_em, clube_id, quem:perfil_id (id, nome, retrato), livro:livro_id (id, titulo, autores, capa_url), clube:clube_id (id, nome)'
    )
    .in('perfil_id', ids)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) return { itens: [], seguindo: ids.length, erro: error }
  return { itens: (data ?? []).filter((a) => a.quem && a.livro), seguindo: ids.length, erro: null }
}

/* Nota e resenha do livro, para o item de feed mostrar o que a pessoa achou.
   O que a política esconder simplesmente não volta. */
export async function detalhesDoFeed(itens) {
  const livros = [...new Set(itens.map((i) => i.livro.id))]
  const pessoas = [...new Set(itens.map((i) => i.quem.id))]
  if (!livros.length) return { notas: {}, resenhas: {} }

  const [nota, resenha] = await Promise.all([
    supabase.from('nota').select('perfil_id, livro_id, valor').in('livro_id', livros).in('perfil_id', pessoas),
    supabase.from('resenha').select('perfil_id, livro_id, texto, spoiler').in('livro_id', livros).in('perfil_id', pessoas),
  ])

  const notas = {}
  for (const n of nota.data ?? []) notas[`${n.perfil_id}:${n.livro_id}`] = n.valor
  const resenhas = {}
  for (const r of resenha.data ?? []) resenhas[`${r.perfil_id}:${r.livro_id}`] = r

  return { notas, resenhas }
}
