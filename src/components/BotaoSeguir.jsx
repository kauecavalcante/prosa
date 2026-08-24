import { useEffect, useState } from 'react'
import { deixarDeSeguir, euSigo, seguir } from '../lib/rede'
import { mensagemDeErro } from '../lib/mensagens'

/* Os dois estados diferem em preenchimento e em relevo, não só em texto:
   "Seguir" é branco com base sólida, "Seguindo" é chapado e creme. Cor não
   decide sozinha — RNF-12. */
export function BotaoSeguir({ perfilId, aoMudar }) {
  const [segue, setSegue] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    euSigo(perfilId).then(({ segue: resposta }) => {
      if (ativo) setSegue(resposta)
    })
    return () => {
      ativo = false
    }
  }, [perfilId])

  if (segue === null) return null

  async function alternar() {
    setErro(null)
    setOcupado(true)
    const anterior = segue
    setSegue(!anterior)

    const { erro: falha } = anterior
      ? await deixarDeSeguir(perfilId)
      : await seguir(perfilId)

    if (falha) {
      setSegue(anterior)
      setErro(mensagemDeErro(falha))
      setOcupado(false)
      return
    }
    setOcupado(false)
    aoMudar?.(!anterior)
  }

  return (
    <>
      <button
        type="button"
        className={'seguir' + (segue ? ' seguir--seguindo' : '')}
        onClick={alternar}
        disabled={ocupado}
        aria-pressed={segue}
      >
        {segue ? 'Seguindo' : 'Seguir'}
      </button>
      {erro && (
        <span role="alert" className="campo__ajuda" style={{ color: 'var(--estado-lidos)' }}>
          {erro.texto}
        </span>
      )}
    </>
  )
}
