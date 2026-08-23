/* O cliente Supabase apaga o fragmento do endereço assim que inicializa, e é
   nesse fragmento que vem o marcador `type=recovery`. O index.html guarda o
   endereço de entrada num script embutido, que o documento executa antes de
   qualquer módulo — por isso a leitura não depende da ordem de importação,
   que o empacotador pode reordenar sem avisar.

   A ordem de consulta é: endereço vivo, se ainda trouxer parâmetros de
   autenticação; senão a última leitura que os trouxe; senão o endereço de
   entrada guardado. Trocar só o fragmento não recarrega o documento, então
   ler o endereço vivo primeiro evita responder com uma visita anterior. */

const CHAVES = ['type', 'error_code', 'error', 'access_token']
const VAZIO = { recuperacao: false, erro: null }

let ultimo = null

function juntaParametros(href) {
  const endereco = new URL(href, window.location.origin)
  const doFragmento = new URLSearchParams(
    endereco.hash.startsWith('#') ? endereco.hash.slice(1) : endereco.hash
  )

  const juntos = new URLSearchParams()
  for (const [chave, valor] of endereco.searchParams) juntos.set(chave, valor)
  for (const [chave, valor] of doFragmento) juntos.set(chave, valor)
  return juntos
}

function interpreta(p) {
  const codigoDeErro = p.get('error_code') ?? p.get('error')
  return {
    recuperacao: p.get('type') === 'recovery',
    erro: codigoDeErro ? { code: codigoDeErro } : null,
  }
}

function temParametros(p) {
  return CHAVES.some((chave) => p.has(chave))
}

export function marcadorDeRecuperacao() {
  const vivo = juntaParametros(window.location.href)
  if (temParametros(vivo)) {
    ultimo = interpreta(vivo)
    return ultimo
  }

  if (ultimo) return ultimo

  const guardado = window.__prosaEnderecoInicial
  const daEntrada = typeof guardado === 'string' ? juntaParametros(guardado) : null
  ultimo = daEntrada && temParametros(daEntrada) ? interpreta(daEntrada) : VAZIO
  return ultimo
}

/* Consumida depois da troca: a sessão deixa de ser de recuperação e a tela
   não deve reabrir se a pessoa voltar por navegação interna. */
export function encerraRecuperacao() {
  ultimo = VAZIO
}
