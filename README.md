# Prosa

**A melhor parte do livro é depois.**

Rede de leitura organizada em clubes. Projeto da disciplina de Interface Humano-Computador (IHC).

---

## O que é

O Prosa transforma a leitura em um ciclo com começo, meio e fim: um clube propõe livros, vota no próximo título, lê junto e conversa na data marcada. Em volta disso existe uma rede — feed, perfis públicos, notas de 0 a 5 e resenhas — que serve para descobrir o que propor no clube.

## O problema

**No clube.** Clubes de leitura informais perdem organização porque a coordenação é dispersa: a escolha do próximo livro vira discussão infinita no grupo de mensagens, não há registro do que já foi lido, ninguém sabe em que ponto os outros estão, e a discussão vira spoiler acidental.

**Fora do clube.** Quem termina um livro não tem para onde levar a impressão. Redes de leitura existentes devolvem catálogo e nota, não conversa.

## O que diferencia do Skoob e do Goodreads

1. **O ciclo é a espinha.** Os concorrentes são catálogos: você registra o que leu, sem prazo e sem par. No Prosa existe um livro do ciclo, uma votação que o escolheu, uma data marcada e uma conversa que abre nela.
2. **O clube é a unidade, não o indivíduo.** Lá, grupo é recurso secundário. Aqui o clube é a tela principal e o feed serve o clube.
3. **Spoiler é problema de design.** Comentário com spoiler nasce oculto e só se revela por ação individual de quem lê.

## Documentação

| Documento | O que tem |
|---|---|
| [Requisitos](docs/requisitos.md) | Visão, personas, 9 épicos, 58 user stories, MVP, requisitos não-funcionais |
| [Manual da marca](docs/prototipos/manual-da-marca.html) | Marca, paleta, tipografia, regras de uso |
| [Telas](docs/prototipos/telas.html) | Primeira versão das telas |
| [Telas ilustradas](docs/prototipos/telas-ilustradas.html) | Versão final, com identidade ilustrada |

Os protótipos são páginas HTML — baixe a pasta `docs/prototipos` inteira e abra o arquivo no navegador, porque eles dependem do `support.js` ao lado.

## Escopo do MVP

32 user stories que fecham um ciclo completo: um clube com pelo menos 3 membros escolhe um livro por votação, lê, conversa na data marcada e publica nota e resenha — e essas notas aparecem no feed de quem segue essas pessoas, sem nenhuma intervenção fora do app.

Acompanhamento em [Projects](../../projects).

## Identidade visual

**Tema claro** — papel `#F1F3F4` · superfície `#FFFFFF` · tinta `#131A1E` · tinta suave `#56656D` · ocre ação `#C4882A` · ocre marca `#8F6412` · traço `#D7DDDF`

**Tema escuro** — noite `#0E1417` · superfície `#172025` · tinta `#E8EDEF` · tinta suave `#96A5AC` · ocre ação `#D19A3A` · ocre marca `#E7B054` · traço `#2A363C`

**Estados de leitura** — Futuros índigo `#4A3FC2` / `#ABA0FF` (círculo vazio) · Lendo verde-água `#0B7268` / `#4FD3BD` (meia-lua) · Lidos framboesa `#B0295F` / `#FF93B6` (disco com traço)

**Regras** — ocre é ação, nunca estado. Estrelas de nota usam framboesa. Se pode ser clicado, é sem serifa.

**Tipografia** — [Newsreader](https://fonts.google.com/specimen/Newsreader) para a voz do produto, [Nunito](https://fonts.google.com/specimen/Nunito) para a interface.

## Stack prevista

- **Frontend:** PWA em React + Vite
- **Dados:** Supabase (Postgres, Auth, Storage)
- **Livros:** Google Books API, com Open Library como fonte alternativa
- **Deploy:** Vercel

## Estado do projeto

Fase de concepção. Requisitos fechados, identidade visual definida, protótipo de telas pronto. O desenvolvimento começa depois dos wireframes no Figma.

## Equipe

- [nome completo]
