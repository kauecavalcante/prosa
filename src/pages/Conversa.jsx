import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { escreveFala, listaFalas } from '../lib/conversa'
import { buscaLivroPorId } from '../lib/buscaLivros'
import { mensagemDeErro } from '../lib/mensagens'
import { useClube } from '../hooks/useClube'
import { useSessao } from '../hooks/useSessao'
import { Retrato } from '../components/Retrato'
import { Spoiler } from '../components/Spoiler'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

function quando(iso) {
  const agora = Date.now()
  const then = new Date(iso).getTime()
  const horas = Math.floor((agora - then) / 3600000)
  if (horas < 1) return 'agora há pouco'
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

export default function Conversa() {
  const { id, livroId } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSessao()
  const { clube } = useClube(id)

  const [livro, setLivro] = useState(null)
  const [falas, setFalas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    const [{ livro: achado }, { falas: lista }] = await Promise.all([
      buscaLivroPorId(livroId),
      listaFalas({ clubeId: id, livroId }),
    ])
    setLivro(achado)
    setFalas(lista ?? [])
    setCarregando(false)
  }, [id, livroId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aoEnviar(evento) {
    evento.preventDefault()
    if (!texto.trim()) return
    setErro(null)
    setEnviando(true)

    const { erro: falha } = await escreveFala({ clubeId: id, livroId, texto, spoiler })
    if (falha) {
      setErro(mensagemDeErro(falha))
      setEnviando(false)
      return
    }
    setTexto('')
    setSpoiler(false)
    setEnviando(false)
    carregar()
  }

  if (carregando) return null

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
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
            <span className="rotulo-secao">{clube?.nome}</span>
          </span>
          <h1 className="faixa__titulo" style={{ marginTop: 6 }}>
            {livro?.titulo ?? 'Conversa'}
          </h1>
          <p className="situacao">
            <span className="situacao__marca" aria-hidden="true" />
            Aberta o tempo todo · marque spoiler e cada um lê quando quiser
          </p>
        </div>

        <div className="corpo">
          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          {falas.length === 0 && (
            <div className="vazio">
              <Marca tamanho={80} titulo="Prosa" />
              <h2 className="vazio__titulo" style={{ fontSize: 23 }}>
                Ninguém falou ainda
              </h2>
              <p className="vazio__texto">
                A conversa não espera data. Se você já leu um trecho que mexeu com você,
                comece — e marque como spoiler se contar demais.
              </p>
            </div>
          )}

          {falas.map((fala) => (
            <article className="fala" key={fala.id}>
              <div className="fala__quem">
                <Retrato nome={fala.quem.retrato} tamanho={30} />
                <span className="fala__nome">
                  {fala.quem.nome}
                  {fala.quem.id === usuario?.id && (
                    <span style={{ fontWeight: 700, color: 'var(--tinta-suave)' }}> · você</span>
                  )}
                </span>
                <span className="fala__quando">{quando(fala.criado_em)}</span>
              </div>

              {fala.spoiler ? (
                <Spoiler quem={fala.quem.nome}>{fala.texto}</Spoiler>
              ) : (
                <p className="fala__texto">{fala.texto}</p>
              )}
            </article>
          ))}

          <form className="caminho" onSubmit={aoEnviar} style={{ marginTop: 0 }}>
            <span className="cartao__rotulo">Falar sobre o livro</span>
            <div className="campo__caixa">
              <textarea
                id="fala"
                className="campo__entrada"
                style={{ height: 92, padding: '12px 15px', resize: 'vertical' }}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="o que esse livro fez com você?"
                aria-label="Sua mensagem"
              />
            </div>

            <label className="marcar-spoiler">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
              />
              Contém spoiler
            </label>
            <p className="caminho__texto" style={{ marginTop: -4 }}>
              Marcado, ele nasce oculto e só abre para quem escolher ver.
            </p>

            <button type="submit" className="botao botao--principal" disabled={enviando}>
              {enviando && <span className="giro" aria-hidden="true" />}
              {enviando ? 'Enviando…' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
