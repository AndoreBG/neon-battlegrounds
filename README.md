# ⚡ Neon Battlegrounds ![Static Badge](https://img.shields.io/badge/status-%20finalizado-green)

Jogo de arena inspirado em **TRON** e **Snake**: deixe um rastro de luz, encurrale o oponente e sobreviva. Jogue contra bots ou em partidas online 1v1.

🎮 **[Jogar](https://andorebg.github.io/neon-battlegrounds/)** · Feito com Phaser 3, Node.js e Socket.io.

## Funcionalidades

- **Singleplayer** contra bots (3 dificuldades).
- **Multiplayer 1v1 online** com salas por código de 4 dígitos.
- **Servidor autoritativo** (sincronia perfeita no online).
- Arena que **encolhe**, **power-ups** de velocidade e contagem regressiva `3 → 2 → 1 → TRON`.

## Controles

`WASD` ou `← ↑ → ↓` para mover · `ESC` para o menu.

## Testar localmente

Requer [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/AndoreBG/neon-battlegrounds.git
cd neon-battlegrounds/server
npm install
node index.js
```

Abra **http://localhost:3000**. Para testar o multiplayer, abra em duas abas: numa clique `CRIAR SALA` e copie o código; na outra clique `ENTRAR SALA` e digite o código.

## Deploy

Front no **GitHub Pages**; servidor (`server/`) em um host Node (Render, Railway, Fly.io). Defina a URL pública do servidor em `src/config/networkConfig.js` (`PROD_SERVER_URL`).

> No meu caso eu escolhi utilizar o servidor gratuito do Render. No plano grátis do Render, se o servidor ficar muito tempo ocioso, ele hiberna e leva ~30–60s para acordar na primeira conexão.

## ⚠️ Tracker mostrando "Servidor offline"?

**É o adblocker.** Extensões como uBlock/AdBlock/Brave Shields bloqueiam a requisição ao `/health`, exibindo "offline" mesmo com o servidor no ar. Se você consegue criar sala e jogar, o servidor **está online** — basta desativar o adblocker na página (ou testar em aba anônima).

## Licença

[MIT](./LICENSE) · Desenvolvido por Mika Games.
