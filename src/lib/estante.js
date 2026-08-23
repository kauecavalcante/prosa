import { supabase } from './supabase'

/* Os três estados de item_estante: futuro, lendo, lido. Nenhuma coluna guarda
   página, percentual ou qualquer medida de progresso — RNF-17, e é a decisão
   de produto mais importante do projeto. O acompanhamento é só o estado.

   A restrição unique (perfil_id, livro_id) garante uma linha por livro por
   pessoa: o mesmo livro vindo de dois clubes não duplica. */

export async function listaEstante(perfilId) {
  const { data, error } = await supabase
    .from('item_estante')
    .select('id, estado, clube_id, atualizado_em, livro:livro_id (id, titulo, autores, capa_url, paginas, ano)')
    .eq('perfil_id', perfilId)
    .order('atualizado_em', { ascending: false })

  if (error) return { itens: null, erro: error }
  return { itens: (data ?? []).filter((i) => i.livro), erro: null }
}

export async function moveItem({ itemId, estado }) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  // Sob RLS, update recusado não levanta erro: filtra a linha e termina bem.
  // Por isso a contagem de linhas é o que decide se a mudança valeu.
  const { data, error } = await supabase
    .from('item_estante')
    .update({ estado, atualizado_em: new Date().toISOString() })
    .eq('id', itemId)
    .eq('perfil_id', perfilId)
    .select('id, estado')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'ESTANTE_RECUSADA' } }
  return { erro: null }
}

export async function poeNaEstante({ livroId, estado = 'futuro', clubeId = null }) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  const { error } = await supabase
    .from('item_estante')
    .insert({ perfil_id: perfilId, livro_id: livroId, estado, clube_id: clubeId })

  // Já estar na estante não é falha: o livro veio de outro clube antes.
  if (error && error.code !== '23505') return { erro: error }
  return { erro: null }
}

export async function livrosNaMinhaEstante(livroIds) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId || !livroIds.length) return { porLivro: {}, erro: null }

  const { data, error } = await supabase
    .from('item_estante')
    .select('livro_id, estado')
    .eq('perfil_id', perfilId)
    .in('livro_id', livroIds)

  if (error) return { porLivro: {}, erro: error }
  const porLivro = {}
  for (const linha of data ?? []) porLivro[linha.livro_id] = linha.estado
  return { porLivro, erro: null }
}

/* Quem mais do clube está no mesmo livro. A política de item_estante já
   respeita vis_lidos e vis_futuros, então quem fechou as listas não aparece. */
export async function quemMaisEstaNoLivro({ livroId, estado, perfilId }) {
  const { data, error } = await supabase
    .from('item_estante')
    .select('perfil:perfil_id (id, nome)')
    .eq('livro_id', livroId)
    .eq('estado', estado)
    .neq('perfil_id', perfilId)

  if (error) return { pessoas: [], erro: error }
  return { pessoas: (data ?? []).map((l) => l.perfil).filter(Boolean), erro: null }
}

export async function estadosDosMembros({ livroId, perfilIds }) {
  if (!livroId || !perfilIds.length) return { porPerfil: {}, erro: null }

  const { data, error } = await supabase
    .from('item_estante')
    .select('perfil_id, estado')
    .eq('livro_id', livroId)
    .in('perfil_id', perfilIds)

  if (error) return { porPerfil: {}, erro: error }
  const porPerfil = {}
  for (const linha of data ?? []) porPerfil[linha.perfil_id] = linha.estado
  return { porPerfil, erro: null }
}
