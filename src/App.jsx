import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSessao } from './hooks/useSessao'
import Entrar from './pages/Entrar'
import NovaSenha from './pages/NovaSenha'
import ClubeNovo from './pages/ClubeNovo'
import Convite from './pages/Convite'
import Feed from './pages/Feed'
import Estante from './pages/Estante'
import Buscar from './pages/Buscar'
import Livro from './pages/Livro'
import Clube from './pages/Clube'
import Votacao from './pages/Votacao'
import Conversa from './pages/Conversa'
import Perfil from './pages/Perfil'

function Autenticada({ children }) {
  const { sessao, carregando } = useSessao()
  const local = useLocation()

  // Sem esta espera, recarregar uma rota autenticada expulsa a pessoa antes de
  // o Supabase terminar de ler a sessão guardada.
  if (carregando) return null

  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/nova-senha" element={<NovaSenha />} />
        <Route path="/convite/:codigo" element={<Convite />} />

        <Route path="/" element={<Autenticada><Feed /></Autenticada>} />
        <Route path="/estante" element={<Autenticada><Estante /></Autenticada>} />
        <Route path="/buscar" element={<Autenticada><Buscar /></Autenticada>} />
        <Route path="/livro/:id" element={<Autenticada><Livro /></Autenticada>} />
        <Route path="/clube/novo" element={<Autenticada><ClubeNovo /></Autenticada>} />
        <Route path="/clube/:id" element={<Autenticada><Clube /></Autenticada>} />
        <Route path="/clube/:id/votacao" element={<Autenticada><Votacao /></Autenticada>} />
        <Route
          path="/clube/:id/livro/:livroId"
          element={<Autenticada><Conversa /></Autenticada>}
        />
        <Route path="/perfil/:id" element={<Autenticada><Perfil /></Autenticada>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
