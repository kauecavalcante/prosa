import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscaLivroPorId } from '../lib/buscaLivros'
import { mensagemDeErro } from '../lib/mensagens'
import { CardLivro } from '../components/CardLivro'
import { ChipEstado, ESTADOS } from '../components/ChipEstado'
import { Estrelas } from '../components/Estrelas'
import { Spoiler } from '../components/Spoiler'
import { Retrato } from '../components/Retrato'
import { listaResenhas, minhaNota, salvaNota, salvaResenha } from '../lib/avaliacoes'
import { livrosNaMinhaEstante, moveItem, poeNaEstante } from '../lib/estante'
import { supabase } from '../lib/supabase'
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
  const [naEstante, setNaEstante] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [nota, setNota] = useState(null)
  const [resenhas, setResenhas] = useState([])
  const [textoResenha, setTextoResenha] = useState('')
  const [spoilerResenha, setSpoilerResenha] = useState(false)
  const [escrevendo, setEscrevendo] = useState(false)

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

  const lerEstante = useCallback(async () => {
    const { data: sessao } = await supabase.auth.getSession()
    const perfilId = sessao?.session?.user?.id
    if (!perfilId) return
    const { data } = await supabase
      .from('item_estante')
      .select('id, estado')
      .eq('perfil_id', perfilId)
      .eq('livro_id', id)
      .maybeSingle()
    setNaEstante(data ?? null)
  }, [id])

  const lerAvaliacoes = useCallback(async () => {
    const [{ nota: minha }, { resenhas: lista }] = await Promise.all([
      minhaNota(id),
      listaResenhas(id),
    ])
    setNota(minha)
    setResenhas(lista ?? [])
  }, [id])

  useEffect(() => {
    lerEstante()
    lerAvaliacoes()
  }, [lerEstante, lerAvaliacoes])

  async function aoNotar(valor) {
    setErro(null)
    const { erro: falha } = await salvaNota({ livroId: id, valor })
    if (falha) {
      setErro(mensagemDeErro(falha))
      return
    }
    setNota(valor)
  }

  async function aoResenhar(evento) {
    evento.preventDefault()
    if (!textoResenha.trim()) return
    setErro(null)
    setEscrevendo(true)

    const { erro: falha } = await salvaResenha({
      livroId: id,
      texto: textoResenha,
      spoiler: spoilerResenha,
    })
    if (falha) {
      setErro(mensagemDeErro(falha))
      setEscrevendo(false)
      return
    }
    setTextoResenha('')
    setSpoilerResenha(false)
    setEscrevendo(false)
    lerAvaliacoes()
  }

  /* É por aqui que o livro entra na estante. Sem digitar nada: três botões,
     um por estado — o que a US-28 pede e o caminho alternativo da US-29. */
  async function aoMarcar(estado) {
    setErro(null)
    setSalvando(true)

    const falha = naEstante
      ? (await moveItem({ itemId: naEstante.id, estado })).erro
      : (await poeNaEstante({ livroId: id, estado })).erro

    if (falha) {
      setErro(mensagemDeErro(falha))
      setSalvando(false)
      return
    }
    await lerEstante()
    setSalvando(false)
  }

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
          {erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{erro.texto}</span>
            </div>
          )}

          <span className="rotulo-secao">Na sua estante</span>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {ESTADOS.map((estado) => (
              <ChipEstado
                key={estado}
                estado={estado}
                marcado={naEstante?.estado === estado}
                aoClicar={salvando ? undefined : () => aoMarcar(estado)}
              />
            ))}
          </div>

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

          {/* A nota só aparece para quem marcou o livro como lido: o gatilho
              nota_exige_lido recusaria, e oferecer o que vai ser negado é
              gastar o clique de quem está ali. */}
          {naEstante?.estado === 'lido' ? (
            <div className="caminho" style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Sua nota</span>
              <Estrelas valor={nota ?? 0} aoEscolher={aoNotar} />
              <p className="caminho__texto">
                {nota === null
                  ? 'De 0 a 5. Dá para mudar depois.'
                  : `Você deu ${nota} de 5.`}
              </p>
            </div>
          ) : (
            <div className="caminho" style={{ marginTop: 0 }}>
              <span className="cartao__rotulo">Sua nota</span>
              <p className="caminho__texto">
                A nota abre quando você marcar o livro como lido.
              </p>
            </div>
          )}

          <div className="caminho" style={{ marginTop: 0 }}>
            <span className="cartao__rotulo">Sua resenha</span>
            <form onSubmit={aoResenhar} style={{ display: 'grid', gap: 10 }}>
              <div className="campo__caixa">
                <textarea
                  id="resenha"
                  className="campo__entrada"
                  style={{ height: 92, padding: '12px 15px', resize: 'vertical' }}
                  value={textoResenha}
                  onChange={(e) => setTextoResenha(e.target.value)}
                  placeholder="o que ficou depois de fechar o livro?"
                  aria-label="Sua resenha"
                />
              </div>
              <label className="marcar-spoiler">
                <input
                  type="checkbox"
                  checked={spoilerResenha}
                  onChange={(e) => setSpoilerResenha(e.target.checked)}
                />
                Contém spoiler
              </label>
              <button type="submit" className="botao botao--secundario" disabled={escrevendo}>
                {escrevendo ? 'Salvando…' : 'Publicar resenha'}
              </button>
            </form>
          </div>

          {resenhas.length > 0 && (
            <>
              <span className="rotulo-secao">
                {resenhas.length === 1 ? '1 resenha' : `${resenhas.length} resenhas`}
              </span>
              {resenhas.map((resenha) => (
                <article className="fala" key={resenha.id}>
                  <div className="fala__quem">
                    <Retrato nome={resenha.quem.retrato} tamanho={30} />
                    <span className="fala__nome">{resenha.quem.nome}</span>
                  </div>
                  {resenha.spoiler ? (
                    <Spoiler quem={resenha.quem.nome}>{resenha.texto}</Spoiler>
                  ) : (
                    <p className="fala__texto">{resenha.texto}</p>
                  )}
                </article>
              ))}
            </>
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
