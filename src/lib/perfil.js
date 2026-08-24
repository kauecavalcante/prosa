import { supabase } from './supabase'

export async function buscaPerfil(id) {
  const { data, error } = await supabase
    .from('perfil')
    .select('id, nome, retrato, vis_lidos, vis_futuros, vis_resenhas')
    .eq('id', id)
    .maybeSingle()

  if (error) return { perfil: null, erro: error }
  return { perfil: data, erro: data ? null : { code: 'PERFIL_AUSENTE' } }
}

export async function salvaNome(nome) {
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { erro: { code: 'SEM_SESSAO' } }

  // Recusa de update sob RLS não levanta erro: filtra a linha e termina bem.
  const { data, error } = await supabase
    .from('perfil')
    .update({ nome: nome.trim() })
    .eq('id', perfilId)
    .select('nome')

  if (error) return { erro: error }
  if (!data?.length) return { erro: { code: 'NOME_RECUSADO' } }
  return { erro: null }
}

/* O que a política deixar passar. Perfil de quem fechou as listas devolve
   menos linhas, e não erro: quem visita não precisa saber o que está
   escondido. */
export async function acervoDoPerfil(id) {
  const [estante, notas, resenhas] = await Promise.all([
    supabase
      .from('item_estante')
      .select('estado, livro:livro_id (id, titulo, autores, capa_url)')
      .eq('perfil_id', id),
    supabase.from('nota').select('livro_id, valor').eq('perfil_id', id),
    supabase
      .from('resenha')
      .select('id, texto, spoiler, livro_id, livro:livro_id (id, titulo, autores, capa_url)')
      .eq('perfil_id', id),
  ])

  const itens = (estante.data ?? []).filter((i) => i.livro)
  const porLivro = {}
  for (const n of notas.data ?? []) porLivro[n.livro_id] = n.valor

  return {
    lidos: itens.filter((i) => i.estado === 'lido'),
    futuros: itens.filter((i) => i.estado === 'futuro'),
    lendo: itens.filter((i) => i.estado === 'lendo'),
    notaPorLivro: porLivro,
    resenhas: (resenhas.data ?? []).filter((r) => r.livro),
  }
}
