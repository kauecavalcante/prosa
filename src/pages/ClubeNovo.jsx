import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criaClube } from '../lib/clubes'
import { mensagemDeErro } from '../lib/mensagens'
import '../estilos/clube.css'

/* Não há tela de criar clube no protótipo — ver o relato do brief. A forma vem
   da linguagem já estabelecida: mesma folha, mesmos campos, mesmos botões. */
export default function ClubeNovo() {
  const navegar = useNavigate()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  async function aoCriar(evento) {
    evento.preventDefault()
    setErro(null)

    if (!nome.trim()) {
      setErro({ texto: 'Falta o nome do clube. É por ele que a turma vai reconhecer.' })
      return
    }

    setEnviando(true)
    const { clube, erro: falha } = await criaClube({ nome, descricao })

    if (falha) {
      setErro(mensagemDeErro(falha))
      setEnviando(false)
      return
    }
    navegar(`/clube/${clube.id}`, { replace: true })
  }

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="entrar__cabecalho">
          <button
            type="button"
            className="botao botao--voltar"
            onClick={() => navegar(-1)}
            aria-label="Voltar"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
              <path
                d="M15 4 7 12l8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="entrar__titulo">Criar um clube</h1>
        </div>

        <div className="corpo">
          <form className="entrar__formulario-campos" onSubmit={aoCriar} noValidate>
            {erro && (
              <div className="aviso aviso--erro" role="alert">
                <span>{erro.texto}</span>
              </div>
            )}

            <div className="campo">
              <label className="campo__rotulo" htmlFor="nome">
                Nome do clube
              </label>
              <div className="campo__caixa">
                <input
                  id="nome"
                  className="campo__entrada"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>
            </div>

            <div className="campo">
              <label className="campo__rotulo" htmlFor="descricao">
                Descrição
              </label>
              <div className="campo__caixa">
                <input
                  id="descricao"
                  className="campo__entrada"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={200}
                  placeholder="opcional"
                />
              </div>
              <p className="campo__ajuda">
                Uma linha sobre o combinado: com que frequência leem, como conversam.
              </p>
            </div>

            <button type="submit" className="botao botao--principal" disabled={enviando}>
              {enviando && <span className="giro" aria-hidden="true" />}
              {enviando ? 'Criando…' : 'Criar clube'}
            </button>
            <p className="caminho__texto">
              Você entra como quem administra e recebe um código para chamar a turma.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
