import { supabase } from './supabase'

/* O nome digitado no cadastro viaja em user_metadata porque a conta ainda não
   tem sessão enquanto o e-mail não é confirmado — e sem sessão o RLS recusa
   qualquer escrita. Na primeira vez que a pessoa entra de fato, a linha de
   perfil é criada com esse nome. */
export async function garantirPerfil(usuario) {
  if (!usuario) return { erro: null }

  const { data, error: erroLeitura } = await supabase
    .from('perfil')
    .select('id')
    .eq('id', usuario.id)
    .maybeSingle()

  if (erroLeitura) return { erro: erroLeitura }
  if (data) return { erro: null }

  const nome =
    usuario.user_metadata?.nome?.trim() || usuario.email?.split('@')[0] || 'Leitor'

  const { error: erroEscrita } = await supabase
    .from('perfil')
    .insert({ id: usuario.id, nome })

  return { erro: erroEscrita ?? null }
}
