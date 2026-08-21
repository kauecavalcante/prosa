# Wireframes

Wireframes de baixa fidelidade das telas do MVP, em escala de cinza. Wireframe resolve estrutura, hierarquia e navegação — cor e identidade entram depois, nas telas de alta fidelidade em `docs/prototipos/`.

## As telas

| Arquivo | Tela | User stories |
|---|---|---|
| `04-estante.svg` | Estante com os três estados e área de soltar | US-28, US-29, US-30 |
| `05-votacao.svg` | Votação com o voto próprio destacado | US-19, US-20, US-21 |
| `06-buscar.svg` | Busca de livro com resultados | US-13, US-14 |
| `07-livro-nota.svg` | Ficha do livro e avaliação de 0 a 5 | US-14, US-34, US-39 |
| `08-conversa-spoiler.svg` | Conversa do clube com spoiler oculto | US-36, US-37, US-38 |
| `09-feed.svg` | Feed com atividade de quem se segue | US-52 |
| `10-perfil.svg` | Perfil público com listas e clubes | US-53, US-58 |

As telas 1 a 3 (Entrar, Convite do clube, Clube · ciclo) foram construídas direto no Figma e não têm SVG aqui.

## Como levar para o Figma

Arraste os arquivos `.svg` para dentro do arquivo do Figma. O Figma importa cada um como um grupo, com o texto em camadas de texto editáveis.

Depois de importar, para deixá-los no padrão das telas 1 a 3:

1. Selecione o grupo e use **Frame selection** para transformá-lo em frame de 375 × 812.
2. Aplique os estilos de texto da página **Design system** (`interface/…` e `voz/…`).
3. Aplique as variáveis de cor `claro/…` nos preenchimentos.

## Por que SVG e não nativo

O plano Starter do Figma limita a quantidade de chamadas ao MCP, o que interrompeu a construção nativa depois da terceira tela. Os SVGs são a rota que não depende dessa cota.
