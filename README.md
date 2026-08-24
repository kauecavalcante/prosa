# Prosa

**A melhor parte do livro é depois.**

**O aplicativo está no ar em https://prosa-five.vercel.app**

Rede de leitura organizada em clubes. Projeto da disciplina de Interface Humano-Computador (IHC).

---

## O que é

O Prosa transforma a leitura em um ciclo com começo, meio e fim: um clube propõe livros, vota no próximo título, lê dentro de um prazo combinado e conversa sobre o livro sem ninguém tomar spoiler. Em volta disso existe uma rede — feed, perfis públicos, notas de 0 a 5 e resenhas — que serve para descobrir o que propor no clube.

## O problema

**No clube.** Clubes de leitura informais perdem organização porque a coordenação é dispersa: a escolha do próximo livro vira discussão infinita no grupo de mensagens, não há registro do que já foi lido, ninguém sabe em que ponto os outros estão, e a discussão vira spoiler acidental.

**Fora do clube.** Quem termina um livro não tem para onde levar a impressão. Redes de leitura existentes devolvem catálogo e nota, não conversa.

## O que diferencia do Skoob e do Goodreads

1. **O spoiler é resolvido na interface, e é isso que liberta a conversa.** Comentário com spoiler nasce oculto e só se revela por ação individual de quem lê. Sem esse tratamento, um clube precisaria travar a discussão até uma data combinada para proteger quem está atrasado. Com ele, a trava é desnecessária: cada pessoa fala quando quer e lê quando está pronta.
2. **O ciclo é a espinha.** Os concorrentes são catálogos: você registra o que leu, sem prazo e sem par. No Prosa existe um livro do ciclo, uma votação que o escolheu e um prazo que o grupo combinou.
3. **O clube é a unidade, não o indivíduo.** Lá, grupo é recurso secundário. Aqui o clube é a tela principal e o feed serve o clube.

## Documentação

| Documento | O que tem |
|---|---|
| [Requisitos](docs/requisitos.md) | Visão, personas, 9 épicos, 58 user stories, MVP, requisitos não-funcionais |
| [Arquitetura](docs/arquitetura.md) | Modelo de dados, decisões técnicas, estrutura do app, segurança |
| [Esquema do banco](docs/schema.sql) | SQL executável no Supabase, validado em PostgreSQL 17 |
| [Manual da marca](docs/prototipos/manual-da-marca.html) | Marca, paleta, tipografia, regras de uso |
| [Telas](docs/prototipos/telas.html) | Primeira versão das telas |
| [Telas ilustradas](docs/prototipos/telas-ilustradas.html) | Versão final, com identidade ilustrada |

Os protótipos são páginas HTML — baixe a pasta `docs/prototipos` inteira e abra o arquivo no navegador, porque eles dependem do `support.js` ao lado.

## Escopo do MVP

32 user stories que fecham um ciclo completo: um clube com pelo menos 3 membros escolhe um livro por votação, lê dentro do prazo combinado, conversa sobre ele sem expor spoiler a quem está atrasado e publica nota e resenha — e essas notas aparecem no feed de quem segue essas pessoas, sem nenhuma intervenção fora do app.

Acompanhamento em [Projects](../../projects).

## Identidade visual

**Tema claro** — papel `#F1F3F4` · superfície `#FFFFFF` · tinta `#131A1E` · tinta suave `#56656D` · ocre ação `#C4882A` · ocre marca `#8F6412` · traço `#D7DDDF`

**Tema escuro** — noite `#0E1417` · superfície `#172025` · tinta `#E8EDEF` · tinta suave `#96A5AC` · ocre ação `#D19A3A` · ocre marca `#E7B054` · traço `#2A363C`

**Estados de leitura** — Futuros índigo `#4A3FC2` / `#ABA0FF` (círculo vazio) · Lendo verde-água `#0B7268` / `#4FD3BD` (meia-lua) · Lidos framboesa `#B0295F` / `#FF93B6` (disco com traço)

**Regras** — ocre é ação, nunca estado. Estrelas de nota usam framboesa. Se pode ser clicado, é sem serifa.

**Tipografia** — [Newsreader](https://fonts.google.com/specimen/Newsreader) para a voz do produto, [Nunito](https://fonts.google.com/specimen/Nunito) para a interface.

## Stack

- **Frontend:** PWA em React + Vite
- **Dados:** Supabase (Postgres, Auth, Storage)
- **Livros:** Google Books API, com Open Library como fonte alternativa
- **Deploy:** Vercel

## Como rodar

```
npm install
cp .env.example .env   # preencha com a URL e a chave anônima do projeto Supabase
npm run dev
```

As chaves ficam só no `.env`, que está no `.gitignore`. Use sempre a chave anônima —
a `service_role` ignora as políticas de RLS e não pode chegar ao navegador.

## Estado do projeto

Requisitos fechados, identidade visual definida e esquema do banco aplicado. Em
desenvolvimento: o projeto base, os tokens da marca, as rotas e a tela de entrar
(US-01 e US-02) estão de pé; as demais telas ainda são espaços reservados.

## Equipe

- Kaue Cavalcante Wanderley de Melo
