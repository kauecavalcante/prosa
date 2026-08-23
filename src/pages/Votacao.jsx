import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cicloAberto, listaPropostas } from '../lib/ciclos'
import { useClube } from '../hooks/useClube'
import { CardLivro } from '../components/CardLivro'
import { Retrato } from '../components/Retrato'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

export default function Votacao() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { clube } = useClube(id)

  const [ciclo, setCiclo] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { ciclo: aberto } = await cicloAberto(id)
    setCiclo(aberto)
    if (aberto) {
      const { propostas: lista } = await listaPropostas(aberto.id)
      setPropostas(lista ?? [])
    }
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) return null

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <div className="faixa__linha">
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
              <h1 className="faixa__titulo">Votação</h1>
            </span>
          </div>
          {clube && <p className="faixa__descricao">{clube.nome}</p>}
        </div>

        <div className="corpo">
          {!ciclo ? (
            <div className="vazio">
              <Marca tamanho={88} titulo="Prosa" />
              <h2 className="vazio__titulo" style={{ fontSize: 25 }}>
                Nenhuma votação aberta
              </h2>
              <p className="vazio__texto">
                Quem administra o clube abre a votação a partir da tela do clube.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="botao botao--principal"
                onClick={() => navegar('/buscar', { state: { ciclo: ciclo.id, clube: id } })}
              >
                Propor um livro
              </button>

              <span className="rotulo-secao">
                {propostas.length === 0
                  ? 'Nada proposto ainda'
                  : propostas.length === 1
                    ? '1 livro na disputa'
                    : `${propostas.length} livros na disputa`}
              </span>

              {propostas.length === 0 && (
                <div className="caminho" style={{ marginTop: 0 }}>
                  <p className="caminho__texto">
                    Ninguém propôs nada por enquanto. O primeiro livro da lista costuma
                    puxar os outros — comece você.
                  </p>
                </div>
              )}

              {propostas.map((proposta) => (
                <div className="resultado" key={proposta.id}>
                  <CardLivro livro={proposta.livro} />
                  <div className="resultado__corpo">
                    <span className="resultado__titulo">{proposta.livro.titulo}</span>
                    <span className="resultado__autor">
                      {proposta.livro.autores?.length
                        ? proposta.livro.autores.join(', ')
                        : 'autoria não informada'}
                    </span>
                    {proposta.defesa && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <Retrato nome={proposta.quem?.retrato} tamanho={22} />
                        <span style={{ minWidth: 0 }}>
                          {proposta.quem?.nome}: {proposta.defesa}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Votar é o próximo passo do épico E4. */}
              <div className="caminho" style={{ marginTop: 0 }}>
                <p className="caminho__texto">
                  A votação em si chega em seguida. Por enquanto o clube junta as
                  propostas.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
