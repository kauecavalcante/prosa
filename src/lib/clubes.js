import { supabase } from './supabase'

/* Sob RLS, update e delete recusados não dão erro: a cláusula de uso filtra a
   linha antes, e a operação "termina bem" sem tocar em nada. Por isso toda
   escrita daqui confere quantas linhas voltaram, e não só a ausência de erro. */

export async function listaMeusClubes() {
  /* Filtra pelo próprio perfil de propósito. membro_leitura deixa ver todos os
     membros dos clubes de que se participa, então sem o filtro a consulta
     devolve também as linhas das outras pessoas: o mesmo clube aparecia
     repetido, e o papel exibido podia ser o de outro membro. */
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { clubes: null, erro: { code: 'SEM_SESSAO' } }

  const { data, error } = await supabase
    .from('membro_clube')
    .select('papel, entrou_em, clube:clube_id (id, nome, descricao, criado_em)')
    .eq('perfil_id', perfilId)
    .order('entrou_em', { ascending: true })

  if (error) return { clubes: null, erro: error }

  const clubes = (data ?? [])
    .filter((linha) => linha.clube)
    .map((linha) => ({ ...linha.clube, papel: linha.papel }))

  return { clubes, erro: null }
}

export async function criaClube({ nome, descricao }) {
  // O dono sai da sessão, e não de um argumento: clube_criacao exige
  // criado_por = auth.uid().
  const { data: sessao } = await supabase.auth.getSession()
  const perfilId = sessao?.session?.user?.id
  if (!perfilId) return { clube: null, erro: { code: 'SEM_SESSAO' } }

  /* Sem `select` na volta, de propósito. O gatilho que torna o criador membro
     é AFTER INSERT, e o `returning` é avaliado antes de ele terminar — então a
     linha devolvida ainda não passa por clube_leitura, que exige participação,
     e o insert inteiro volta como violação de política. O identificador nasce
     aqui para a tela saber para onde ir sem precisar ler de volta. */
  const id = crypto.randomUUID()

  const { error } = await supabase
    .from('clube')
    .insert({ id, nome: nome.trim(), descricao: descricao.trim() || null, criado_por: perfilId })

  if (error) return { clube: null, erro: error }

  // Confere que o clube existe e está visível, em vez de confiar na ausência
  // de erro — ver a nota do topo do arquivo.
  return buscaClube(id)
}

export async function buscaClube(id) {
  const { data, error } = await supabase
    .from('clube')
    .select('id, nome, descricao, criado_por, criado_em')
    .eq('id', id)
    .maybeSingle()

  if (error) return { clube: null, erro: error }
  return { clube: data, erro: data ? null : { code: 'CLUBE_INVISIVEL' } }
}

export async function listaMembros(clubeId) {
  const { data, error } = await supabase
    .from('membro_clube')
    .select('papel, entrou_em, perfil:perfil_id (id, nome, retrato)')
    .eq('clube_id', clubeId)
    .order('entrou_em', { ascending: true })

  if (error) return { membros: null, erro: error }
  return { membros: (data ?? []).filter((m) => m.perfil), erro: null }
}

export async function geraConvite(clubeId) {
  const { data, error } = await supabase.rpc('criar_convite', { p_clube: clubeId })
  if (error) return { convite: null, erro: error }

  const linha = Array.isArray(data) ? data[0] : data
  if (!linha) return { convite: null, erro: { code: 'SEM_LINHA' } }
  return { convite: linha, erro: null }
}

export async function entraPorConvite(codigo) {
  const { data, error } = await supabase.rpc('entrar_por_convite', {
    codigo: codigo.trim(),
  })
  if (error) return { clubeId: null, erro: error }
  return { clubeId: data, erro: null }
}
