import { supabase } from './supabase'

/* Google Books primeiro, Open Library como alternativa — decisão 3.2 da
   arquitetura. A alternativa entra sem erro visível: falha de catálogo não é
   assunto de quem está procurando um livro (RNF-16 e critério da US-13).

   O limite diário do Google é real e o projeto já bateu nele, então a queda
   para a alternativa não é caminho raro: é caminho esperado. */

const MAXIMO = 20
const ESPERA = 6000

function comPrazo(url) {
  const cancelador = new AbortController()
  const relogio = setTimeout(() => cancelador.abort(), ESPERA)
  return fetch(url, { signal: cancelador.signal }).finally(() => clearTimeout(relogio))
}

function anoDe(texto) {
  const encontrado = /\d{4}/.exec(texto ?? '')
  return encontrado ? Number(encontrado[0]) : null
}

function doGoogle(item) {
  const v = item.volumeInfo ?? {}
  const capa = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null
  return {
    fonte: 'google_books',
    fonte_id: item.id,
    titulo: v.title ?? 'Sem título',
    autores: v.authors ?? [],
    descricao: v.description ?? null,
    paginas: v.pageCount > 0 ? v.pageCount : null,
    ano: anoDe(v.publishedDate),
    editora: v.publisher ?? null,
    // A API devolve http, que o navegador bloqueia numa página https.
    capa_url: capa ? capa.replace(/^http:/, 'https:') : null,
    categorias: v.categories ?? [],
    isbn: v.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ?? null,
  }
}

function daOpenLibrary(doc) {
  return {
    fonte: 'open_library',
    fonte_id: doc.key,
    titulo: doc.title ?? 'Sem título',
    autores: doc.author_name ?? [],
    descricao: null,
    paginas: doc.number_of_pages_median > 0 ? doc.number_of_pages_median : null,
    ano: doc.first_publish_year ?? null,
    editora: doc.publisher?.[0] ?? null,
    capa_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    categorias: doc.subject?.slice(0, 5) ?? [],
    isbn: doc.isbn?.[0] ?? null,
  }
}

async function noGoogle(termo) {
  const url =
    'https://www.googleapis.com/books/v1/volumes?q=' +
    encodeURIComponent(termo) +
    `&maxResults=${MAXIMO}&printType=books&country=BR`

  const resposta = await comPrazo(url)
  const corpo = await resposta.json()
  if (!resposta.ok || corpo.error) throw new Error('google indisponível')
  return (corpo.items ?? []).map(doGoogle)
}

async function naOpenLibrary(termo) {
  const url =
    'https://openlibrary.org/search.json?q=' +
    encodeURIComponent(termo) +
    `&limit=${MAXIMO}` +
    '&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,publisher,isbn,subject'

  const resposta = await comPrazo(url)
  if (!resposta.ok) throw new Error('open library indisponível')
  const corpo = await resposta.json()
  return (corpo.docs ?? []).map(daOpenLibrary)
}

export async function buscaLivros(termo) {
  const limpo = termo.trim()
  if (!limpo) return { livros: [], fonte: null, erro: null }

  try {
    const livros = await noGoogle(limpo)
    if (livros.length) return { livros, fonte: 'google_books', erro: null }
  } catch (falha) {
    if (import.meta.env.DEV) console.warn('[prosa] fonte principal fora, indo para a alternativa', falha)
  }

  try {
    const livros = await naOpenLibrary(limpo)
    return { livros, fonte: 'open_library', erro: null }
  } catch (falha) {
    return { livros: [], fonte: null, erro: falha }
  }
}

/* Copia o livro para a nossa tabela na primeira vez que alguém o usa, e
   devolve o nosso identificador.

   A corrida entre duas pessoas propondo o mesmo livro é resolvida pela
   restrição unique (fonte, fonte_id): quem perder recebe 23505 e lê a linha
   que a outra acabou de gravar. Não dá para usar upsert porque livro não tem
   política de update — a resolução do conflito seria recusada. */
export async function garanteLivro(achado) {
  const procura = () =>
    supabase
      .from('livro')
      .select('id')
      .eq('fonte', achado.fonte)
      .eq('fonte_id', achado.fonte_id)
      .maybeSingle()

  const { data: existente } = await procura()
  if (existente) return { livroId: existente.id, erro: null }

  const { data, error } = await supabase
    .from('livro')
    .insert({
      fonte: achado.fonte,
      fonte_id: achado.fonte_id,
      isbn: achado.isbn,
      titulo: achado.titulo,
      autores: achado.autores,
      descricao: achado.descricao,
      paginas: achado.paginas,
      ano: achado.ano,
      editora: achado.editora,
      capa_url: achado.capa_url,
      categorias: achado.categorias,
    })
    .select('id')

  if (error) {
    if (error.code === '23505') {
      const { data: agora } = await procura()
      if (agora) return { livroId: agora.id, erro: null }
    }
    return { livroId: null, erro: error }
  }

  if (!data?.length) return { livroId: null, erro: { code: 'SEM_LINHA' } }
  return { livroId: data[0].id, erro: null }
}

export async function buscaLivroPorId(id) {
  const { data, error } = await supabase
    .from('livro')
    .select('id, titulo, autores, descricao, paginas, ano, editora, capa_url, fonte')
    .eq('id', id)
    .maybeSingle()

  if (error) return { livro: null, erro: error }
  return { livro: data, erro: data ? null : { code: 'LIVRO_AUSENTE' } }
}
