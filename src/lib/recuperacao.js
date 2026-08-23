/* Quem autoriza a troca de senha é o evento PASSWORD_RECOVERY, que a
   biblioteca só emite depois de o servidor validar o token do endereço —
   ela busca o usuário com aquele token antes de emitir.

   O texto do endereço não autoriza nada. `type=recovery` é uma cadeia de
   caracteres que qualquer pessoa digita na barra do navegador; ele serve
   apenas para a tela saber que há uma recuperação em curso e esperar o
   evento em vez de recusar de imediato.

   O sinal vive em memória, e só. Guardá-lo no navegador o tornaria
   falsificável de novo: quem forja o fragmento também escreve no
   armazenamento local. Recarregar a página fecha o formulário, e é o que
   deve acontecer. */

const CHAVES = ['type', 'error_code', 'error', 'access_token']
const VAZIO = { recuperacao: false, erro: null }

let ultimo = null
let eventoObservado = false
const ouvintes = new Set()

/* Chamada pelo módulo que cria o cliente, na mesma linha de execução em que
   ele nasce. Assim a assinatura existe antes de qualquer retorno de rede,
   sem depender de ordem de importação. */
export function observaRecuperacao(cliente) {
  cliente.auth.onAuthStateChange((evento) => {
    if (evento !== 'PASSWORD_RECOVERY') return
    eventoObservado = true
    for (const ouvinte of ouvintes) ouvinte()
  })
}

export function recuperacaoConfirmada() {
  return eventoObservado
}

export function assinaRecuperacao(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function encerraRecuperacao() {
  eventoObservado = false
  ultimo = VAZIO
}

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
    emCurso: p.get('type') === 'recovery',
    erro: codigoDeErro ? { code: codigoDeErro } : null,
  }
}

function temParametros(p) {
  return CHAVES.some((chave) => p.has(chave))
}

/* Só diz o que o endereço afirma. Não é autorização — ver o topo do arquivo. */
export function pistaDoEndereco() {
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
