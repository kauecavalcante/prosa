import { createClient } from '@supabase/supabase-js'

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
