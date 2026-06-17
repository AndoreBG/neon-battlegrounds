# Neon Battlegrounds

Um jogo inspirado nos clássicos **TRON** e **Snake**, desenvolvido utilizando **Phaser 3** no front-end e **Socket.io** com **Node.js** no back-end. Sobreviva e encurrale seu oponente deixando um rastro de luz por onde passa!

🔗 **Link para Teste:** [https://andorebg.github.io/neon-battlegrounds/](https://andorebg.github.io/neon-battlegrounds/)


## Funcionalidades

- **Singleplayer:** Jogue contra bots com diferentes níveis de dificuldade.
- **Multiplayer Online (1v1):** Crie salas exclusivas com códigos (4 dígitos) para desafiar seus amigos.
- **Estilo Visual Neon:** Gráficos e estética minimalista imersivos inspirados no universo TRON.
- **Física e Colisões:** Sistema de física responsivo implementado nativamente com Phaser Arcade Physics.
- **Sistema de Salas:** Matchmaking em tempo real usando WebSockets.


## Tecnologias Utilizadas

- **Front-end:** HTML5, JavaScript (ES6 Modules), [Phaser 3](https://phaser.io/) (Engine de Jogos)
- **Back-end:** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Comunicação:** [Socket.io](https://socket.io/) (WebSockets em tempo real)

<br>

## Como Rodar o Projeto Localmente

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/AndoreBG/neon-battlegrounds.git
   cd neon-battlegrounds
   ```

2. **Instale as dependências do servidor:**
   ```bash
   cd server
   npm install
   ```

3. **Inicie o servidor local:**
   ```bash
   npm start
   # ou npm run dev
   ```
   *O servidor rodará na porta 3000.*

4. **Acesse o jogo:**
   Abra o endereço `http://localhost:3000` no seu navegador de preferência para jogar.

<br>

## 📂 Estrutura do Projeto

Abaixo uma visão geral da estrutura principal de diretórios:

```text
neon-battlegrounds/
├── server/             # Código fonte do backend (Node.js/Socket.io)
│   ├── index.js        # Configuração do Express e lógica das salas WebSocket
│   └── package.json    # Dependências do servidor
├── src/                # Código fonte do frontend (Phaser 3)
│   ├── config/         # Configurações globais do jogo
│   ├── entities/       # Entidades (Player, Bot, RemotePlayer, Trail)
│   ├── managers/       # Gerenciadores (ex: NetworkManager)
│   ├── scenes/         # Cenas (Menu, Matchmaking, Game, Difficulty, etc)
│   ├── systems/        # Lógica de sistemas
│   ├── utils/          # Funções utilitárias auxiliares
│   └── main.js         # Ponto de entrada do jogo
├── index.html          # Estrutura HTML principal
└── phaser.min.js       # Biblioteca do Phaser minificada
```

<br>

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
