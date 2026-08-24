import { NavLink } from 'react-router-dom'
import { Marca } from './Marca'

/* RNF-12: o item ativo não se distingue só por cor. Ele carrega três sinais —
   fundo próprio com contorno, peso de traço maior no ícone, e aria-current
   para quem navega por leitor de tela. */

function IconeEstante({ ativo }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M4 5h4v14H4zM10 5h4v14h-4zM16.5 5.6l3.4.9-3.2 12.4-3.4-.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth={ativo ? 2.6 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconeBuscar({ ativo }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 1.8} />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 1.8} strokeLinecap="round" />
    </svg>
  )
}

function IconePerfil({ ativo }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 1.8} />
      <path
        d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={ativo ? 2.6 : 1.8}
        strokeLinecap="round"
      />
    </svg>
  )
}

const ITENS = [
  { para: '/', rotulo: 'Feed', icone: (ativo) => <Marca tamanho={ativo ? 22 : 20} /> },
  { para: '/estante', rotulo: 'Estante', icone: (ativo) => <IconeEstante ativo={ativo} /> },
  { para: '/buscar', rotulo: 'Buscar', icone: (ativo) => <IconeBuscar ativo={ativo} /> },
  { para: '/perfil', rotulo: 'Perfil', icone: (ativo) => <IconePerfil ativo={ativo} /> },
]

export function BarraNavegacao() {
  return (
    <nav className="barra" aria-label="Navegação principal">
      {ITENS.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.para === '/'}
          className={({ isActive }) => 'barra__item' + (isActive ? ' barra__item--ativo' : '')}
        >
          {({ isActive }) => (
            <>
              {item.icone(isActive)}
              {item.rotulo}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
