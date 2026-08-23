import { supabase } from './supabase'

/* Nota e resenha andam juntas na ficha do livro, mas são tabelas separadas:
   a nota tem chave (perfil, livro) e a resenha tem unicidade no mesmo par.
   Avaliar duas vezes atualiza, não duplica. */

async function meuPerfil() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

export async function minhaNota(livroId) {
  const perfilId = await meuPerfil()
  if (!perfilId) return { nota: null, erro: null }

  const { data, error } = await supabase
    .from('nota')
    .select('valor')
    .eq('perfil_id', perfilId)
    .eq('livro_id', livroId)
    .maybeSingle()

  if (error) return { nota: null, erro: error }
  return { nota: data?.valor ?? null, erro: null }
}

export async function salvaNota({ livroId, valor }) {
  const perfilId = await meuPerfil()
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('nota')
    .upsert(
      { perfil_id: perfilId, livro_id: livroId, valor, atualizado_em: new Date().toISOString() },
      { onConflict: 'perfil_id,livro_id' }
    )
    .select('valor')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'NOTA_RECUSADA' } }
  return { erro: null }
}

export async function listaResenhas(livroId) {
  const { data, error } = await supabase
    .from('resenha')
    .select('id, texto, spoiler, criado_em, perfil_id, quem:perfil_id (id, nome, retrato)')
    .eq('livro_id', livroId)
    .order('criado_em', { ascending: false })

  if (error) return { resenhas: null, erro: error }
  return { resenhas: (data ?? []).filter((r) => r.quem), erro: null }
}

export async function salvaResenha({ livroId, texto, spoiler }) {
  const perfilId = await meuPerfil()
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('resenha')
    .upsert(
      { perfil_id: perfilId, livro_id: livroId, texto: texto.trim(), spoiler },
      { onConflict: 'perfil_id,livro_id' }
    )
    .select('id')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'RESENHA_RECUSADA' } }
  return { erro: null }
}
