import { useState } from 'react'

/* O estado revelado NUNCA é gravado. Ele vive neste componente, enquanto a
   tela está aberta, e morre com ela — decisão 3.3 da arquitetura e critério da
   US-38. Não há banco, não há localStorage, não há sessionStorage.

   O motivo é de produto: se fosse persistido, duas pessoas do mesmo clube
   interfeririam na experiência uma da outra, que é exatamente o que a
   funcionalidade existe para evitar. Não guardar o dado é a decisão.

   Quem for mexer aqui: guardar isso em qualquer lugar que sobreviva ao
   fechamento da tela quebra a funcionalidade inteira, por mais que ela
   continue parecendo certa. */
export function Spoiler({ quem, children }) {
  const [aberto, setAberto] = useState(false)

  if (!aberto) {
    return (
      <div className="spoiler spoiler--oculto">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="m4 4 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="spoiler__aviso">{quem} contou algo do meio do livro</span>
        <span className="spoiler__calma">Você escolhe quando ler.</span>
        <button type="button" className="spoiler__mostrar" onClick={() => setAberto(true)}>
          Mostrar pra mim
        </button>
      </div>
    )
  }

  return (
    <div className="spoiler spoiler--aberto">
      <span className="spoiler__rotulo">Spoiler à mostra</span>
      <p className="spoiler__texto">{children}</p>
      <button type="button" className="spoiler__esconder" onClick={() => setAberto(false)}>
        Esconder de novo
      </button>
    </div>
  )
}
