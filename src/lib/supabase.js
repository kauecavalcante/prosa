import { createClient } from '@supabase/supabase-js'
import { observaRecuperacao } from './recuperacao'

const url = import.meta.env.VITE_SUPABASE_URL
const chaveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chaveAnonima) {
  throw new Error(
    'Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Copie o .env.example para .env e preencha.'
  )
}

// Cliente único do aplicativo. Criar mais de um faz o Supabase abrir vários
// canais de auth e a sessão passa a se sobrescrever entre eles.
export const supabase = createClient(url, chaveAnonima, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Registrada aqui, na mesma linha de execução em que o cliente nasce, para a
// assinatura existir antes de qualquer retorno de rede — e sem depender de
// ordem de importação, que o empacotador reordena sem avisar.
observaRecuperacao(supabase)
