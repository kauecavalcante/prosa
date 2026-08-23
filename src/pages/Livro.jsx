import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscaLivroPorId } from '../lib/buscaLivros'
import { mensagemDeErro } from '../lib/mensagens'
import { CardLivro } from '../components/CardLivro'
import '../estilos/clube.css'

/* A B3 traz nota média e a contagem por estado na estante. Nota é o épico E6 e
   estante é o E5 — nada disso existe, e inventar número é pior que omitir. Os
   blocos que dependem deles não aparecem ainda. */
export default function Livro() {
  const { id } = useParams()
  const navegar = useNavigate()

  const [livro, setLivro] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [inteira, setInteira] = useState(false)

  useEffect(() => {
    let ativo = true
    buscaLivroPorId(id).then(({ livro: achado, erro: falha }) => {
      if (!ativo) return
      if (falha) setErro(mensagemDeErro(falha))
      setLivro(achado)
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [id])

  if (carregando) return null

  if (!livro) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="corpo" style={{ justifyContent: 'center' }}>
            <p className="aviso aviso--erro" role="status">
              {erro?.texto ?? 'Não encontramos esse livro.'}
            </p>
            <button type="button" className="botao botao--principal" onClick={() => navegar('/buscar')}>
              Buscar um livro
            </button>
          </div>
        </div>
      </main>
    )
  }

  const fichas = [
    livro.paginas ? { valor: livro.paginas, rotulo: 'páginas' } : null,
    livro.ano ? { valor: livro.ano, rotulo: 'publicado' } : null,
    livro.editora ? { valor: livro.editora, rotulo: 'editora' } : null,
  ].filter(Boolean)

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa" style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <button
            type="button"
            className="botao botao--voltar"
            onClick={() => navegar(-1)}
            aria-label="Voltar"
            style={{ marginBottom: 'auto' }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
              <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <CardLivro livro={livro} largura={82} altura={120} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="faixa__titulo" style={{ fontSize: 24 }}>
              {livro.titulo}
            </h1>
            <span className="resultado__autor" style={{ marginTop: 2 }}>
              {livro.autores?.length ? livro.autores.join(', ') : 'autoria não informada'}
            </span>
          </div>
        </div>

        <div className="corpo">
          {fichas.length > 0 && (
            <div className="fichas">
              {fichas.map((f) => (
                <span className="ficha" key={f.rotulo}>
                  <span className="ficha__valor">{f.valor}</span>
                  <span className="ficha__rotulo">{f.rotulo}</span>
                </span>
              ))}
            </div>
          )}

          {livro.descricao ? (
            <div className="caminho" style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Sobre o livro</span>
              <p className={'sinopse' + (inteira ? '' : ' sinopse--curta')}>{livro.descricao}</p>
              <button
                type="button"
                className="botao botao--texto"
                onClick={() => setInteira((v) => !v)}
              >
                {inteira ? 'ler menos' : 'ler mais'}
              </button>
            </div>
          ) : (
            <div className="caminho" style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Sobre o livro</span>
              <p className="caminho__texto">
                O catálogo não trouxe sinopse para este título.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
