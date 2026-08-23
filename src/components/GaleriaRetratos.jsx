import { NOMES_DE_RETRATO, Retrato } from './Retrato'

const APELIDO = {
  'retrato-01': 'cabelo curto escuro, camisa verde-água',
  'retrato-02': 'franja castanha, camisa framboesa',
  'retrato-03': 'cabelo crespo escuro, camisa índigo',
  'retrato-04': 'coque castanho, camisa ocre',
  'retrato-05': 'cabelo curto castanho, camisa índigo',
}

function Confere() {
  return (
    <svg className="retratos__selo" viewBox="0 0 14 14" width="18" height="18" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="var(--estado-lendo)" stroke="var(--contorno)" strokeWidth="1.4" />
      <path
        d="M4.3 7.2 6.1 9 9.7 5.2"
        fill="none"
        stroke="var(--superficie)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* RNF-12: a escolha não pode ser só cor. Ela aparece em três sinais — anel
   grosso em volta, selo de confirmação e o nome do retrato escrito embaixo —
   e o estado vai no aria-checked para quem navega por leitor de tela. */
export function GaleriaRetratos({ escolhido, aoEscolher }) {
  return (
    <div className="cartao">
      <span className="cartao__rotulo" id="rotulo-retratos">
        Escolha seu retrato
      </span>

      <div className="retratos" role="radiogroup" aria-labelledby="rotulo-retratos">
        {NOMES_DE_RETRATO.map((nome) => {
          const marcado = nome === escolhido
          return (
            <button
              key={nome}
              type="button"
              role="radio"
              aria-checked={marcado}
              className={'retratos__vaga' + (marcado ? ' retratos__vaga--escolhido' : '')}
              onClick={() => aoEscolher(nome)}
            >
              <Retrato nome={nome} tamanho={54} titulo={APELIDO[nome]} />
              {marcado && <Confere />}
            </button>
          )
        })}
      </div>

      <p className="retratos__nota" aria-live="polite">
        {escolhido ? APELIDO[escolhido] : 'Nenhum escolhido ainda.'}
      </p>
    </div>
  )
}
