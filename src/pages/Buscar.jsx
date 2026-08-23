import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buscaLivros, garanteLivro } from '../lib/buscaLivros'
import { livrosNaMinhaEstante } from '../lib/estante'
import { propoeLivro } from '../lib/ciclos'
import { mensagemDeErro } from '../lib/mensagens'
import { supabase } from '../lib/supabase'
import { ROTULO } from '../components/ChipEstado'
import { CardLivro } from '../components/CardLivro'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

export default function Buscar() {
  const navegar = useNavigate()
  const local = useLocation()

  // Quando a busca vem da votação, ela carrega o ciclo de destino.
  const ciclo = local.state?.ciclo ?? null
  const clubeId = local.state?.clube ?? null

  const [termo, setTermo] = useState('')
  const [buscado, setBuscado] = useState('')
  const [resultados, setResultados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  const [naEstante, setNaEstante] = useState({})
  const [propondo, setPropondo] = useState(null)
  const [defesa, setDefesa] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aoBuscar(evento) {
    evento.preventDefault()
    const limpo = termo.trim()
    if (!limpo) return

    setErro(null)
    setCarregando(true)
    setResultados(null)

    const { livros, erro: falha } = await buscaLivros(limpo)
    if (falha) {
      setErro(mensagemDeErro({ code: 'BUSCA_FORA' }))
      setCarregando(false)
      return
    }
    setBuscado(limpo)
    setResultados(livros)
    setCarregando(false)

    /* A B1 mostra "Na estante" no lugar da ação. Como o catálogo é externo, só
       dá para saber depois de conferir quais desses livros já foram copiados
       para o nosso banco e estão na estante de quem procura. */
    const chaves = livros.map((l) => `${l.fonte}:${l.fonte_id}`)
    if (chaves.length) {
      const { data } = await supabase
        .from('livro')
        .select('id, fonte, fonte_id')
        .in('fonte_id', livros.map((l) => l.fonte_id))

      const nossos = data ?? []
      const { porLivro } = await livrosNaMinhaEstante(nossos.map((l) => l.id))
      const porChave = {}
      for (const nosso of nossos) {
        const estado = porLivro[nosso.id]
        if (estado) porChave[`${nosso.fonte}:${nosso.fonte_id}`] = estado
      }
      setNaEstante(porChave)
    } else {
      setNaEstante({})
    }
  }

  async function aoVerFicha(achado) {
    const { livroId, erro: falha } = await garanteLivro(achado)
    if (falha) {
      setErro(mensagemDeErro(falha))
      return
    }
    navegar(`/livro/${livroId}`)
  }

  async function aoConfirmarProposta(evento) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    const { erro: falha } = await propoeLivro({ cicloId: ciclo, achado: propondo, defesa })
    if (falha) {
      setErro(mensagemDeErro(falha))
      setEnviando(false)
      return
    }
    navegar(`/clube/${clubeId}/votacao`, { replace: true })
  }

  const cabecalho = (
    <div style={{ padding: '24px 18px 12px' }}>
      <h1 className="entrar__titulo">Achar um livro</h1>
      <form className="busca" onSubmit={aoBuscar} role="search">
        <span aria-hidden="true" style={{ fontSize: 18, fontWeight: 800 }}>
          ⌕
        </span>
        <input
          className="busca__campo"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="título ou autor"
          aria-label="Buscar por título ou autor"
        />
        {termo && (
          <button
            type="button"
            className="busca__limpar"
            onClick={() => {
              setTermo('')
              setResultados(null)
            }}
            aria-label="Limpar a busca"
          >
            ×
          </button>
        )}
      </form>
    </div>
  )

  if (propondo) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="entrar__cabecalho">
            <button
              type="button"
              className="botao botao--voltar"
              onClick={() => setPropondo(null)}
              aria-label="Voltar para os resultados"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
                <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="entrar__titulo">Propor este livro</h1>
          </div>
          <div className="corpo">
            <div className="resultado">
              <CardLivro livro={propondo} />
              <div className="resultado__corpo">
                <span className="resultado__titulo">{propondo.titulo}</span>
                <span className="resultado__autor">{propondo.autores.join(', ')}</span>
              </div>
            </div>

            <form className="entrar__formulario-campos" onSubmit={aoConfirmarProposta} noValidate>
              {erro && (
                <div className="aviso aviso--erro" role="alert">
                  <span>{erro.texto}</span>
                </div>
              )}
              <div className="campo">
                <label className="campo__rotulo" htmlFor="defesa">
                  Por que este
                </label>
                <div className="campo__caixa">
                  <input
                    id="defesa"
                    className="campo__entrada"
                    value={defesa}
                    onChange={(e) => setDefesa(e.target.value)}
                    maxLength={200}
                    placeholder="opcional"
                  />
                </div>
                <p className="campo__ajuda">
                  Uma frase para convencer o clube. Até 200 caracteres.
                </p>
              </div>
              <button type="submit" className="botao botao--principal" disabled={enviando}>
                {enviando && <span className="giro" aria-hidden="true" />}
                {enviando ? 'Propondo…' : 'Propor para a votação'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        {cabecalho}

        <div className="corpo" style={{ paddingTop: 6 }}>
          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          {carregando && (
            <>
              <span className="rotulo-secao" role="status">
                Procurando…
              </span>
              {[1, 2, 3].map((n) => (
                <div className="esqueleto" key={n} aria-hidden="true">
                  <span className="esqueleto__bloco" style={{ width: 54, height: 80 }} />
                  <span style={{ flex: 1, display: 'grid', gap: 8 }}>
                    <span className="esqueleto__bloco" style={{ height: 15, width: '75%' }} />
                    <span className="esqueleto__bloco" style={{ height: 12, width: '45%' }} />
                    <span className="esqueleto__bloco" style={{ height: 11, width: '35%' }} />
                  </span>
                </div>
              ))}
            </>
          )}

          {!carregando && resultados?.length === 0 && (
            <div className="vazio">
              <Marca tamanho={88} titulo="Prosa" />
              <h2 className="vazio__titulo" style={{ fontSize: 25 }}>
                Esse aí ninguém achou ainda
              </h2>
              <p className="vazio__texto">
                Tenta pelo nome do autor — o catálogo às vezes conhece a pessoa e não o
                título.
              </p>
              <button
                type="button"
                className="botao botao--secundario"
                style={{ width: '100%', marginTop: 18 }}
                onClick={() => {
                  setResultados(null)
                  document.getElementById('busca-campo')?.focus()
                }}
              >
                Buscar por autor
              </button>
            </div>
          )}

          {!carregando && resultados?.length > 0 && (
            <>
              <span className="rotulo-secao">
                {resultados.length === 1
                  ? '1 livro encontrado'
                  : `${resultados.length} livros encontrados`}
                {buscado && ` para ${buscado}`}
              </span>

              {resultados.map((achado) => (
                <div className="resultado" key={`${achado.fonte}:${achado.fonte_id}`}>
                  <CardLivro livro={achado} />
                  <button
                    type="button"
                    className="resultado__corpo"
                    onClick={() => aoVerFicha(achado)}
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  >
                    <span className="resultado__titulo">{achado.titulo}</span>
                    <span className="resultado__autor">
                      {achado.autores.length ? achado.autores.join(', ') : 'autoria não informada'}
                    </span>
                    <span className="resultado__meta">
                      {[
                        achado.paginas ? `${achado.paginas} páginas` : null,
                        achado.ano ? String(achado.ano) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                  {naEstante[`${achado.fonte}:${achado.fonte_id}`] ? (
                    <span className="selo">
                      Na estante · {ROTULO[naEstante[`${achado.fonte}:${achado.fonte_id}`]]}
                    </span>
                  ) : ciclo ? (
                    <button
                      type="button"
                      className="resultado__acao"
                      onClick={() => {
                        setDefesa('')
                        setPropondo(achado)
                      }}
                    >
                      Propor
                    </button>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
