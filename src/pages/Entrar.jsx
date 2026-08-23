import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ERRO_EMAIL_JA_USADO, MINIMO_DA_SENHA, mensagemDeErro } from '../lib/mensagens'
import { useSessao } from '../hooks/useSessao'
import { CampoSenha } from '../components/CampoSenha'
import { GaleriaRetratos } from '../components/GaleriaRetratos'
import { RETRATO_PADRAO } from '../components/Retrato'
import { Marca } from '../components/Marca'
import '../estilos/formulario.css'

function Voltar({ aoClicar, rotulo }) {
  return (
    <button type="button" className="botao botao--voltar" onClick={aoClicar} aria-label={rotulo}>
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path
          d="M15 4 7 12l8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default function Entrar() {
  const { sessao, carregando: verificandoSessao } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()

  const [modo, setModo] = useState(local.state?.passo ?? 'entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [retrato, setRetrato] = useState(RETRATO_PADRAO)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [enderecoAvisado, setEnderecoAvisado] = useState(null)

  const campoErro = useRef(null)

  useEffect(() => {
    if (erro) campoErro.current?.focus()
  }, [erro])

  if (verificandoSessao) return null
  if (sessao) return <Navigate to={local.state?.de ?? '/'} replace />

  function irPara(novoModo) {
    setModo(novoModo)
    setErro(null)
    setEnderecoAvisado(null)
    setSenha('')
  }

  async function aoEntrar(evento) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro(mensagemDeErro(error))
      setEnviando(false)
      return
    }

    navegar(local.state?.de ?? '/', { replace: true })
  }

  async function aoCriarConta(evento) {
    evento.preventDefault()
    setErro(null)

    if (!nome.trim()) {
      setErro({ texto: 'Falta dizer como te chamam. É o nome que o clube vai ver.' })
      return
    }
    if (senha.length < MINIMO_DA_SENHA) {
      setErro({ texto: `A senha precisa de pelo menos ${MINIMO_DA_SENHA} caracteres.` })
      return
    }

    setEnviando(true)

    const enderecoLimpo = email.trim()
    // O nome vai em options.data porque é de raw_user_meta_data que o gatilho
    // ao_criar_usuario lê para montar a linha de perfil.
    const { data, error } = await supabase.auth.signUp({
      email: enderecoLimpo,
      password: senha,
      options: { data: { nome: nome.trim(), retrato } },
    })

    if (error) {
      setErro(mensagemDeErro(error))
      setEnviando(false)
      return
    }

    // Quando o e-mail já tem conta, o Supabase devolve sucesso com a lista de
    // identidades vazia, para não confirmar a estranhos que o endereço existe.
    if (data.user && data.user.identities?.length === 0) {
      setErro(ERRO_EMAIL_JA_USADO)
      setEnviando(false)
      return
    }

    if (data.session) {
      navegar('/', { replace: true })
      return
    }

    setModo('confirmar-email')
    setEnderecoAvisado(enderecoLimpo)
    setEnviando(false)
  }

  async function aoPedirRedefinicao(evento) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    const enderecoLimpo = email.trim()
    const { error } = await supabase.auth.resetPasswordForEmail(enderecoLimpo, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })

    if (error) {
      setErro(mensagemDeErro(error))
      setEnviando(false)
      return
    }

    setModo('redefinicao-enviada')
    setEnderecoAvisado(enderecoLimpo)
    setEnviando(false)
  }

  const avisoDeErro = erro && (
    <div className="aviso aviso--erro" role="alert" tabIndex={-1} ref={campoErro}>
      <span>{erro.texto}</span>
      {erro.acao === 'entrar' && (
        <button type="button" className="aviso__acao" onClick={() => irPara('entrar')}>
          Ir para o login com esse e-mail
        </button>
      )}
    </div>
  )

  const carregando = (rotulo, rotuloEmCurso) => (
    <>
      {enviando && <span className="giro" aria-hidden="true" />}
      {enviando ? rotuloEmCurso : rotulo}
    </>
  )

  /* ---------------------------------------------------------- confirmações */

  if (modo === 'confirmar-email' || modo === 'redefinicao-enviada') {
    const criandoConta = modo === 'confirmar-email'
    return (
      <main className="entrar entrar--formulario">
        <div className="entrar__quadro">
          <div className="entrar__cabecalho">
            <Voltar aoClicar={() => irPara('entrar')} rotulo="Voltar para o login" />
            <h1 className="entrar__titulo">{criandoConta ? 'Quase lá' : 'Olha o e-mail'}</h1>
          </div>
          <div className="entrar__rolagem">
            <p className="aviso aviso--sucesso" role="status">
              {criandoConta
                ? 'Mandamos um e-mail de confirmação para '
                : 'Se existir conta com esse endereço, o link de nova senha chegou em '}
              <strong>{enderecoAvisado}</strong>.{' '}
              {criandoConta
                ? 'Abra a mensagem, clique no link e volte aqui para entrar.'
                : 'Abra a mensagem e clique no link para escolher a senha nova.'}
            </p>
            <p className="campo__ajuda">
              Não chegou? Confira a caixa de spam e o endereço que você digitou. O e-mail
              pode levar alguns minutos.
            </p>
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => irPara('entrar')}
            >
              Ir para o login
            </button>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------------------------------------------------- esqueci a senha */

  if (modo === 'recuperar') {
    return (
      <main className="entrar entrar--formulario">
        <div className="entrar__quadro">
          <div className="entrar__cabecalho">
            <Voltar aoClicar={() => irPara('entrar')} rotulo="Voltar para o login" />
            <h1 className="entrar__titulo">Esqueci a senha</h1>
          </div>
          <div className="entrar__rolagem">
            <p className="campo__ajuda">
              Diga o e-mail da sua conta e mandamos um link para você escolher uma senha
              nova.
            </p>
            <form className="entrar__formulario-campos" onSubmit={aoPedirRedefinicao} noValidate>
              {avisoDeErro}
              <div className="campo">
                <label className="campo__rotulo" htmlFor="email">
                  E-mail
                </label>
                <div className="campo__caixa">
                  <input
                    id="email"
                    className="campo__entrada"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="botao botao--principal" disabled={enviando}>
                {carregando('Enviar o link', 'Enviando…')}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------------------------------------------------- L2 · criar conta */

  if (modo === 'criar') {
    return (
      <main className="entrar entrar--formulario">
        <div className="entrar__quadro">
          <div className="entrar__cabecalho">
            <Voltar aoClicar={() => irPara('entrar')} rotulo="Voltar para o login" />
            <h1 className="entrar__titulo">Bem-vindo ao Prosa</h1>
          </div>

          <div className="entrar__rolagem">
            <GaleriaRetratos escolhido={retrato} aoEscolher={setRetrato} />

            <form className="entrar__formulario-campos" onSubmit={aoCriarConta} noValidate>
              {avisoDeErro}

              <div className="campo">
                <label className="campo__rotulo" htmlFor="nome">
                  Como te chamam
                </label>
                <div className="campo__caixa">
                  <input
                    id="nome"
                    className="campo__entrada"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    maxLength={60}
                    required
                  />
                </div>
              </div>

              <div className="campo">
                <label className="campo__rotulo" htmlFor="email">
                  E-mail
                </label>
                <div className="campo__caixa">
                  <input
                    id="email"
                    className="campo__entrada"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <CampoSenha
                valor={senha}
                aoMudar={setSenha}
                autoComplete="new-password"
                medirForca
              />

              <p className="privacidade">
                <span className="privacidade__marca" aria-hidden="true">
                  <Marca tamanho={20} />
                </span>
                <span>
                  Antes de continuar: sua <strong>lista de futuros é pública</strong> — qualquer
                  pessoa com conta no Prosa vê os livros que você quer ler, e as suas notas e
                  resenhas. O que você marcar como <em>lendo</em> só aparece para os seus clubes.
                </span>
              </p>

              <button type="submit" className="botao botao--principal" disabled={enviando}>
                {carregando('Criar conta', 'Criando sua conta…')}
              </button>
            </form>

            <p className="entrar__alternativa">
              Já tem conta?{' '}
              <button type="button" className="botao botao--texto" onClick={() => irPara('entrar')}>
                Entrar
              </button>
            </p>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------------------------------------------------- L1 · entrar */

  return (
    <main className="entrar">
      <div className="entrar__quadro">
        <div className="entrar__capa">
          <Marca tamanho={140} titulo="Prosa" />
          <h1 className="entrar__nome">Prosa</h1>
          <p className="entrar__lema">
            O clube de leitura dos seus amigos. A melhor parte do livro é depois.
          </p>
        </div>

        <div className="entrar__folha">
          <form className="entrar__formulario-campos" onSubmit={aoEntrar} noValidate>
            {avisoDeErro}

            <div className="campo">
              <label className="campo__rotulo" htmlFor="email">
                E-mail
              </label>
              <div className="campo__caixa">
                <input
                  id="email"
                  className="campo__entrada"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <CampoSenha
              valor={senha}
              aoMudar={setSenha}
              autoComplete="current-password"
            />

            <button type="submit" className="botao botao--principal" disabled={enviando}>
              {carregando('Entrar', 'Entrando…')}
            </button>

            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => irPara('criar')}
            >
              Criar minha conta
            </button>
          </form>

          <p className="entrar__alternativa">
            <button
              type="button"
              className="botao botao--texto"
              onClick={() => irPara('recuperar')}
            >
              Esqueci a senha
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
