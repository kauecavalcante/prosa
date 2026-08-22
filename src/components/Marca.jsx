const TRACADO =
  'M26 10H70A20 20 0 0 1 90 30V52A20 20 0 0 1 70 72H38L20 88L26.5 72H26A20 20 0 0 1 6 52V30A20 20 0 0 1 26 10Z'

const VAZADO =
  'M18 6H46A14 14 0 0 1 60 20V36A14 14 0 0 1 46 50H26L13 61L18.6 50H18A14 14 0 0 1 4 36V20A14 14 0 0 1 18 6ZM30.5 20C27 17.9 22.6 17.3 18 18V36C22.6 35.3 27 35.9 30.5 38V20ZM33.5 20C37 17.9 41.4 17.3 46 18V36C41.4 35.3 37 35.9 33.5 38V20Z'

/* Manual da marca: o balão só tem olhos a partir de 48 px. Abaixo disso a
   versão vazada de uma cor só é a única que continua legível. */
export function Marca({ tamanho = 40, titulo }) {
  const rotulo = titulo
    ? { role: 'img', 'aria-label': titulo }
    : { 'aria-hidden': 'true', focusable: 'false' }

  if (tamanho < 48) {
    return (
      <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} {...rotulo}>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={VAZADO} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 96 96" width={tamanho} height={tamanho} {...rotulo}>
      <path
        d={TRACADO}
        fill="var(--ocre-acao)"
        stroke="var(--tinta)"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <circle cx="37" cy="34" r="9" fill="var(--superficie)" stroke="var(--tinta)" strokeWidth="3" />
      <circle cx="61" cy="34" r="9" fill="var(--superficie)" stroke="var(--tinta)" strokeWidth="3" />
      <circle cx="39.5" cy="35.5" r="3.6" fill="var(--tinta)" />
      <circle cx="63.5" cy="35.5" r="3.6" fill="var(--tinta)" />
      <path
        d="M46 56C41 53 35 52.5 29 53.3V64.6C35 63.9 41 64.4 46 67Z"
        fill="var(--superficie)"
        stroke="var(--tinta)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M50 56C55 53 61 52.5 67 53.3V64.6C61 63.9 55 64.4 50 67Z"
        fill="var(--superficie)"
        stroke="var(--tinta)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
