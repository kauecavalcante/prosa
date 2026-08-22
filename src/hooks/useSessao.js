import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/* A sessão vale para o app inteiro, mas o guarda de rota precisa distinguir
   "ainda não sei" de "não tem ninguém" — senão um F5 numa rota autenticada
   joga a pessoa para /entrar antes do Supabase ler o armazenamento local. */
export function useSessao() {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSessao(data.session)
      setCarregando(false)
    })

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
      setCarregando(false)
    })

    return () => {
      ativo = false
      inscricao.subscription.unsubscribe()
    }
  }, [])

  return { sessao, usuario: sessao?.user ?? null, carregando }
}
