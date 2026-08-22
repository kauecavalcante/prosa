import { useState } from 'react'
import { MINIMO_DA_SENHA, ROTULO_DA_FORCA, forcaDaSenha } from '../lib/mensagens'

const COR_DA_FORCA = [
  'var(--tinta-suave)',
  'var(--estado-lidos)',
  'var(--estado-futuros)',
  'var(--estado-lendo)',
]

function Confere() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="6" fill="currentColor" />
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

/* A medida da força e o mínimo de 8 valem para o cadastro (US-01) e para a
   senha nova (US-59). Ficam num componente só para não divergirem. */
export function CampoSenha({
  id = 'senha',
  rotulo = 'Senha',
  valor,
  aoMudar,
  autoComplete = 'new-password',
  medirForca = false,
}) {
  const [visivel, setVisivel] = useState(false)

  const forca = forcaDaSenha(valor)
  const forte = medirForca && forca === 3
  const curta = valor.length > 0 && valor.length < MINIMO_DA_SENHA
  const idAjuda = `ajuda-${id}`

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>

      <div className="campo__caixa">
        <input
          id={id}
          className={
            'campo__entrada campo__entrada--com-botao' +
            (forte ? ' campo__entrada--forte' : '')
          }
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete={autoComplete}
          minLength={medirForca ? MINIMO_DA_SENHA : undefined}
          aria-describedby={medirForca ? idAjuda : undefined}
          required
        />
        <button
          type="button"
          className="campo__mostrar"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
        >
          {visivel ? 'ocultar' : 'mostrar'}
        </button>
      </div>

      {medirForca && (
        <>
          <div className="forca" style={{ '--forca-cor': COR_DA_FORCA[forca] }} aria-hidden="true">
            <div className="forca__trilha">
              {[1, 2, 3].map((degrau) => (
                <span
                  key={degrau}
                  className={'forca__degrau' + (forca >= degrau ? ' forca__degrau--cheio' : '')}
                />
              ))}
            </div>
            {valor.length > 0 && (
              <span className={'forca__rotulo' + (forte ? ' forca__rotulo--forte' : '')}>
                {forte && <Confere />}
                {ROTULO_DA_FORCA[forca]}
              </span>
            )}
          </div>

          <p className="campo__ajuda" id={idAjuda} aria-live="polite">
            {valor.length === 0
              ? 'Mínimo 8 caracteres. Nada de "senha123", a gente confia em você.'
              : curta
                ? `Faltam ${MINIMO_DA_SENHA - valor.length} caracteres para chegar aos 8.`
                : forte
                  ? 'Senha boa. Pode seguir.'
                  : `Senha ${ROTULO_DA_FORCA[forca]}. Alongar um pouco, ou misturar números e símbolos, deixa melhor.`}
          </p>
        </>
      )}
    </div>
  )
}
