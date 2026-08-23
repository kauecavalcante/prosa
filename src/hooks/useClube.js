import { useCallback, useEffect, useState } from 'react'
import { buscaClube, listaMembros } from '../lib/clubes'

export function useClube(id) {
  const [clube, setClube] = useState(null)
  const [membros, setMembros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)

    const { clube: achado, erro: erroDoClube } = await buscaClube(id)
    if (erroDoClube) {
      setErro(erroDoClube)
      setClube(null)
      setCarregando(false)
      return
    }

    const { membros: lista } = await listaMembros(id)
    setClube(achado)
    setMembros(lista ?? [])
    setErro(null)
    setCarregando(false)
  }, [id])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { clube, membros, carregando, erro, recarregar }
}
