import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { garantirPerfil } from '../lib/perfil'
import {
  ERRO_EMAIL_JA_USADO,
  ROTULO_DA_FORCA,
  forcaDaSenha,
  mensagemDeErro,
} from '../lib/mensagens'
import { useSessao } from '../hooks/useSessao'
import { Marca } from '../components/Marca'
import './Entrar.css'

const MINIMO_DA_SENHA = 8

const COR_DA_FORCA = [
  'var(--tinta-suave)',
  'var(--estado-lidos)',
  'var(--estado-futuros)',
  'var(--estado-lendo)',
]

export default function Entrar() {
  const { sessao, carregando: verificandoSessao } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()

  const [modo, setModo] = useState('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(null)

  const campoErro = useRef(null)
  const primeiroCampo = useRef(null)

  useEffect(() => {
    if (erro) campoErro.current?.focus()
  }, [erro])

  if (verificandoSessao) return null
  if (sessao) return <Navigate to={local.state?.de ?? '/'} replace />

  const forca = forcaDaSenha(senha)
  const senhaCurta = senha.length > 0 && senha.length < MINIMO_DA_SENHA

  function trocarModo(novoModo) {
    setModo(novoModo)
    setErro(null)
    setConfirmacaoPendente(null)
    setSenha('')
    setSenhaVisivel(false)
  }

  async function aoEntrar(evento) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro(mensagemDeErro(error))
      setEnviando(false)
      return
    }

    const { erro: erroDePerfil } = await garantirPerfil(data.user)
    if (erroDePerfil && import.meta.env.DEV) {
      console.error('[prosa] não foi possível criar a linha de perfil', erroDePerfil)
    }

    navegar(local.state?.de ?? '/', { replace: true })
  }

  async function aoCriarConta(evento) {
    evento.preventDefault()
    setErro(null)

    if (senha.length < MINIMO_DA_SENHA) {
      setErro({ texto: `A senha precisa de pelo menos ${MINIMO_DA_SENHA} caracteres.` })
      return
    }
    if (!nome.trim()) {
      setErro({ texto: 'Falta dizer como te chamam. É o nome que o clube vai ver.' })
      return
    }

    setEnviando(true)

    const enderecoLimpo = email.trim()
    const { data, error } = await supabase.auth.signUp({
      email: enderecoLimpo,
      password: senha,
      options: { data: { nome: nome.trim() } },
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
      const { erro: erroDePerfil } = await garantirPerfil(data.user)
      if (erroDePerfil && import.meta.env.DEV) {
        console.error('[prosa] não foi possível criar a linha de perfil', erroDePerfil)
      }
      navegar('/', { replace: true })
      return
    }

    setConfirmacaoPendente(enderecoLimpo)
    setEnviando(false)
  }

  if (confirmacaoPendente) {
    return (
      <main className="entrar">
        <div className="entrar__quadro">
          <div className="entrar__capa">
            <Marca tamanho={96} titulo="Prosa" />
            <h1 className="entrar__nome">Quase lá</h1>
          </div>
          <div className="entrar__cartao">
            <p className="aviso aviso--sucesso" role="status">
              Mandamos um e-mail para <strong>{confirmacaoPendente}</strong>. Abra a
              mensagem e clique no link de confirmação — depois volte aqui e entre com
              a sua senha.
            </p>
            <p className="campo__ajuda" style={{ marginTop: 14 }}>
              Não chegou? Confira a caixa de spam. O e-mail pode levar alguns minutos.
            </p>
            <button
              type="button"
              className="botao botao--secundario"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => {
                setConfirmacaoPendente(null)
                trocarModo('entrar')
              }}
            >
              Ir para o login
            </button>
          </div>
        </div>
      </main>
    )
  }

  const criando = modo === 'criar'

  return (
    <main className="entrar">
      <div className="entrar__quadro">
        {criando ? (
          <div className="entrar__cabecalho">
            <button
              type="button"
              className="botao botao--voltar"
              onClick={() => trocarModo('entrar')}
              aria-label="Voltar para o login"
            >
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
            <h1 className="entrar__titulo">Bem-vindo ao Prosa</h1>
          </div>
        ) : (
          <div className="entrar__capa">
            <Marca tamanho={132} titulo="Prosa" />
            <h1 className="entrar__nome">Prosa</h1>
            <p className="entrar__lema">
              O clube de leitura dos seus amigos. A melhor parte do livro é depois.
            </p>
          </div>
        )}

        <div className="entrar__cartao">
          <form
            className="entrar__formulario"
            onSubmit={criando ? aoCriarConta : aoEntrar}
            noValidate
          >
            {erro && (
              <div
                className="aviso aviso--erro"
                role="alert"
                tabIndex={-1}
                ref={campoErro}
              >
                <span>{erro.texto}</span>
                {erro.acao === 'entrar' && (
                  <button
                    type="button"
                    className="aviso__acao"
                    onClick={() => trocarModo('entrar')}
                  >
                    Ir para o login com esse e-mail
                  </button>
                )}
              </div>
            )}

            {criando && (
              <div className="campo">
                <label className="campo__rotulo" htmlFor="nome">
                  Como te chamam
                </label>
                <div className="campo__caixa">
                  <input
                    id="nome"
                    className="campo__entrada"
                    ref={primeiroCampo}
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    maxLength={60}
                    required
                  />
                </div>
              </div>
            )}

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

            <div className="campo">
              <label className="campo__rotulo" htmlFor="senha">
                Senha
              </label>
              <div className="campo__caixa">
                <input
                  id="senha"
                  className="campo__entrada campo__entrada--com-botao"
                  type={senhaVisivel ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete={criando ? 'new-password' : 'current-password'}
                  minLength={criando ? MINIMO_DA_SENHA : undefined}
                  aria-describedby={criando ? 'ajuda-senha' : undefined}
                  required
                />
                <button
                  type="button"
                  className="campo__mostrar"
                  onClick={() => setSenhaVisivel((v) => !v)}
                  aria-pressed={senhaVisivel}
                >
                  {senhaVisivel ? 'ocultar' : 'mostrar'}
                </button>
              </div>

              {criando && (
                <>
                  <div
                    className="forca"
                    style={{ '--forca-cor': COR_DA_FORCA[forca] }}
                    aria-hidden="true"
                  >
                    <div className="forca__trilha">
                      {[1, 2, 3].map((degrau) => (
                        <span
                          key={degrau}
                          className={
                            'forca__degrau' +
                            (forca >= degrau ? ' forca__degrau--cheio' : '')
                          }
                        />
                      ))}
                    </div>
                    {senha.length > 0 && (
                      <span className="forca__rotulo">{ROTULO_DA_FORCA[forca]}</span>
                    )}
                  </div>
                  <p className="campo__ajuda" id="ajuda-senha" aria-live="polite">
                    {senha.length === 0
                      ? 'Mínimo 8 caracteres. Nada de "senha123", a gente confia em você.'
                      : senhaCurta
                        ? `Faltam ${MINIMO_DA_SENHA - senha.length} caracteres para chegar aos 8.`
                        : forca === 3
                          ? 'Senha boa. Pode seguir.'
                          : `Senha ${ROTULO_DA_FORCA[forca]}. Alongar um pouco, ou misturar números e símbolos, deixa melhor.`}
                  </p>
                </>
              )}
            </div>

            {criando && (
              <p className="privacidade">
                <span className="privacidade__marca" aria-hidden="true">
                  <Marca tamanho={20} />
                </span>
                <span>
                  Antes de continuar: sua <strong>lista de futuros é pública</strong> —
                  qualquer pessoa com conta no Prosa vê os livros que você quer ler, e
                  as suas notas e resenhas. O que você marcar como <em>lendo</em> só
                  aparece para os seus clubes.
                </span>
              </p>
            )}

            <button
              type="submit"
              className="botao botao--principal"
              disabled={enviando}
            >
              {enviando && <span className="giro" aria-hidden="true" />}
              {enviando
                ? criando
                  ? 'Criando sua conta…'
                  : 'Entrando…'
                : criando
                  ? 'Criar conta'
                  : 'Entrar'}
            </button>

            {!criando && (
              <button
                type="button"
                className="botao botao--secundario"
                onClick={() => trocarModo('criar')}
              >
                Criar minha conta
              </button>
            )}
          </form>

          {criando ? (
            <p className="entrar__alternativa">
              Já tem conta?{' '}
              <button
                type="button"
                className="botao botao--texto"
                onClick={() => trocarModo('entrar')}
              >
                Entrar
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
