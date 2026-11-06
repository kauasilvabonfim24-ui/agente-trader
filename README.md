# Agente Trader

Crie um app web mobile-first (PWA instalável) chamado "Agente Trader", de uso pessoal para um único usuário, em português do Brasil. Use React, TypeScript, Tailwind e shadcn/ui, em tema escuro.

ESTILO
Fundo #0B0F14. Cartões #131A22 com borda #243040 e raio 14. Texto #E6EDF3. Texto de apoio #9AA7B4. Cor "ok" #2DD4BF. Cor "atenção" #F5B544. Fonte Inter. Botões com no mínimo 44px de altura. Nunca use verde e vermelho como única pista: sempre acompanhe com texto.

NAVEGAÇÃO
Barra inferior fixa com 5 abas: Hoje, Analisar, Notícias, Diário, Agente.

TELA HOJE
Cartões:
1) Agenda de alto impacto: hora, evento e uma pílula "Fora hh:mm a hh:mm" (de 10 min antes até 20 min depois do evento).
2) Clima do dia: 3 linhas curtas. Regras: juros ou dados fortes dos EUA, medo no mundo e risco no Brasil tendem a subir o dólar e pressionar o índice. Sempre terminar com "A reação só se confirma no gráfico".
3) Notícia explicada: título, resumo, linha "Costuma:", botões "Ver fonte" e "Perguntar ao agente".
4) Guarda do dia: "Stops hoje X de 2" com barra de progresso e "Checklist 0 de 7".

TELA ANALISAR
- Seletor de ativo (WINZ26 ou WDOZ26).
- 3 slots de upload de print: 60 min (MME 200), 15 min (MME 50, topos, fundos e regiões) e 3 min (MME 5, 9 e 21).
- Campos numéricos: preço de entrada, stop e alvo.
- Botão "Analisar".
- Resultado: Veredito ("Compra possível", "Venda possível" ou "Fora por enquanto", com o motivo); Checklist de 7 itens, cada um com Sim, Não ou "Não deu pra ver"; Plano hipotético com stop e alvo em pontos e em R$, e risco em R.
- Botão "Ver o que a IA enxergou".
- "Marcar no print": tocar na imagem para marcar entrada, stop e alvo, e desenhar as linhas.
- Seção opcional "Contexto" com o widget gratuito do TradingView, com símbolo editável (ex.: BMFBOVESPA:WIN1!), a etiqueta "atrasado 15 min: só contexto, nunca pra entrar" e um aviso amigável se não carregar.

TELA NOTÍCIAS
Lista de notícias e formulário para digitar os eventos do dia (hora, nome, país, impacto).

TELA DIÁRIO
Formulário: data e hora, ativo, lado, 60 e 15 alinhados, entrada, stop, alvo, saída, resultado em R$ e em R, seguiu o checklist, "No gatilho" ou "Antecipei", onde teria saído no alvo. Lista dos trades e uma "Revisão da semana" mostrando o erro que mais se repetiu.

TELA AGENTE
Chat simples.

CONFIGURAÇÕES
Risco por trade em R$ (padrão 15), limite de stops no dia (padrão 2) e ativo padrão.

REGRAS GERAIS
- Nesta etapa use dados de exemplo e estado local, sem backend.
- Nunca mostre recomendação de compra ou venda: só "veredito do método".
- Rodapé fixo: "Conteúdo educativo, não é recomendação".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33f81d09-809b-490e-a998-a64f0f2f067a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
