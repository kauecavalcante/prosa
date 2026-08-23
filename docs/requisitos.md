# Prosa — Documento de Requisitos

**Disciplina:** Interface Humano-Computador (IHC)
**Equipe:** Kaue Cavalcante Wanderley de Melo
**Versão:** 2.1 — rede de leitura assumida, conversa sem trava de data

---

## O que mudou da v1 para a v2

O protótipo revelou um produto maior do que o documento original previa. A v1 descrevia um app fechado de coordenação de clube; o protótipo trouxe feed, perfis públicos, seguidores, notas de 0 a 5 e resenhas. Esta versão assume essa direção.

| Item | v1 | v2 |
|---|---|---|
| Posicionamento | Rede fechada, oposta a Skoob/Goodreads | Rede de leitura organizada por ciclo de clube |
| Rede social | Explicitamente fora de escopo | Épico E9, dentro do MVP |
| Nota e resenha | Fase 2 | MVP — alimentam o feed |
| Discussão com spoiler | Fase 2 | MVP — é o diferencial mais visível |
| Conversa do clube | Travada até a data combinada | Aberta o tempo todo — ver nota em E6 |
| Nome | Estante Compartilhada | Prosa |
| Stories no MVP | 24 | 32 |

---

## 1. Visão do produto

> Para **pessoas que leem melhor acompanhadas**,
> que **querem discutir livros com gente de verdade e não só registrar o que leram**,
> o **Prosa** é uma **rede de leitura organizada em clubes**
> que **transforma a leitura em um ciclo com começo, meio e fim: propor, votar, ler junto e conversar sem medo de spoiler**.
> Diferente de **Skoob e Goodreads**, que organizam a leitura como catálogo pessoal infinito,
> o Prosa organiza a leitura como **evento coletivo com prazo** — e trata spoiler como problema de interface, não como falta de educação.

### A resposta para "e o Skoob?"

A v1 respondia "somos fechados". Com a rede aberta, essa resposta caiu. A nova é mais forte e vem do próprio produto:

1. **O spoiler é resolvido na interface, e é isso que liberta a conversa.** Comentário com spoiler nasce oculto e só se revela por ação individual de quem lê. Sem esse tratamento, um clube precisaria travar a discussão até uma data combinada — é a única forma de proteger quem está atrasado. Com ele, a trava é desnecessária: cada pessoa fala quando quer e lê quando está pronta. Nenhum concorrente resolve isso.
2. **O ciclo é a espinha.** Skoob e Goodreads são catálogos: você registra o que leu, sem prazo e sem par. No Prosa existe um livro do ciclo, uma votação que o escolheu e um prazo que o grupo combinou. Nenhum dos dois tem isso.
3. **O clube é a unidade, não o indivíduo.** Nos concorrentes, grupo é recurso secundário. Aqui o clube é a tela principal e o feed serve o clube — não o contrário.

O feed e os perfis públicos existem para **alimentar os clubes** — descobrir o que propor, ver quem leu o que — e não para substituí-los.

---

## 2. Problema

Duas dores, uma de cada lado:

**No clube.** Clubes de leitura informais perdem organização porque a coordenação é dispersa: a escolha do próximo livro vira discussão infinita no grupo de mensagens, não há registro do que já foi lido, ninguém sabe em que ponto os outros estão, e a discussão vira spoiler acidental.

**Fora do clube.** Quem termina um livro não tem para onde levar a impressão. Redes de leitura existentes devolvem catálogo e nota, não conversa — e o que a pessoa queria era alguém para responder.

---

## 3. Personas

### P1 — Kauê, o organizador (primária)
22 anos, estudante de TI, criou o clube com os amigos.
**Objetivo:** manter o clube vivo sem cobrar todo mundo manualmente.
**Frustração:** é sempre ele quem tem que lembrar de tudo.
**Interface precisa de:** administração leve — abrir votação, definir prazo — sem burocracia.

### P2 — Marina, a leitora constante
24 anos, lê rápido e termina antes dos outros.
**Objetivo:** discutir assim que termina, e registrar o que achou.
**Frustração:** espera em silêncio para não dar spoiler.
**Interface precisa de:** poder publicar nota e resenha imediatamente, com marcação de spoiler.

### P3 — Diego, o leitor atrasado
27 anos, trabalha em tempo integral, sempre alguns capítulos atrás.
**Objetivo:** participar sem ser exposto a spoilers.
**Frustração:** abre o app e já leu o final sem querer.
**Interface precisa de:** spoiler oculto por padrão, revelado só por ação dele.

> **Nota de IHC:** P2 e P3 têm necessidades diretamente conflitantes. Resolver esse conflito — marcação de spoiler com revelação sob demanda individual — é a decisão de design central do projeto, e agora aparece em três telas: resenhas do livro, conversa do clube e feed.

---

## 4. Jornada principal

```
Criar conta  →  Entrar em clube por convite  →  Propor livro  →  Votar
                                                                   ↓
   Feed dos seguidos  ←  Nota + resenha  ←  Ler e conversar  ←  Livro do ciclo
          ↓                                                        ↑
   Descobrir livro  →  Adicionar aos futuros  →  Propor no clube ──┘
```

O laço de baixo é o que a v1 não tinha: o feed devolve descoberta para dentro do clube.

---

## 5. Épicos

| Código | Épico | Descrição |
|---|---|---|
| **E1** | Conta e Perfil | Cadastro, login, retrato ilustrado, perfil público |
| **E2** | Clubes | Criar, entrar por convite, administrar grupos fechados |
| **E3** | Catálogo de Livros | Busca via API, ficha do livro, cadastro manual |
| **E4** | Ciclo e Votação | Propor, votar, encerrar, definir prazo |
| **E5** | Estante | Três estados de leitura, sem progresso manual |
| **E6** | Nota, Resenha e Conversa | Avaliação 0–5, resenha, discussão com spoiler |
| **E7** | Estatísticas | Métricas pessoais e do clube |
| **E8** | Plataforma | PWA, responsividade, acessibilidade |
| **E9** | Rede | Seguir, feed, perfil público, interações |

---

## 6. Backlog

`M` = Must (MVP) · `S` = Should · `C` = Could · `W` = Won't

### E1 — Conta e Perfil

| ID | User story | Pri |
|---|---|---|
| US-01 | Como visitante, quero criar conta com e-mail e senha, para acessar o Prosa. | M |
| US-02 | Como usuário, quero fazer login e permanecer conectado. | M |
| US-03 | Como usuário, quero escolher meu retrato numa galeria ilustrada, para me identificar. | M |
| US-04 | Como usuário, quero editar meu nome de exibição. | M |
| US-59 | Como usuário, quero redefinir minha senha por e-mail, para voltar a entrar quando esquecer. | M |

**Critérios — US-03:** galeria com os retratos ilustrados que a identidade fornecer — hoje são 6, desenhados no protótipo; seleção reflete imediatamente no perfil, no feed e na lista de membros; retrato padrão atribuído a quem não escolher.

> Seis retratos é pouco para um clube de cinco pessoas: a chance de repetição é alta. Ampliar o conjunto é tarefa de identidade visual, não de desenvolvimento, e vale fazer antes do teste de usabilidade.

**Critérios — US-59:** o pedido de redefinição nunca revela se o e-mail tem conta, para não entregar a estranhos quais endereços estão cadastrados; a confirmação repete o endereço e diz o que fazer se a mensagem não chegar; o link do e-mail leva a uma tela onde a pessoa **digita a senha nova**, com a mesma exigência de 8 caracteres da US-01.

### E2 — Clubes

| ID | User story | Pri |
|---|---|---|
| US-05 | Como usuário, quero criar um clube com nome e descrição. | M |
| US-06 | Como criador, quero gerar link/código de convite. | M |
| US-07 | Como usuário, quero entrar em um clube por convite. | M |
| US-08 | Como membro, quero ver os membros e o estado de leitura de cada um. | M |
| US-09 | Como usuário, quero participar de vários clubes e alternar entre eles. | M |
| US-10 | Como criador, quero remover um membro. | S |
| US-11 | Como membro, quero sair de um clube. | S |
| US-12 | Como criador, quero registrar o combinado do clube (regras de convivência). | C |

**Critérios — US-07:** convite validado antes da entrada; convite inválido exibe erro com próxima ação; entrada leva direto à tela do clube; não é possível entrar duas vezes.

### E3 — Catálogo de Livros

| ID | User story | Pri |
|---|---|---|
| US-13 | Como usuário, quero buscar livro por título ou autor. | M |
| US-14 | Como usuário, quero ver a ficha do livro: capa, autor, sinopse, páginas, ano, editora. | M |
| US-15 | Como usuário, quero ver estado de carregamento durante a busca. | M |
| US-16 | Como usuário, quero orientação clara quando a busca não retorna nada. | M |
| US-17 | Como usuário, quero ver quem do meu clube está em cada livro. | S |
| US-18 | Como usuário, quero cadastrar um livro manualmente. | C |

**Critérios — US-13:** máximo 20 resultados; cada um com capa (ou substituto), título e autor; falha na fonte primária recorre à alternativa sem erro visível.

### E4 — Ciclo e Votação

| ID | User story | Pri |
|---|---|---|
| US-19 | Como membro, quero propor um livro para o próximo ciclo. | M |
| US-20 | Como membro, quero votar em uma proposta. | M |
| US-21 | Como membro, quero ver a parcial e identificar meu voto. | M |
| US-22 | Como criador, quero encerrar a votação e definir o livro do ciclo. | M |
| US-23 | Como criador, quero definir o prazo do ciclo. | M |
| US-24 | Como membro, quero ver quanto falta para o fim do ciclo. | S |
| US-25 | Como membro, quero trocar meu voto antes do encerramento. | S |
| US-26 | Como membro, quero ver o ciclo passado e quem venceu. | S |
| US-27 | Como criador, quero encerramento automático na data marcada. | C |

**Critérios — US-20:** um voto por membro por votação; voto próprio destacado visualmente; votação encerrada não aceita voto; contagens em números tabulares.

### E5 — Estante

| ID | User story | Pri |
|---|---|---|
| US-28 | Como usuário, quero mover um livro entre Futuros, Lendo e Lidos sem digitar nada. | M |
| US-29 | Como usuário, quero um caminho alternativo ao arrastar, para mover pelo menu ou teclado. | M |
| US-30 | Como usuário, quero minha estante com os livros de todos os clubes. | M |
| US-31 | Como usuário, quero ver o histórico do que o clube já leu. | S |
| US-32 | Como usuário, quero desfazer uma mudança de estado feita por engano. | S |
| US-33 | Como usuário, quero ganhar um adesivo ao fechar um livro. | C |

**Critérios — US-28:** o card muda de coluna por arrastar **e** por controle alternativo acessível; a mudança persiste e é visível aos outros membros; retorno visual em até 100 ms; **em nenhum momento o sistema pede número de página ou percentual**.

### E6 — Nota, Resenha e Conversa

| ID | User story | Pri |
|---|---|---|
| US-34 | Como usuário, quero dar nota de 0 a 5 a um livro que terminei. | M |
| US-35 | Como usuário, quero escrever uma resenha. | M |
| US-36 | Como membro, quero conversar sobre o livro do ciclo. | M |
| US-37 | Como autor de comentário, quero marcá-lo como spoiler. | M |
| US-38 | Como leitor atrasado, quero que spoilers apareçam ocultos e só se revelem por ação minha. | M |
| US-39 | Como usuário, quero ver a média e a distribuição de notas de um livro. | S |
| US-40 | Como usuário, quero responder ao comentário de outro. | S |
| US-41 | ~~Como membro, quero que a conversa só abra na data combinada.~~ Removida — ver nota abaixo. | W |

**Critérios — US-34:** só pode avaliar quem marcou o livro como Lido; a nota vai para o perfil e para o feed; estrelas nunca usam a cor de ação (ocre).

**Critérios — US-38:** spoiler renderizado oculto por padrão; revelação exige ação explícita e individual; o estado revelado não é compartilhado entre usuários; o aviso identifica quem marcou.

> **Por que US-41 foi removida.** A versão anterior travava a conversa até uma data combinada, para proteger quem estava atrasado. A trava resolvia o problema errado: ela penalizava quem terminou primeiro para proteger quem ficou para trás, e a Marina — que lê rápido e quer discutir na hora — ficava em silêncio forçado.
>
> O tratamento de spoiler (US-37 e US-38) já resolve a proteção do Diego, e resolve melhor: em vez de calar todo mundo até uma data, ele deixa cada pessoa escolher quando ler o quê. Com isso a trava vira redundante e a conversa fica aberta o tempo todo.
>
> O **prazo do ciclo continua existindo** (US-23) — é o que mantém o grupo lendo junto. O que deixa de existir é o bloqueio da discussão. A data do encontro do clube, quando houver, é combinado social registrado em US-12, não regra de software.

### E7 — Estatísticas

| ID | User story | Pri |
|---|---|---|
| US-42 | Como usuário, quero ver quantos livros fechei e a média que dou. | S |
| US-43 | Como usuário, quero ver a distribuição de gêneros que li. | C |
| US-44 | Como membro, quero estatísticas de participação do clube. | C |
| US-45 | Como usuário, quero definir meta anual de leitura. | W |

### E8 — Plataforma

| ID | User story | Pri |
|---|---|---|
| US-46 | Como usuário, quero instalar o Prosa na tela inicial do celular. | M |
| US-47 | Como usuário, quero usar o app no celular e no computador. | M |
| US-48 | Como usuário, quero navegar por teclado e com leitor de tela. | M |
| US-49 | Como usuário, quero consultar minha estante sem conexão. | C |
| US-50 | Como usuário, quero notificação quando a votação abrir ou o prazo do ciclo estiver acabando. | W |

### E9 — Rede

| ID | User story | Pri |
|---|---|---|
| US-51 | Como usuário, quero seguir e deixar de seguir outras pessoas. | M |
| US-52 | Como usuário, quero um feed com a atividade de quem sigo. | M |
| US-53 | Como usuário, quero um perfil público com lidos, futuros e resenhas. | M |
| US-54 | Como usuário, quero curtir uma publicação. | S |
| US-55 | Como usuário, quero comentar uma publicação do feed. | S |
| US-56 | Como usuário, quero ver seguidores e seguindo de um perfil. | S |
| US-57 | Como usuário, quero propor no meu clube um livro que vi no feed. | S |
| US-58 | Como usuário, quero controlar a privacidade das minhas listas. | C |

**Critérios — US-52:** o feed mostra três tipos de evento — alguém terminou um livro com nota, alguém adicionou aos futuros, alguém publicou resenha; cada item leva à ficha do livro; feed vazio orienta a seguir alguém ou entrar em um clube.

> **Alerta de privacidade (relevante para IHC):** o protótipo declara que a lista de futuros é pública. Isso precisa ser dito ao usuário **no momento do cadastro**, não escondido nos termos. US-58 existe para dar controle real sobre isso.

---

## 7. Escopo do MVP

O MVP fecha um ciclo completo **e** dá ao usuário para onde levar o que ele achou do livro.

| Épico | Stories no MVP | Qtd |
|---|---|---|
| E1 — Conta e Perfil | US-01 a US-04, US-59 | 5 |
| E2 — Clubes | US-05 a US-09 | 5 |
| E3 — Catálogo | US-13 a US-16 | 4 |
| E4 — Ciclo e Votação | US-19 a US-23 | 5 |
| E5 — Estante | US-28 a US-30 | 3 |
| E6 — Nota, Resenha e Conversa | US-34 a US-38 | 5 |
| E8 — Plataforma | US-46 a US-48 | 3 |
| E9 — Rede | US-51 a US-53 | 3 |

**Total: 33 user stories.**

**Critério de pronto:** um clube real com pelo menos 3 membros escolhe um livro por votação, lê dentro do prazo combinado, conversa sobre ele sem expor spoiler a quem está atrasado e publica nota e resenha — e essas notas aparecem no feed de quem segue essas pessoas, sem nenhuma intervenção fora do app.

### Corte de emergência

32 stories em projeto solo é escopo agressivo. Se o prazo apertar, corte nesta ordem — cada linha remove trabalho sem quebrar o ciclo:

1. **US-51 a US-53 (rede)** — sem feed, o produto ainda fecha o ciclo do clube. É o corte de maior alívio e menor dano.
2. **US-36 a US-38 (conversa)** — a discussão pode acontecer no grupo de mensagens por mais um ciclo.
3. **US-30 (estante unificada)** — a estante por clube já basta.

Não corte US-28 nem US-34: sem estado de leitura e sem nota, não existe produto.

---

## 8. Roadmap

| Fase | Conteúdo |
|---|---|
| **Fase 1 — MVP** | As 32 stories acima |
| **Fase 2** | Todas as `S`: curtidas, comentários no feed, seguidores, desfazer, média de notas, ciclo passado |
| **Fase 3** | Todas as `C`: estatísticas, offline, cadastro manual, adesivos, privacidade granular |

---

## 9. Requisitos não-funcionais

### Usabilidade — mapeados às heurísticas de Nielsen

| ID | Requisito | Heurística |
|---|---|---|
| RNF-01 | Toda ação produz retorno visual em até 100 ms. | Visibilidade do status |
| RNF-02 | Ações destrutivas exigem confirmação. | Prevenção de erros |
| RNF-03 | Mudanças de estado da estante são reversíveis. | Controle e liberdade |
| RNF-04 | A interface usa vocabulário de clube de leitura, nunca termo técnico. | Correspondência com o mundo real |
| RNF-05 | Erros indicam causa e próxima ação, em linguagem natural. | Recuperação de erros |
| RNF-06 | Estados vazios orientam o próximo passo. | Ajuda e documentação |
| RNF-07 | Elementos de mesma função mantêm posição e aparência. | Consistência |

### Acessibilidade
- **RNF-08** — Contraste mínimo 4.5:1 para texto (WCAG 2.1 AA).
- **RNF-09** — Toda funcionalidade acessível por teclado.
- **RNF-10** — Imagens e ícones funcionais com texto alternativo.
- **RNF-11** — Alvos de toque de no mínimo 44×44 px.
- **RNF-12** — Nenhuma informação transmitida só por cor. Os três estados de leitura carregam cor + forma própria (círculo vazio, meia-lua, disco com traço) + rótulo.

### Técnicos
- **RNF-13** — PWA instalável, com manifest e service worker.
- **RNF-14** — Responsivo de 320 px a 1920 px.
- **RNF-15** — Carregamento inicial em até 3 s em 4G.
- **RNF-16** — Metadados de livros via API externa, com fonte alternativa em caso de falha.
- **RNF-17** — Nenhuma tela solicita progresso de leitura em página ou percentual.

---

## 10. Identidade visual

Definida no manual da marca. Resumo operacional:

**Cores — tema claro:** papel `#F1F3F4` · superfície `#FFFFFF` · tinta `#131A1E` · tinta suave `#56656D` · ocre ação `#C4882A` · ocre marca `#8F6412` · traço `#D7DDDF`

**Cores — tema escuro:** noite `#0E1417` · superfície `#172025` · tinta `#E8EDEF` · tinta suave `#96A5AC` · ocre ação `#D19A3A` · ocre marca `#E7B054` · traço `#2A363C`

**Estados:** Futuros índigo `#4A3FC2` / `#ABA0FF` (círculo vazio) · Lendo verde-água `#0B7268` / `#4FD3BD` (meia-lua) · Lidos framboesa `#B0295F` / `#FF93B6` (disco com traço)

**Regra de cor:** ocre é ação, nunca estado. Estrelas de nota usam framboesa.

**Tipografia:** Newsreader para a voz do produto (títulos de livro, conversa) · Nunito para a interface (tudo que se toca). Se pode ser clicado, é sem serifa.

**Marca:** balão de fala com livro vazado (`fill-rule="evenodd"`), uma cor só. Com olhos até 48 px; a partir de 28 px, vazado puro.

---

## 11. Fora de escopo

- Leitura do livro dentro do app.
- Venda, empréstimo ou aquisição de livros.
- Chat em tempo real — a conversa é assíncrona e ligada ao livro.
- Mensagem direta entre usuários.
- Aplicativo nativo publicado em lojas.
- Moderação automatizada de conteúdo.

---

## 12. Validação prevista

| Momento | Método | Participantes |
|---|---|---|
| Após wireframes | Avaliação heurística de Nielsen | Autor + colegas |
| Após protótipo navegável | Teste de usabilidade com tarefas | 3–5 membros do clube real |
| Após MVP | Teste de usabilidade + SUS | Mesmos participantes |

**Tarefas do teste de usabilidade:**
1. Entrar em um clube a partir de um convite.
2. Propor um livro específico para votação.
3. Votar e depois trocar o voto.
4. Mover um livro para "Lendo" sem usar arrastar.
5. Publicar nota e resenha de um livro terminado.
6. Ler uma conversa sem ser exposto a spoiler.
7. Localizar o que o clube já leu.
