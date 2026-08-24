import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entraPorConvite, listaMeusClubes } from '../lib/clubes'
import { mensagemDeErro } from '../lib/mensagens'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

/* O feed em si é o brief seguinte. Aqui a rota guarda o estado vazio, que é o
   primeiro momento real de quem acaba de criar conta, e o lugar reservado para
   quando houver o que mostrar. */
export default function Feed() {
  const navegar = useNavigate()

  const [clubes, setClubes] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    listaMeusClubes().then(({ clubes: lista }) => {
      if (ativo) setClubes(lista ?? [])
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
        <div style={{ padding: '24px 18px 12px' }}>
          <h1 className="entrar__titulo">Feed</h1>
        </div>
        <div className="corpo">
          <div className="caminho" style={{ marginTop: 0 }}>
            <p className="caminho__texto">
              Aqui vai aparecer o que as pessoas que você segue andaram lendo,
              avaliando e resenhando. Seguir gente é o passo seguinte.
            </p>
          </div>
          <span className="rotulo-secao">Enquanto isso</span>
          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => navegar('/perfil')}
          >
            Ver os seus clubes
          </button>
          {formularioDeCodigo}
        </div>
      </div>
    </main>
  )
}
