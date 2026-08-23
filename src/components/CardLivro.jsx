import { useEffect, useState } from 'react'

/* Capa com lombada. Sem imagem — ou com imagem que não carrega — a própria
   capa mostra o título, que é o substituto pedido pelo critério da US-13. */
export function CardLivro({ livro, largura = 54, altura = 80 }) {
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setFalhou(false)
  }, [livro.capa_url])

  const mostraImagem = livro.capa_url && !falhou

  return (
    <div
      className={'capa' + (mostraImagem ? '' : ' capa--substituta')}
      style={{ width: largura, height: altura }}
    >
      {mostraImagem ? (
        <img
          className="capa__imagem"
          src={livro.capa_url}
          alt=""
          loading="lazy"
          onError={() => setFalhou(true)}
        />
      ) : (
        <>
          <span className="capa__lombada" aria-hidden="true" />
          <span className="capa__titulo">{livro.titulo}</span>
        </>
      )}
    </div>
  )
}
