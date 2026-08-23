import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MINIMO_DA_SENHA, mensagemDeErro } from '../lib/mensagens'
import { encerraRecuperacao, marcadorDeRecuperacao } from '../lib/recuperacao'
import { CampoSenha } from '../components/CampoSenha'
import { Marca } from '../components/Marca'
import '../estilos/formulario.css'

export default function NovaSenha() {
  const navegar = useNavigate()

  const [marcador] = useState(marcadorDeRecuperacao)
  const [estado, setEstado] = useState('verificando')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const campoErro = useRef(null)

  useEffect(() => {
    if (erro) campoErro.current?.focus()
  }, [erro])

  useEffect(() => {
    if (marcador.erro) {
      setErro(mensagemDeErro(marcador.erro))
      setEstado('sem-recuperacao')
      return
    }

    // Só o marcador de recuperação abre o formulário. Sessão comum não serve:
    // quem pegasse um aparelho destravado trocaria a senha sem saber a atual,
    // e a troca derruba as outras sessões — o dono é que ficaria de fora.
    if (!marcador.recuperacao) {
      setEstado('sessao-comum')
      return
    }

    let ativo = true

    // O token pode ser consumido antes desta tela montar, então além de ouvir
    // o aviso a sessão também é lida.
    const { data: inscricao } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!ativo) return
      if (evento === 'PASSWORD_RECOVERY' || (evento === 'SIGNED_IN' && sessao)) {
        setEstado('pronto')
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setEstado((atual) =>
        atual === 'verificando' ? (data.session ? 'pronto' : 'sem-recuperacao') : atual
      )
    })

    return () => {
      ativo = false
      inscricao.subscription.unsubscribe()
    }
  }, [marcador])

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

  if (estado === 'verificando') return null

  // Já autenticado e sem vir de link: esta tela não é o lugar de trocar senha
  // sabendo a atual — isso é outra história, com pedido da senha vigente.
  if (estado === 'sessao-comum') return <Navigate to="/" replace />

  if (estado === 'sem-recuperacao') {
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
