import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MINIMO_DA_SENHA, mensagemDeErro } from '../lib/mensagens'
import {
  assinaRecuperacao,
  encerraRecuperacao,
  pistaDoEndereco,
  recuperacaoConfirmada,
  sessaoNasceuDeSenha,
} from '../lib/recuperacao'
import { CampoSenha } from '../components/CampoSenha'
import { Marca } from '../components/Marca'
import '../estilos/formulario.css'

export default function NovaSenha() {
  const navegar = useNavigate()

  const [pista] = useState(pistaDoEndereco)
  const [estado, setEstado] = useState('verificando')
  const [temSessao, setTemSessao] = useState(false)
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const campoErro = useRef(null)

  useEffect(() => {
    if (erro) campoErro.current?.focus()
  }, [erro])

  useEffect(() => {
    if (pista.erro) {
      setErro(mensagemDeErro(pista.erro))
      setEstado('sem-recuperacao')
      return
    }

    let ativo = true

    const liberar = () => {
      if (ativo) setEstado('pronto')
    }

    if (recuperacaoConfirmada()) {
      liberar()
      return
    }

    // A pista do endereço não abre o formulário sozinha: ela só compra tempo
    // para o evento chegar. Sem evento, nega.
    if (!pista.emCurso) {
      supabase.auth.getSession().then(({ data }) => {
        if (!ativo) return
        setTemSessao(Boolean(data.session))
        setEstado('negado')
      })
      return () => {
        ativo = false
      }
    }

    const desassina = assinaRecuperacao(liberar)

    // getSession só resolve depois de a biblioteca terminar de processar o
    // endereço; a folga cobre o disparo do evento, que ela agenda para o
    // laço seguinte.
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setTemSessao(Boolean(data.session))
      setTimeout(() => {
        if (!ativo) return
        // Sessão nascida de senha não troca senha por aqui: o servidor pede a
        // atual e o formulário só levaria a pessoa a um erro evitável.
        if (recuperacaoConfirmada() && !sessaoNasceuDeSenha(data.session)) liberar()
        else setEstado('negado')
      }, 250)
    })

    return () => {
      ativo = false
      desassina()
    }
  }, [pista])

  function pedirOutroLink() {
    navegar('/entrar', { replace: true, state: { passo: 'recuperar' } })
  }

  async function aoSalvar(evento) {
    evento.preventDefault()
    setErro(null)

    if (senha.length < MINIMO_DA_SENHA) {
      setErro({ texto: `A senha precisa de pelo menos ${MINIMO_DA_SENHA} caracteres.` })
      return
    }

    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro(mensagemDeErro(error))
      setEnviando(false)
      return
    }

    encerraRecuperacao()
    navegar('/', { replace: true })
  }

  function SemRecuperacao() {
    return (
      <main className="entrar entrar--formulario">
        <div className="entrar__quadro">
          <div className="entrar__cabecalho">
            <h1 className="entrar__titulo">Esse link não vale mais</h1>
          </div>
          <div className="entrar__rolagem">
            <p className="aviso aviso--erro" role="status">
              {erro?.texto ??
                'Esse link de senha já venceu ou já foi usado. Cada link serve uma vez só.'}
            </p>
            <p className="campo__ajuda">
              Peça outro e abra a mensagem mais recente — os links antigos param de
              funcionar assim que um novo é pedido.
            </p>
            <button type="button" className="botao botao--principal" onClick={pedirOutroLink}>
              Pedir um link novo
            </button>
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => navegar('/entrar', { replace: true })}
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (estado === 'verificando') return null

  // Sem evento de recuperação confirmado pela biblioteca não há formulário.
  // Quem já está autenticado volta para o feed; quem não está vê a tela de
  // link inválido, que oferece pedir outro.
  if (estado === 'negado') {
    return temSessao ? <Navigate to="/" replace /> : <SemRecuperacao />
  }

  if (estado === 'sem-recuperacao') return <SemRecuperacao />

  return (
    <main className="entrar">
      <div className="entrar__quadro">
        <div className="entrar__capa">
          <Marca tamanho={132} titulo="Prosa" />
          <h1 className="entrar__nome">Senha nova</h1>
          <p className="entrar__lema">Escolha uma senha e a gente te devolve para a prosa.</p>
        </div>

        <div className="entrar__folha">
          <form className="entrar__formulario-campos" onSubmit={aoSalvar} noValidate>
            {erro && (
              <div className="aviso aviso--erro" role="alert" tabIndex={-1} ref={campoErro}>
                <span>{erro.texto}</span>
                {erro.acao === 'novo-link' && (
                  <button type="button" className="aviso__acao" onClick={pedirOutroLink}>
                    Pedir um link novo
                  </button>
                )}
              </div>
            )}

            <CampoSenha
              id="senha-nova"
              rotulo="Senha nova"
              valor={senha}
              aoMudar={setSenha}
              autoComplete="new-password"
              medirForca
            />

            <button type="submit" className="botao botao--principal" disabled={enviando}>
              {enviando && <span className="giro" aria-hidden="true" />}
              {enviando ? 'Salvando…' : 'Salvar e entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
