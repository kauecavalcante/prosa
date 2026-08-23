import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { entraPorConvite } from '../lib/clubes'
import { mensagemDeErro } from '../lib/mensagens'
import { useSessao } from '../hooks/useSessao'
import { Marca } from '../components/Marca'
import '../estilos/clube.css'

export default function Convite() {
  const { codigo } = useParams()
  const navegar = useNavigate()
  const { sessao, carregando: verificandoSessao } = useSessao()

  const [previa, setPrevia] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!sessao) return
    let ativo = true

    supabase.rpc('previa_do_convite', { codigo }).then(({ data, error }) => {
      if (!ativo) return
      if (error) setErro(mensagemDeErro(error))
      else setPrevia(Array.isArray(data) ? data[0] : data)
      setCarregando(false)
    })

    return () => {
      ativo = false
    }
  }, [codigo, sessao])

  if (verificandoSessao) return null

  // O convite é público, mas concluir exige conta — como diz a tabela de rotas.
  if (!sessao) {
    return <Navigate to="/entrar" replace state={{ de: `/convite/${codigo}` }} />
  }

  async function aoEntrar() {
    setErro(null)
    setEntrando(true)
    const { clubeId, erro: falha } = await entraPorConvite(codigo)
    if (falha) {
      setErro(mensagemDeErro(falha))
      setEntrando(false)
      return
    }
    navegar(`/clube/${clubeId}`, { replace: true })
  }

  if (carregando) return null

  return (
    <main className="tela">
      <div className="tela__quadro">
        <div className="vazio">
          <Marca tamanho={96} titulo="Prosa" />

          {previa ? (
            <>
              <span className="rotulo-secao" style={{ marginTop: 14 }}>
                {previa.convidou} te chamou
              </span>
              <h1 className="vazio__titulo" style={{ marginTop: 6 }}>
                {previa.nome}
              </h1>
              {previa.descricao && <p className="vazio__texto">{previa.descricao}</p>}
              <span className="selo" style={{ marginTop: 14 }}>
                {previa.membros === 1 ? '1 pessoa' : `${previa.membros} pessoas`} no clube
              </span>
            </>
          ) : (
            <h1 className="vazio__titulo">Convite</h1>
          )}

          {erro && (
            <div className="aviso aviso--erro" role="alert" style={{ marginTop: 18 }}>
              <span>{erro.texto}</span>
              {erro.acao === 'ir-ao-clube' && (
                <button type="button" className="aviso__acao" onClick={() => navegar('/')}>
                  Ver os seus clubes
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          {previa && (
            <button
              type="button"
              className="botao botao--principal"
              onClick={aoEntrar}
              disabled={entrando}
            >
              {entrando && <span className="giro" aria-hidden="true" />}
              {entrando ? 'Entrando…' : 'Entrar no clube'}
            </button>
          )}
          <button type="button" className="botao botao--secundario" onClick={() => navegar('/')}>
            {previa ? 'Depois' : 'Ver os seus clubes'}
          </button>
        </div>
      </div>
    </main>
  )
}
