import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listaEstante, moveItem, quemMaisEstaNoLivro } from '../lib/estante'
import { mensagemDeErro } from '../lib/mensagens'
import { useSessao } from '../hooks/useSessao'
import { CardLivro } from '../components/CardLivro'
import { ChipEstado, COR, ESTADOS, FormaEstado, ROTULO } from '../components/ChipEstado'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

function frasedeCompanhia(pessoas) {
  if (!pessoas.length) return null
  const nomes = pessoas.map((p) => p.nome)
  if (nomes.length === 1) return `${nomes[0]} está nesse também`
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]} estão nesse também`
  return `${nomes[0]}, ${nomes[1]} e mais ${nomes.length - 2} estão nesse também`
}

export default function Estante() {
  const navegar = useNavigate()
  const { usuario } = useSessao()

  const [itens, setItens] = useState(null)
  const [companhia, setCompanhia] = useState([])
  const [erro, setErro] = useState(null)
  const [arrastando, setArrastando] = useState(null)
  const [alvo, setAlvo] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)

  const aviso = useRef(null)

  const carregar = useCallback(async () => {
    if (!usuario) return
    const { itens: lista, erro: falha } = await listaEstante(usuario.id)
    if (falha) {
      setErro(mensagemDeErro(falha))
      setItens([])
      return
    }
    setItens(lista)

    const lendo = lista.find((i) => i.estado === 'lendo')
    if (lendo) {
      const { pessoas } = await quemMaisEstaNoLivro({
        livroId: lendo.livro.id,
        estado: 'lendo',
        perfilId: usuario.id,
      })
      setCompanhia(pessoas)
    } else {
      setCompanhia([])
    }
  }, [usuario])

  useEffect(() => {
    carregar()
  }, [carregar])

  /* O retorno é imediato: o card muda de coluna na hora e a gravação segue
     por baixo. Se o banco recusar, a lista volta ao que era e a mensagem
     explica — RNF-01 sem mentir sobre o resultado. */
  async function mover(item, estado) {
    if (item.estado === estado) return
    setErro(null)
    setMenuAberto(null)

    const anterior = itens
    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, estado } : i)))
    if (aviso.current) aviso.current.textContent = `${item.livro.titulo} agora está em ${ROTULO[estado]}`

    const { erro: falha } = await moveItem({ itemId: item.id, estado })
    if (falha) {
      setItens(anterior)
      setErro(mensagemDeErro(falha))
      return
    }
    carregar()
  }

  if (itens === null) return null

  const porEstado = (estado) => itens.filter((i) => i.estado === estado)
  const lendo = porEstado('lendo')[0] ?? null

  if (itens.length === 0) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="vazio">
            <Marca tamanho={96} titulo="Prosa" />
            <h1 className="vazio__titulo">Sua estante está vazia</h1>
            <p className="vazio__texto">
              Ela junta os livros de todos os seus clubes. Ache um livro e ele entra
              aqui — depois é só arrastar entre futuros, lendo e lidos.
            </p>
            <button
              type="button"
              className="botao botao--principal"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => navegar('/buscar')}
            >
              Achar um livro
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div style={{ padding: '24px 18px 12px' }}>
          <h1 className="entrar__titulo">Sua estante</h1>
          <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            {ESTADOS.map((estado) => (
              <ChipEstado key={estado} estado={estado} contagem={porEstado(estado).length} />
            ))}
          </div>
        </div>

        <div className="corpo" style={{ gap: 16 }}>
          <span ref={aviso} role="status" aria-live="polite" className="campo__ajuda" />

          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          {lendo && (
            <div className="agora" style={{ '--cor-estado': COR.lendo }}>
              <span className="agora__selo">agora</span>
              <span className="coluna__titulo" style={{ '--cor-estado': COR.lendo, marginBottom: 0 }}>
                <FormaEstado estado="lendo" /> {ROTULO.lendo}
              </span>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'flex-start' }}>
                <CardLivro livro={lendo.livro} largura={74} altura={108} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="resultado__titulo" style={{ fontSize: 20 }}>
                    {lendo.livro.titulo}
                  </span>
                  <span className="resultado__autor">
                    {lendo.livro.autores?.length
                      ? lendo.livro.autores.join(', ')
                      : 'autoria não informada'}
                  </span>
                  {frasedeCompanhia(companhia) && (
                    <span className="agora__social">{frasedeCompanhia(companhia)}</span>
                  )}
                  <button
                    type="button"
                    className="botao botao--secundario"
                    style={{ marginTop: 10 }}
                    onClick={() => mover(lendo, 'lido')}
                  >
                    Terminei ✓
                  </button>
                </div>
              </div>
            </div>
          )}

          {ESTADOS.map((estado) => (
            <section
              key={estado}
              onDragOver={(e) => {
                e.preventDefault()
                setAlvo(estado)
              }}
              onDragLeave={() => setAlvo((a) => (a === estado ? null : a))}
              onDrop={(e) => {
                e.preventDefault()
                setAlvo(null)
                if (arrastando) mover(arrastando, estado)
              }}
            >
              <span className="coluna__titulo" style={{ '--cor-estado': COR[estado] }}>
                <FormaEstado estado={estado} /> {ROTULO[estado]} — arraste ou use ⋯ para mover
              </span>

              <div className="coluna__grade">
                {porEstado(estado).map((item) => (
                  <div key={item.id}>
                    <div
                      className={
                        'livro-cartao' + (arrastando?.id === item.id ? ' livro-cartao--arrastando' : '')
                      }
                      draggable
                      onDragStart={() => setArrastando(item)}
                      onDragEnd={() => {
                        setArrastando(null)
                        setAlvo(null)
                      }}
                    >
                      <CardLivro livro={item.livro} largura="100%" altura={132} />
                      <span className="livro-cartao__nome">{item.livro.titulo}</span>
                    </div>

                    {/* O caminho alternativo do RNF-09: tudo que se faz
                        arrastando também se faz por botão e por teclado. */}
                    <button
                      type="button"
                      className="livro-cartao__mover"
                      onClick={() => setMenuAberto(menuAberto === item.id ? null : item.id)}
                      aria-expanded={menuAberto === item.id}
                      aria-label={`Mover ${item.livro.titulo}`}
                    >
                      ⋯
                    </button>

                    {menuAberto === item.id && (
                      <div className="menu-mover" role="group" aria-label={`Mover ${item.livro.titulo} para`}>
                        {ESTADOS.map((destino) => (
                          <ChipEstado
                            key={destino}
                            estado={destino}
                            marcado={destino === item.estado}
                            aoClicar={() => mover(item, destino)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div
                  className={'soltar' + (alvo === estado ? ' soltar--alvo' : '')}
                  style={{ '--cor-estado': COR[estado] }}
                >
                  Solte um livro aqui
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
