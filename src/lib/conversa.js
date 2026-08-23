import { supabase } from './supabase'

/* A conversa é aberta o tempo todo: não existe campo de liberação em `fala` e
   nada aqui olha o prazo do ciclo. A trava por data foi removida do produto na
   US-41 — quem protege quem está atrasado é a marcação de spoiler, e ela é
   escolha de quem lê, não bloqueio de quem escreve. */

export async function listaFalas({ clubeId, livroId }) {
  const { data, error } = await supabase
    .from('fala')
    .select('id, texto, spoiler, criado_em, quem:perfil_id (id, nome, retrato)')
    .eq('clube_id', clubeId)
    .eq('livro_id', livroId)
    .order('criado_em', { ascending: true })

  if (error) return { falas: null, erro: error }
  return { falas: (data ?? []).filter((f) => f.quem), erro: null }
}

export async function escreveFala({ clubeId, livroId, texto, spoiler }) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('fala')
    .insert({ clube_id: clubeId, livro_id: livroId, perfil_id: perfilId, texto: texto.trim(), spoiler })
    .select('id')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'FALA_RECUSADA' } }
  return { erro: null }
}
