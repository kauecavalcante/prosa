/* RNF-05: o usuário nunca lê o texto cru do Supabase. Cada falha vira uma
   frase que diz o que aconteceu e o que fazer agora. O que a API devolve
   fica no console, para quem está depurando. */

export const MINIMO_DA_SENHA = 8

const POR_CODIGO = {
  otp_expired: {
    texto: 'Esse link de senha já venceu ou já foi usado.',
    acao: 'novo-link',
  },
  access_denied: {
    texto: 'Esse link de senha já venceu ou já foi usado.',
    acao: 'novo-link',
  },
  current_password_required: {
    texto: 'Para trocar a senha estando conectado, o Prosa pede a senha atual. Saia e use o link de "Esqueci a senha" para escolher outra.',
  },

  // Códigos que entrar_por_convite e criar_convite levantam. Cada um pede uma
  // resposta diferente: quem errou o código refaz, quem já entrou só precisa ir.
  PR000: {
    texto: 'Você precisa entrar na sua conta antes de aceitar o convite.',
  },
  PR001: {
    texto: 'Não encontramos esse convite. Confira se o código veio inteiro — ele tem 12 caracteres.',
  },
  PR002: {
    texto: 'Esse convite foi cancelado por quem administra o clube. Peça um novo.',
  },
  PR003: {
    texto: 'Esse convite venceu. Peça outro a quem te chamou — eles valem sete dias.',
  },
  PR004: {
    texto: 'Você já está nesse clube.',
    acao: 'ir-ao-clube',
  },
  PR005: {
    texto: 'Só quem administra o clube pode convidar. Peça a quem criou.',
  },

  // A restrição unique (ciclo_id, livro_id) da US-19.
  '23505': {
    texto: 'Esse livro já está na votação. Escolha outro, ou defenda o que já foi proposto.',
  },
  LIVRO_AUSENTE: {
    texto: 'Não encontramos esse livro. Ele pode ter sido removido — tente buscar de novo.',
  },
  BUSCA_FORA: {
    texto: 'Não conseguimos falar com o catálogo agora. Tente de novo em instantes.',
  },

  SEM_SESSAO: {
    texto: 'Sua sessão expirou. Entre de novo e tente outra vez.',
  },
  SEM_LINHA: {
    texto: 'A operação não foi aceita. Recarregue a página e tente de novo.',
  },

  same_password: {
    texto: 'Essa é a senha que você já usa. Escolha uma diferente.',
  },
  session_not_found: {
    texto: 'A sua sessão de recuperação expirou. Peça um link novo e abra a mensagem mais recente.',
    acao: 'novo-link',
  },
  invalid_credentials: {
    texto: 'E-mail ou senha não conferem. Confira o endereço e digite a senha de novo, de olho no maiúsculo e no acento.',
  },
  email_not_confirmed: {
    texto: 'Falta confirmar seu e-mail. Abra a mensagem que o Prosa te mandou e clique no link de confirmação.',
  },
  email_address_invalid: {
    texto: 'Esse endereço de e-mail não parece válido. Confira se não faltou um caractere.',
  },
  user_already_exists: { acao: 'entrar' },
  email_exists: { acao: 'entrar' },
  weak_password: {
    texto: 'Essa senha é curta demais. Use pelo menos 8 caracteres.',
  },
  over_email_send_rate_limit: {
    texto: 'Já enviamos e-mails demais para essa conta agora há pouco. Espere alguns minutos e tente outra vez.',
  },
  over_request_rate_limit: {
    texto: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.',
  },
  validation_failed: {
    texto: 'Faltou preencher alguma coisa. Confira os campos e tente de novo.',
  },
}

export const ERRO_EMAIL_JA_USADO = {
  texto: 'Já existe uma conta com esse e-mail.',
  acao: 'entrar',
}

export function mensagemDeErro(erro) {
  if (import.meta.env.DEV) console.error('[prosa] falha de autenticação', erro)

  const codigo = erro?.code ?? erro?.error_code
  const conhecido = POR_CODIGO[codigo]

  if (conhecido?.acao === 'entrar') return ERRO_EMAIL_JA_USADO
  if (conhecido) return conhecido

  // Rate limit de e-mail chega sem código próprio em algumas respostas.
  if (typeof erro?.message === 'string' && /rate limit/i.test(erro.message)) {
    return POR_CODIGO.over_email_send_rate_limit
  }

  if (erro?.name === 'AuthRetryableFetchError' || erro?.message === 'Failed to fetch') {
    return {
      texto: 'Não conseguimos falar com o servidor. Confira sua conexão e tente de novo.',
    }
  }

  return {
    texto: 'Alguma coisa deu errado por aqui. Tente de novo em instantes — se continuar, atualize a página.',
  }
}

/* Devolve 0 a 3. O mínimo de 8 caracteres é regra dura da US-01; o resto do
   cálculo só orienta, e por isso mistura tamanho com variedade em vez de
   exigir símbolo obrigatório — regra rígida de composição faz a pessoa
   escolher senha pior, não melhor. */
export function forcaDaSenha(senha) {
  if (senha.length < MINIMO_DA_SENHA) return 0

  let pontos = 1
  if (senha.length >= 12) pontos += 1
  const variedade =
    (/[a-z]/.test(senha) ? 1 : 0) +
    (/[A-Z]/.test(senha) ? 1 : 0) +
    (/[0-9]/.test(senha) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(senha) ? 1 : 0)
  if (variedade >= 3) pontos += 1

  return Math.min(pontos, 3)
}

export const ROTULO_DA_FORCA = ['curta', 'fraca', 'média', 'boa']
