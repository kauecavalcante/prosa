import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { geraConvite } from '../lib/clubes'
import { abreVotacao, cicloAberto, cicloComLivro } from '../lib/ciclos'
import { CardLivro } from '../components/CardLivro'
import { estadosDosMembros } from '../lib/estante'
import { COR, FormaEstado, ROTULO } from '../components/ChipEstado'
import { mensagemDeErro } from '../lib/mensagens'
import { useClube } from '../hooks/useClube'
import { useSessao } from '../hooks/useSessao'
import { Retrato } from '../components/Retrato'
import '../estilos/clube.css'

/* O prazo é meta de leitura, e não trava: a conversa fica aberta antes e
   depois dele — decisão 3.6 da arquitetura. Aqui ele só é mostrado. */
function diasAte(prazo) {
  const alvo = new Date(`${prazo}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((alvo - hoje) / (24 * 60 * 60 * 1000)))
}

export default function Clube() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSessao()
  const { clube, membros, carregando, erro } = useClube(id)

  const [convite, setConvite] = useState(null)
  const [gerando, setGerando] = useState(false)
  const [erroDoConvite, setErroDoConvite] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [ciclo, setCiclo] = useState(null)
  const [emLeitura, setEmLeitura] = useState(null)
  const [estadosPorPerfil, setEstadosPorPerfil] = useState({})
  const [abrindo, setAbrindo] = useState(false)

  const souAdmin = membros.some((m) => m.perfil.id === usuario?.id && m.papel === 'admin')

  useEffect(() => {
    let ativo = true
    cicloAberto(id).then(({ ciclo: aberto }) => {
      if (ativo) setCiclo(aberto)
    })
    cicloComLivro(id).then(({ ciclo: lendo }) => {
      if (ativo) setEmLeitura(lendo)
    })
    return () => {
      ativo = false
    }
  }, [id])

  useEffect(() => {
    let ativo = true
    const livroId = emLeitura?.livro?.id
    const ids = membros.map((m) => m.perfil.id)
    if (!livroId || !ids.length) return

    estadosDosMembros({ livroId, perfilIds: ids }).then(({ porPerfil }) => {
      if (ativo) setEstadosPorPerfil(porPerfil)
    })
    return () => {
      ativo = false
    }
  }, [emLeitura, membros])

  async function aoAbrirVotacao() {
    setErroDoConvite(null)
    setAbrindo(true)

    // Uma semana para a votação; o prazo de leitura vem depois, com o livro.
    const ate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { ciclo: novo, erro: falha } = await abreVotacao({ clubeId: id, votacaoAte: ate })

    if (falha) {
      setErroDoConvite(mensagemDeErro(falha))
      setAbrindo(false)
      return
    }
    setCiclo(novo)
    setAbrindo(false)
    navegar(`/clube/${id}/votacao`)
  }

  async function aoConvidar() {
    setErroDoConvite(null)
    setGerando(true)
    const { convite: gerado, erro: falha } = await geraConvite(id)
    if (falha) {
      setErroDoConvite(mensagemDeErro(falha))
      setGerando(false)
      return
    }
    setConvite(gerado)
    setGerando(false)
  }

  async function aoCopiar() {
    const link = `${window.location.origin}/convite/${convite.codigo}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  if (carregando) return null

  if (erro || !clube) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="corpo" style={{ justifyContent: 'center' }}>
            <p className="aviso aviso--erro" role="status">
              Este clube não existe ou você não faz parte dele. Clube é fechado: só quem
              foi chamado enxerga.
            </p>
            <button type="button" className="botao botao--principal" onClick={() => navegar('/')}>
              Ver os seus clubes
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <div className="faixa__linha">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <button
                type="button"
                className="botao botao--voltar"
                onClick={() => navegar('/')}
                aria-label="Voltar para os seus clubes"
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
              <h1 className="faixa__titulo">{clube.nome}</h1>
            </span>
            {souAdmin && (
              <button type="button" className="pilula" onClick={aoConvidar} disabled={gerando}>
                {gerando ? 'Gerando…' : 'Convidar'}
              </button>
            )}
          </div>
          {clube.descricao && <p className="faixa__descricao">{clube.descricao}</p>}
        </div>

        <div className="corpo">
          {erroDoConvite && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erroDoConvite.texto}</span>
            </div>
          )}

          {convite && (
            <div className="caminho" style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Código do convite</span>
              <span className="codigo">{convite.codigo}</span>
              <p className="caminho__texto">
                Vale por sete dias. Quem receber entra pelo código ou pelo link.
              </p>
              <button type="button" className="botao botao--secundario" onClick={aoCopiar}>
                {copiado ? 'Link copiado' : 'Copiar o link'}
              </button>
            </div>
          )}

          <span className="rotulo-secao">Livro do ciclo</span>
          {emLeitura?.livro ? (
            <div className="caminho" style={{ marginTop: 0 }}>
              <div className="ciclo-livro">
                <CardLivro livro={emLeitura.livro} largura={70} altura={102} />
                <div className="ciclo-livro__corpo">
                  <span className="resultado__titulo" style={{ fontSize: 21 }}>
                    {emLeitura.livro.titulo}
                  </span>
                  <span className="resultado__autor">
                    {emLeitura.livro.autores?.length
                      ? emLeitura.livro.autores.join(', ')
                      : 'autoria não informada'}
                  </span>
                  {emLeitura.prazo && (
                    <span className="ciclo-livro__prazo">
                      <span className="ciclo-livro__numero">{diasAte(emLeitura.prazo)}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>
                        {diasAte(emLeitura.prazo) === 1 ? 'dia até' : 'dias até'}
                        <br />a conversa
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="botao botao--principal"
                onClick={() => navegar(`/clube/${id}/livro/${emLeitura.livro.id}`)}
              >
                Abrir a conversa
              </button>

              {/* Sem isto o clube travava no primeiro ciclo: com um livro em
                  leitura, não havia caminho para escolher o próximo. */}
              {ciclo ? (
                <button
                  type="button"
                  className="botao botao--secundario"
                  onClick={() => navegar(`/clube/${id}/votacao`)}
                >
                  Ver a votação do próximo
                </button>
              ) : souAdmin ? (
                <button
                  type="button"
                  className="botao botao--secundario"
                  onClick={aoAbrirVotacao}
                  disabled={abrindo}
                >
                  {abrindo && <span className="giro" aria-hidden="true" />}
                  {abrindo ? 'Abrindo…' : 'Abrir a votação do próximo'}
                </button>
              ) : null}
            </div>
          ) : ciclo ? (
            <div className="caminho" style={{ marginTop: 0 }}>
              <p className="caminho__texto">
                A votação está aberta. O livro do ciclo sai dela — proponha o seu e
                veja o que o clube já sugeriu.
              </p>
              <button
                type="button"
                className="botao botao--principal"
                onClick={() => navegar(`/clube/${id}/votacao`)}
              >
                Ver a votação
              </button>
            </div>
          ) : (
            <div className="caminho" style={{ marginTop: 0 }}>
              <p className="caminho__texto">
                Nenhum ciclo aberto ainda. A votação escolhe o livro, e o livro escolhido
                aparece aqui com o prazo da conversa.
              </p>
              {souAdmin ? (
                <button
                  type="button"
                  className="botao botao--principal"
                  onClick={aoAbrirVotacao}
                  disabled={abrindo}
                >
                  {abrindo && <span className="giro" aria-hidden="true" />}
                  {abrindo ? 'Abrindo…' : 'Abrir a votação'}
                </button>
              ) : (
                <p className="caminho__texto">
                  Quem administra o clube é quem abre a votação.
                </p>
              )}
            </div>
          )}

          <span className="rotulo-secao">Quem está no clube</span>
          <ul className="lista">
            {membros.map((membro) => (
              <li key={membro.perfil.id} className="lista__item">
                <Retrato nome={membro.perfil.retrato} tamanho={38} />
                <span className="lista__nome">
                  {membro.perfil.nome}
                  {membro.perfil.id === usuario?.id && <span> · você</span>}
                </span>
                {estadosPorPerfil[membro.perfil.id] && (
                  <span
                    className="estado-membro"
                    style={{ '--cor-estado': COR[estadosPorPerfil[membro.perfil.id]] }}
                  >
                    <FormaEstado estado={estadosPorPerfil[membro.perfil.id]} tamanho={11} />
                    {ROTULO[estadosPorPerfil[membro.perfil.id]]}
                  </span>
                )}
                {membro.papel === 'admin' && <span className="selo">administra</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
