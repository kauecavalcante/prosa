/* Os cinco retratos são os desenhos da galeria da tela L2 do protótipo,
   copiados traço a traço. Desenhar retrato novo é tarefa de identidade
   visual — ver a nota da US-03 em requisitos.md.

   As cores são fixas de propósito: o retrato é uma ilustração fechada, com
   fundo claro nos dois temas, então o traço escuro continua certo no escuro. */

const DESENHOS = {
  'retrato-01': (
    <>
      <circle cx="22" cy="22" r="20" fill="#D9D6FA" stroke="#131A1E" strokeWidth="2"/>
      <circle cx="22" cy="19" r="8" fill="#A9714A"/>
      <path d="M14 18a8 8 0 0 1 16 0c0-6-2.6-8.5-8-8.5S14 12 14 18Z" fill="#20161C"/>
      <path d="M22 29c6.5 0 10 3.6 10 8H12c0-4.4 3.5-8 10-8Z" fill="#0B7268"/>
      <circle cx="19.2" cy="19.5" r="1.1" fill="#131A1E"/>
      <circle cx="24.8" cy="19.5" r="1.1" fill="#131A1E"/>
    </>
  ),
  'retrato-02': (
    <>
      <circle cx="22" cy="22" r="20" fill="#FBD3E1" stroke="#131A1E" strokeWidth="2"/>
      <circle cx="22" cy="19" r="8" fill="#E8B98F"/>
      <path d="M13 20c0-8 4-11 9-11s9 3 9 11c0-3-1.5-4-2.5-4.5-1.5 3-11.5 3-13 0C14.5 16 13 17 13 20Z" fill="#6B3B1E"/>
      <path d="M22 29c6.5 0 10 3.6 10 8H12c0-4.4 3.5-8 10-8Z" fill="#B0295F"/>
      <circle cx="19.2" cy="19.5" r="1.1" fill="#131A1E"/>
      <circle cx="24.8" cy="19.5" r="1.1" fill="#131A1E"/>
    </>
  ),
  'retrato-03': (
    <>
      <circle cx="22" cy="22" r="20" fill="#BFEDE4" stroke="#131A1E" strokeWidth="2"/>
      <circle cx="22" cy="19" r="8" fill="#6E4326"/>
      <path d="M13 18c0-7 4-10 9-10s9 3 9 10c-1-2-3-3-4-2s-3 1-5 0-4-1-5 0-3 0-4 2Z" fill="#17110E"/>
      <path d="M22 29c6.5 0 10 3.6 10 8H12c0-4.4 3.5-8 10-8Z" fill="#4A3FC2"/>
      <circle cx="19.2" cy="19.5" r="1.1" fill="#F4F7F8"/>
      <circle cx="24.8" cy="19.5" r="1.1" fill="#F4F7F8"/>
    </>
  ),
  'retrato-04': (
    <>
      <circle cx="22" cy="22" r="20" fill="#FCE3B4" stroke="#131A1E" strokeWidth="2"/>
      <circle cx="22" cy="19" r="8" fill="#F0C79E"/>
      <path d="M14 19c0-7 3.6-10 8-10s8 3 8 10c0-4-2-5-4-5s-3 1-6 1-4 1-6 4Z" fill="#8C4A22"/>
      <circle cx="27" cy="10" r="4" fill="#8C4A22" stroke="#131A1E" strokeWidth="1.6"/>
      <path d="M22 29c6.5 0 10 3.6 10 8H12c0-4.4 3.5-8 10-8Z" fill="#C4882A"/>
      <circle cx="19.2" cy="19.5" r="1.1" fill="#131A1E"/>
      <circle cx="24.8" cy="19.5" r="1.1" fill="#131A1E"/>
    </>
  ),
  'retrato-05': (
    <>
      <circle cx="22" cy="22" r="20" fill="#D9D6FA" stroke="#131A1E" strokeWidth="2"/>
      <circle cx="22" cy="19" r="8" fill="#C68A5E"/>
      <path d="M14 18a8 8 0 0 1 16 0c0-6-2.6-8.5-8-8.5S14 12 14 18Z" fill="#2A1C12"/>
      <path d="M22 29c6.5 0 10 3.6 10 8H12c0-4.4 3.5-8 10-8Z" fill="#4A3FC2"/>
      <circle cx="19.2" cy="19.5" r="1.1" fill="#131A1E"/>
      <circle cx="24.8" cy="19.5" r="1.1" fill="#131A1E"/>
    </>
  ),
}

export const NOMES_DE_RETRATO = Object.keys(DESENHOS)
export const RETRATO_PADRAO = 'retrato-01'

export function Retrato({ nome, tamanho = 54, titulo }) {
  const desenho = DESENHOS[nome] ?? DESENHOS[RETRATO_PADRAO]
  const rotulo = titulo
    ? { role: 'img', 'aria-label': titulo }
    : { 'aria-hidden': 'true', focusable: 'false' }

  return (
    <svg viewBox="0 0 44 44" width={tamanho} height={tamanho} {...rotulo}>
      {desenho}
    </svg>
  )
}
