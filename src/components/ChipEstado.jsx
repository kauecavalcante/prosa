/* RNF-12: nunca só cor. Cada estado carrega cor, forma própria e rótulo em
   texto — as três coisas ao mesmo tempo, para a tela continuar legível em
   preto e branco e para quem não distingue esses tons.

   As formas são as do manual da marca e representam progresso: círculo vazio
   (nada ainda), meia-lua (metade do caminho), disco fechado com traço
   (encerrado). */

export const ESTADOS = ['futuro', 'lendo', 'lido']

export const ROTULO = { futuro: 'Futuros', lendo: 'Lendo', lido: 'Lidos' }

export const COR = {
  futuro: 'var(--estado-futuros)',
  lendo: 'var(--estado-lendo)',
  lido: 'var(--estado-lidos)',
}

export function FormaEstado({ estado, tamanho = 14 }) {
  const comum = {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 14 14',
    'aria-hidden': 'true',
    focusable: 'false',
    style: { display: 'block', flex: 'none' },
  }

  if (estado === 'futuro') {
    return (
      <svg {...comum}>
        <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }

  if (estado === 'lendo') {
    return (
      <svg {...comum}>
        <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M7 1.4A5.6 5.6 0 0 1 7 12.6Z" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg {...comum}>
      <circle cx="7" cy="7" r="6.4" fill="currentColor" />
      <path
        d="M4.2 7.2 6.1 9.1 9.8 5"
        fill="none"
        stroke="var(--superficie)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChipEstado({ estado, contagem, aoClicar, marcado }) {
  const conteudo = (
    <>
      <FormaEstado estado={estado} />
      {ROTULO[estado]}
      {contagem !== undefined && (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{contagem}</span>
      )}
    </>
  )

  if (!aoClicar) {
    return (
      <span className="chip-estado" style={{ '--cor-estado': COR[estado] }}>
        {conteudo}
      </span>
    )
  }

  return (
    <button
      type="button"
      className={'chip-estado chip-estado--acao' + (marcado ? ' chip-estado--marcado' : '')}
      style={{ '--cor-estado': COR[estado] }}
      onClick={aoClicar}
      aria-pressed={marcado}
    >
      {conteudo}
    </button>
  )
}
