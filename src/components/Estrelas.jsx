/* Framboesa, nunca ocre. Framboesa é a cor de "Lido", e nota é coisa de livro
   terminado — a cor amarra a avaliação ao estado que a permite. Ocre é ação:
   estrela ocre competiria com os botões da mesma tela. */

function Estrela({ cheia }) {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      <path
        d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
        fill={cheia ? 'var(--estado-lidos)' : 'none'}
        stroke="var(--estado-lidos)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Estrelas({ valor = 0, aoEscolher, rotulo = 'Sua nota' }) {
  if (!aoEscolher) {
    return (
      <span
        className="estrelas"
        role="img"
        aria-label={`${rotulo}: ${valor} de 5`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Estrela key={n} cheia={n <= valor} />
        ))}
      </span>
    )
  }

  return (
    <span className="estrelas" role="radiogroup" aria-label={rotulo}>
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === valor}
          aria-label={n === 0 ? 'Zero — não gostei' : `${n} de 5`}
          className={'estrelas__alvo' + (n === 0 ? ' estrelas__alvo--zero' : '')}
          onClick={() => aoEscolher(n)}
        >
          {n === 0 ? '0' : <Estrela cheia={n <= valor} />}
        </button>
      ))}
    </span>
  )
}
