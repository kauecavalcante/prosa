import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entraPorConvite, listaMeusClubes } from '../lib/clubes'
import { detalhesDoFeed, feedDeQuemSigo } from '../lib/rede'
import { mensagemDeErro } from '../lib/mensagens'
import { CardLivro } from '../components/CardLivro'
import { Retrato } from '../components/Retrato'
import { Estrelas } from '../components/Estrelas'
import { Spoiler } from '../components/Spoiler'
import { BotaoSeguir } from '../components/BotaoSeguir'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

const O_QUE_FEZ = {
  avaliou: 'terminou um livro',
  resenhou: 'escreveu uma resenha',
  quer_ler: 'botou na lista de futuros',
}

function quando(iso) {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (horas < 1) return 'agora há pouco'
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

export default function Feed() {
  const navegar = useNavigate()

  const [clubes, setClubes] = useState(null)
  const [itens, setItens] = useState(null)
  const [seguindo, setSeguindo] = useState(0)
  const [extras, setExtras] = useState({ notas: {}, resenhas: {} })
  const [codigo, setCodigo] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    const [{ clubes: meus }, { itens: lista, seguindo: quantos }] = await Promise.all([
      listaMeusClubes(),
      feedDeQuemSigo(),
    ])
    setClubes(meus ?? [])
    setItens(lista)
    setSeguindo(quantos)
    if (lista.length) setExtras(await detalhesDoFeed(lista))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aoEntrarPorCodigo(evento) {
    evento.preventDefault()
    setErro(null)
    setEntrando(true)

    const { clubeId, erro: falha } = await entraPorConvite(codigo)
    if (falha) {
      setErro(mensagemDeErro(falha))
      setEntrando(false)
      return
    }
    navegar(`/clube/${clubeId}`)
  }

  const formularioDeCodigo = (
    <form className="caminho" onSubmit={aoEntrarPorCodigo}>
      <span className="cartao__rotulo">Recebeu um convite?</span>
      <p className="caminho__texto">
        Clube é fechado: só entra quem foi chamado. Cole o código que te mandaram.
      </p>
      {erro && (
        <div className="aviso aviso--erro" role="alert">
          <span>{erro.texto}</span>
        </div>
      )}
      {/* O marcador mostra o formato — doze caracteres — sem poder ser um código
          de verdade: os códigos são hexadecimais, e x não é hexadecimal. */}
      <div className="campo__caixa">
        <input
          id="codigo"
          className="campo__entrada"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="xxxxxxxxxxxx"
          aria-label="Código do convite"
          required
        />
      </div>
      <button type="submit" className="botao botao--secundario" disabled={entrando}>
        {entrando && <span className="giro" aria-hidden="true" />}
        {entrando ? 'Entrando…' : 'Entrar com o convite'}
      </button>
    </form>
  )

  if (clubes === null || itens === null) return null

  /* Duas situações diferentes, e tratá-las igual seria errado: quem não tem
     clube precisa de um clube; quem já tem precisa de gente para seguir, e a
     gente está no clube dela. */
  if (clubes.length === 0) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div className="vazio">
            <Marca tamanho={104} titulo="Prosa" />
            <h1 className="vazio__titulo">Seu Prosa começa num clube</h1>
            <p className="vazio__texto">
              É no clube que se propõe livro, se vota no próximo e se conversa sem
              estragar o final de ninguém.
            </p>
            <button
              type="button"
              className="botao botao--principal"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => navegar('/clube/novo')}
            >
              Criar um clube
            </button>
            <p className="caminho__texto" style={{ textAlign: 'center' }}>
              Você vira quem administra e chama a turma por um código.
            </p>
            {formularioDeCodigo}
          </div>
        </div>
      </main>
    )
  }

  if (itens.length === 0) {
    return (
      <main className="tela">
        <div className="tela__quadro">
          <div style={{ padding: '24px 18px 12px' }}>
            <h1 className="entrar__titulo">Feed</h1>
          </div>
          <div className="corpo">
            <div className="vazio" style={{ paddingTop: 12 }}>
              <Marca tamanho={88} titulo="Prosa" />
              <h2 className="vazio__titulo" style={{ fontSize: 25 }}>
                {seguindo === 0 ? 'Seu feed começa em quem você segue' : 'Nada por aqui ainda'}
              </h2>
              <p className="vazio__texto">
                {seguindo === 0
                  ? 'A turma do seu clube é o lugar mais fácil de começar: abra o clube, toque num nome e siga.'
                  : 'Quem você segue ainda não avaliou nem resenhou nada. Assim que alguém fechar um livro, aparece aqui.'}
              </p>
            </div>

            <span className="rotulo-secao">Seus clubes</span>
            {clubes.map((clube) => (
              <button
                key={clube.id}
                type="button"
                className="clube-cartao"
                onClick={() => navegar(`/clube/${clube.id}`)}
              >
                <span className="clube-cartao__nome">{clube.nome}</span>
                <span className="clube-cartao__rodape">
                  <span className="selo">ver quem está no clube</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div style={{ padding: '24px 18px 12px' }}>
          <h1 className="entrar__titulo">Feed</h1>
        </div>

        <div className="corpo">
          {itens.map((item) => {
            const chave = `${item.quem.id}:${item.livro.id}`
            const nota = extras.notas[chave]
            const resenha = extras.resenhas[chave]
            return (
              <article className="item-feed" key={item.id}>
                <div className="item-feed__topo">
                  <Retrato nome={item.quem.retrato} tamanho={40} />
                  {/* O alvo é o bloco inteiro, e não só o nome: uma linha de
                      texto de 18px não chega aos 44px do RNF-11. */}
                  <button
                    type="button"
                    className="item-feed__quem"
                    onClick={() => navegar(`/perfil/${item.quem.id}`)}
                    aria-label={`Ver o perfil de ${item.quem.nome}`}
                  >
                    <span className="item-feed__nome">{item.quem.nome}</span>
                    <span className="item-feed__fez">
                      {O_QUE_FEZ[item.tipo]}
                      {item.clube?.nome && ` no ${item.clube.nome}`} · {quando(item.criado_em)}
                    </span>
                  </button>
                  <BotaoSeguir perfilId={item.quem.id} aoMudar={carregar} />
                </div>

                <button
                  type="button"
                  className="item-feed__livro"
                  style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => navegar(`/livro/${item.livro.id}`)}
                >
                  <CardLivro livro={item.livro} largura={48} altura={70} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="resultado__titulo" style={{ fontSize: 18 }}>
                      {item.livro.titulo}
                    </span>
                    <span className="resultado__autor">
                      {item.livro.autores?.length
                        ? item.livro.autores.join(', ')
                        : 'autoria não informada'}
                    </span>
                    {nota !== undefined && (
                      <span style={{ display: 'block', marginTop: 6 }}>
                        <Estrelas valor={nota} rotulo={`Nota de ${item.quem.nome}`} />
                      </span>
                    )}
                  </span>
                </button>

                {item.tipo === 'resenhou' && resenha && (
                  <div style={{ marginTop: 12 }}>
                    {resenha.spoiler ? (
                      <Spoiler quem={item.quem.nome}>{resenha.texto}</Spoiler>
                    ) : (
                      <p className="fala__texto">{resenha.texto}</p>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
