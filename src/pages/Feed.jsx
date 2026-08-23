import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entraPorConvite, listaMeusClubes } from '../lib/clubes'
import { mensagemDeErro } from '../lib/mensagens'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

export default function Feed() {
  const navegar = useNavigate()

  const [clubes, setClubes] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    listaMeusClubes().then(({ clubes: lista, erro: falha }) => {
      if (!ativo) return
      if (falha) setErro(mensagemDeErro(falha))
      setClubes(lista ?? [])
    })
    return () => {
      ativo = false
    }
  }, [])

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

  if (clubes === null) return null

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

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="faixa">
          <div className="faixa__linha">
            <h1 className="faixa__titulo">Seus clubes</h1>
            <button type="button" className="pilula" onClick={() => navegar('/clube/novo')}>
              Criar clube
            </button>
          </div>
        </div>

        <div className="corpo">
          <span className="rotulo-secao">
            {clubes.length === 1 ? '1 clube' : `${clubes.length} clubes`}
          </span>

          {clubes.map((clube) => (
            <button
              key={clube.id}
              type="button"
              className="clube-cartao"
              onClick={() => navegar(`/clube/${clube.id}`)}
            >
              <span className="clube-cartao__nome">{clube.nome}</span>
              {clube.descricao && <p className="clube-cartao__descricao">{clube.descricao}</p>}
              <span className="clube-cartao__rodape">
                <span className="selo">{clube.papel === 'admin' ? 'você administra' : 'membro'}</span>
              </span>
            </button>
          ))}

          {formularioDeCodigo}
        </div>
      </div>
    </main>
  )
}
