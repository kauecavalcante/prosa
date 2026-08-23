import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  cicloAberto,
  cicloComLivro,
  encerraVotacao,
  listaPropostas,
  registraVoto,
  votosDoCiclo,
} from '../lib/ciclos'
import { mensagemDeErro } from '../lib/mensagens'
import { useClube } from '../hooks/useClube'
import { useSessao } from '../hooks/useSessao'
import { CardLivro } from '../components/CardLivro'
import { Retrato } from '../components/Retrato'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

const DIA = 24 * 60 * 60 * 1000

function quandoFecha(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Votacao() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSessao()
  const { clube, membros } = useClube(id)

  const [ciclo, setCiclo] = useState(null)
  const [passado, setPassado] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [votos, setVotos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(null)
  const [erro, setErro] = useState(null)

  const [encerrando, setEncerrando] = useState(false)
  const [escolhido, setEscolhido] = useState(null)
  const [prazo, setPrazo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const souAdmin = membros.some((m) => m.perfil.id === usuario?.id && m.papel === 'admin')

  const carregar = useCallback(async () => {
    const { ciclo: aberto } = await cicloAberto(id)
    setCiclo(aberto)

    const { ciclo: anterior } = await cicloComLivro(id)
    setPassado(anterior)

    if (aberto) {
      const [{ propostas: lista }, { votos: dados }] = await Promise.all([
        listaPropostas(aberto.id),
        votosDoCiclo(aberto.id),
      ])
      setPropostas(lista ?? [])
      setVotos(dados ?? [])
    }
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const meuVoto = votos.find((v) => v.perfil_id === usuario?.id) ?? null
  const contagem = (propostaId) => votos.filter((v) => v.proposta_id === propostaId).length
  const votantes = new Set(votos.map((v) => v.perfil_id)).size

  const maisVotos = propostas.length
    ? Math.max(...propostas.map((p) => contagem(p.id)))
    : 0
  const lideres = propostas.filter((p) => contagem(p.id) === maisVotos)
  const empatado = maisVotos > 0 && lideres.length > 1

  async function aoVotar(propostaId) {
    setErro(null)
    setOcupado(propostaId)

    const { erro: falha } = await registraVoto({
      cicloId: ciclo.id,
      propostaId,
      jaVotou: Boolean(meuVoto),
    })

    if (falha) {
      setErro(mensagemDeErro(falha))
      setOcupado(null)
      return
    }
    await carregar()
    setOcupado(null)
  }

  async function aoEncerrar(evento) {
    evento.preventDefault()
    setErro(null)

    const vencedor = empatado ? escolhido : lideres[0]?.livro?.id
    if (!vencedor) {
      setErro({ texto: 'Escolha qual livro venceu antes de encerrar.' })
      return
    }
    if (!prazo) {
      setErro({ texto: 'Defina o prazo de leitura. É a meta que mantém o clube junto.' })
      return
    }

    setSalvando(true)
    const { erro: falha } = await encerraVotacao({
      cicloId: ciclo.id,
      livroId: vencedor,
      prazo,
    })

    if (falha) {
      setErro(mensagemDeErro(falha))
      setSalvando(false)
      return
    }
    navegar(`/clube/${id}`, { replace: true })
  }

  if (carregando) return null

  const voltar = (
    <button
      type="button"
      className="botao botao--voltar"
      onClick={() => navegar(`/clube/${id}`)}
      aria-label="Voltar para o clube"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )

  if (!ciclo) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="faixa">
            <div className="faixa__linha">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                {voltar}
                <h1 className="faixa__titulo">Votação</h1>
              </span>
            </div>
          </div>
          <div className="corpo">
            <div className="vazio">
              <Marca tamanho={88} titulo="Prosa" />
              <h2 className="vazio__titulo" style={{ fontSize: 25 }}>
                Nenhuma votação aberta
              </h2>
              <p className="vazio__texto">
                Quem administra o clube abre a votação a partir da tela do clube.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {voltar}
            <span className="rotulo-secao">{clube?.nome}</span>
          </span>
          <h1 className="faixa__titulo" style={{ marginTop: 6 }}>
            O que a gente lê depois?
          </h1>
          <p className="situacao">
            <span className="situacao__marca" aria-hidden="true" />
            {ciclo.votacao_ate ? (
              <>
                Aberta até <strong>{quandoFecha(ciclo.votacao_ate)}</strong>
              </>
            ) : (
              'Aberta'
            )}
            {membros.length > 0 && ` · ${votantes} de ${membros.length} votaram`}
          </p>
        </div>

        <div className="corpo">
          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          {propostas.length === 0 && (
            <div className="caminho" style={{ marginTop: 0 }}>
              <p className="caminho__texto">
                Ninguém propôs nada por enquanto. O primeiro livro da lista costuma puxar
                os outros — comece você.
              </p>
            </div>
          )}

          {propostas.map((proposta) => {
            const minha = meuVoto?.proposta_id === proposta.id
            const total = contagem(proposta.id)
            return (
              <div
                className={'resultado proposta' + (minha ? ' proposta--minha' : '')}
                key={proposta.id}
              >
                {minha && <span className="proposta__selo">seu voto</span>}
                <CardLivro livro={proposta.livro} />
                <div className="resultado__corpo">
                  <span className="resultado__titulo">{proposta.livro.titulo}</span>
                  <span className="resultado__autor">
                    {[
                      proposta.livro.autores?.length
                        ? proposta.livro.autores.join(', ')
                        : 'autoria não informada',
                      proposta.livro.paginas ? `${proposta.livro.paginas} pág.` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {proposta.defesa && (
                    <span className="proposta__defesa">
                      <Retrato nome={proposta.quem?.retrato} tamanho={22} />
                      <span style={{ minWidth: 0 }}>
                        {proposta.quem?.nome}: {proposta.defesa}
                      </span>
                    </span>
                  )}
                  <span className="proposta__votos">
                    {total === 1 ? '1 voto' : `${total} votos`}
                  </span>
                </div>
                <button
                  type="button"
                  className={'acao-votar' + (minha ? ' acao-votar--votado' : '')}
                  onClick={() => aoVotar(proposta.id)}
                  disabled={ocupado !== null || minha}
                  aria-pressed={minha}
                >
                  {ocupado === proposta.id ? '…' : minha ? 'Votado' : 'Votar'}
                </button>
              </div>
            )
          })}

          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => navegar('/buscar', { state: { ciclo: ciclo.id, clube: id } })}
          >
            Propor um livro
          </button>
          <p className="caminho__texto" style={{ textAlign: 'center' }}>
            Cada pessoa vota em um só. Dá pra trocar enquanto a votação estiver aberta.
          </p>

          {souAdmin && propostas.length > 0 && !encerrando && (
            <button
              type="button"
              className="botao botao--principal"
              onClick={() => {
                setEscolhido(empatado ? null : (lideres[0]?.livro?.id ?? null))
                setEncerrando(true)
              }}
            >
              Encerrar a votação
            </button>
          )}

          {souAdmin && encerrando && (
            <form className="caminho" onSubmit={aoEncerrar} style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Encerrar a votação</span>

              {empatado ? (
                <>
                  <p className="caminho__texto">
                    {lideres.length} livros empataram com {maisVotos}{' '}
                    {maisVotos === 1 ? 'voto' : 'votos'}. O desempate é do clube, não do
                    Prosa — diga qual venceu.
                  </p>
                  <div role="radiogroup" aria-label="Livro vencedor" style={{ display: 'grid', gap: 8 }}>
                    {lideres.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={escolhido === p.livro.id}
                        className={
                          'clube-cartao' + (escolhido === p.livro.id ? ' proposta--minha' : '')
                        }
                        onClick={() => setEscolhido(p.livro.id)}
                      >
                        <span className="clube-cartao__nome">{p.livro.titulo}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="caminho__texto">
                  Vence <strong>{lideres[0]?.livro?.titulo}</strong>, com {maisVotos}{' '}
                  {maisVotos === 1 ? 'voto' : 'votos'}.
                </p>
              )}

              <div className="campo">
                <label className="campo__rotulo" htmlFor="prazo">
                  Prazo de leitura
                </label>
                <div className="campo__caixa">
                  <input
                    id="prazo"
                    className="campo__entrada"
                    type="date"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                    min={new Date(Date.now() + DIA).toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <p className="campo__ajuda">
                  É a meta que mantém o clube junto. A conversa fica aberta o tempo todo,
                  antes e depois dessa data.
                </p>
              </div>

              <button type="submit" className="botao botao--principal" disabled={salvando}>
                {salvando && <span className="giro" aria-hidden="true" />}
                {salvando ? 'Encerrando…' : 'Encerrar e começar a leitura'}
              </button>
              <button
                type="button"
                className="botao botao--secundario"
                onClick={() => setEncerrando(false)}
              >
                Agora não
              </button>
            </form>
          )}

          {/* US-26: só aparece quando existe um ciclo anterior com livro escolhido. */}
          {passado?.livro && (
            <>
              <span className="rotulo-secao">Ciclo passado</span>
              <div className="resultado">
                <CardLivro livro={passado.livro} />
                <div className="resultado__corpo">
                  <span className="resultado__titulo">{passado.livro.titulo}</span>
                  <span className="resultado__autor">
                    {passado.livro.autores?.join(', ')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
