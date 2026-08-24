import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { acervoDoPerfil, buscaPerfil, salvaNome } from '../lib/perfil'
import { listaMeusClubes } from '../lib/clubes'
import { mensagemDeErro } from '../lib/mensagens'
import { useSessao } from '../hooks/useSessao'
import { Retrato } from '../components/Retrato'
import { CardLivro } from '../components/CardLivro'
import { Estrelas } from '../components/Estrelas'
import { Spoiler } from '../components/Spoiler'
import { ChipEstado } from '../components/ChipEstado'
import '../estilos/clube.css'

export default function Perfil() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useSessao()

  const alvo = id ?? usuario?.id ?? null
  const souEu = Boolean(alvo && usuario && alvo === usuario.id)

  const [perfil, setPerfil] = useState(null)
  const [acervo, setAcervo] = useState(null)
  const [clubes, setClubes] = useState([])
  const [aba, setAba] = useState('lidos')
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!alvo) return
    const { perfil: achado } = await buscaPerfil(alvo)
    setPerfil(achado)
    setNome(achado?.nome ?? '')
    setAcervo(await acervoDoPerfil(alvo))
    if (souEu) {
      const { clubes: lista } = await listaMeusClubes()
      setClubes(lista ?? [])
    }
  }, [alvo, souEu])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aoSalvarNome(evento) {
    evento.preventDefault()
    if (!nome.trim()) {
      setErro({ texto: 'O nome não pode ficar vazio. É por ele que o clube te reconhece.' })
      return
    }
    setErro(null)
    setSalvando(true)

    const { erro: falha } = await salvaNome(nome)
    if (falha) {
      setErro(mensagemDeErro(falha))
      setSalvando(false)
      return
    }
    setSalvando(false)
    setEditando(false)
    carregar()
  }

  async function aoSair() {
    await supabase.auth.signOut()
    // replace: sair não pode deixar a tela autenticada no histórico.
    navegar('/entrar', { replace: true })
  }

  if (!perfil || !acervo) return null

  const abas = [
    { chave: 'lidos', rotulo: 'Lidos', itens: acervo.lidos },
    { chave: 'futuros', rotulo: 'Futuros', itens: acervo.futuros },
    { chave: 'resenhas', rotulo: 'Resenhas', itens: acervo.resenhas },
  ]
  const atual = abas.find((a) => a.chave === aba)

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Retrato nome={perfil.retrato} tamanho={64} titulo={`Retrato de ${perfil.nome}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="faixa__titulo" style={{ fontSize: 28 }}>
                {perfil.nome}
              </h1>
              {souEu && !editando && (
                <button
                  type="button"
                  className="botao botao--texto"
                  onClick={() => setEditando(true)}
                >
                  Editar o nome
                </button>
              )}
            </div>
          </div>

          {souEu && editando && (
            <form onSubmit={aoSalvarNome} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <div className="campo__caixa">
                <input
                  id="nome"
                  className="campo__entrada"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={60}
                  aria-label="Seu nome"
                />
              </div>
              <button type="submit" className="botao botao--secundario" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                className="botao botao--texto"
                onClick={() => {
                  setNome(perfil.nome)
                  setEditando(false)
                }}
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        <div className="corpo">
          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {abas.map((a) => (
              <button
                key={a.chave}
                type="button"
                className={'chip-estado chip-estado--acao' + (aba === a.chave ? ' chip-estado--marcado' : '')}
                style={{ '--cor-estado': 'var(--tinta)' }}
                onClick={() => setAba(a.chave)}
                aria-pressed={aba === a.chave}
              >
                {a.rotulo}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{a.itens.length}</span>
              </button>
            ))}
          </div>

          {souEu && (
            <p className="caminho__texto">
              Sua lista de futuros é pública: quem tem conta no Prosa vê o que você quer
              ler. Escolher o que fica visível chega mais adiante.
            </p>
          )}

          {atual.itens.length === 0 ? (
            <div className="caminho" style={{ marginTop: 0 }}>
              <p className="caminho__texto">
                {souEu
                  ? `Nada em ${atual.rotulo.toLowerCase()} ainda.`
                  : `Nada em ${atual.rotulo.toLowerCase()} por aqui.`}
              </p>
            </div>
          ) : aba === 'resenhas' ? (
            atual.itens.map((resenha) => (
              <article className="fala" key={resenha.id}>
                <div className="fala__quem">
                  <CardLivro livro={resenha.livro} largura={34} altura={50} />
                  <span className="fala__nome">{resenha.livro.titulo}</span>
                </div>
                {resenha.spoiler ? (
                  <Spoiler quem={perfil.nome}>{resenha.texto}</Spoiler>
                ) : (
                  <p className="fala__texto">{resenha.texto}</p>
                )}
              </article>
            ))
          ) : (
            <div className="coluna__grade">
              {atual.itens.map((item) => (
                <button
                  key={item.livro.id}
                  type="button"
                  className="livro-cartao"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navegar(`/livro/${item.livro.id}`)}
                >
                  <CardLivro livro={item.livro} largura="100%" altura={132} />
                  <span className="livro-cartao__nome">{item.livro.titulo}</span>
                  {acervo.notaPorLivro[item.livro.id] !== undefined && (
                    <Estrelas valor={acervo.notaPorLivro[item.livro.id]} rotulo="Nota" />
                  )}
                </button>
              ))}
            </div>
          )}

          {souEu && (
            <>
              <span className="rotulo-secao">Seus clubes</span>
              {clubes.length === 0 ? (
                <div className="caminho" style={{ marginTop: 0 }}>
                  <p className="caminho__texto">
                    Você ainda não está em nenhum clube.
                  </p>
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => navegar('/clube/novo')}
                  >
                    Criar um clube
                  </button>
                </div>
              ) : (
                clubes.map((clube) => (
                  <button
                    key={clube.id}
                    type="button"
                    className="clube-cartao"
                    onClick={() => navegar(`/clube/${clube.id}`)}
                  >
                    <span className="clube-cartao__nome">{clube.nome}</span>
                    {clube.descricao && (
                      <p className="clube-cartao__descricao">{clube.descricao}</p>
                    )}
                    <span className="clube-cartao__rodape">
                      <span className="selo">
                        {clube.papel === 'admin' ? 'você administra' : 'membro'}
                      </span>
                    </span>
                  </button>
                ))
              )}

              <span className="rotulo-secao">Conta</span>
              <button type="button" className="botao botao--secundario" onClick={aoSair}>
                Sair da conta
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
