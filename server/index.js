import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hosts como Render/Railway/Fly definem a porta via variável de ambiente.
// Em desenvolvimento, cai no 3000.
const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

/* ------------------------------------------------------------
 *  CORS — quais origens podem se conectar ao servidor.
 *
 *  - O domínio do GitHub Pages do projeto.
 *  - localhost / 127.0.0.1 (qualquer porta) para desenvolvimento.
 *  - Origens extras opcionais via variável de ambiente ALLOWED_ORIGINS
 *    (separe por vírgula), sem precisar editar o código.
 * ---------------------------------------------------------- */
const STATIC_ALLOWED_ORIGINS = [
  'https://andorebg.github.io'
];

const ENV_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...STATIC_ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS];

function isOriginAllowed(origin) {
  // Requisições sem Origin (ex: curl, apps nativos, same-origin) são liberadas.
  if (!origin) return true;

  // Desenvolvimento local em qualquer porta.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

const corsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin não permitida pelo CORS: ${origin}`));
  }
};

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Serve arquivos estáticos
app.use(express.static(path.join(__dirname, '..')));

// Fallback para index.html apenas para navegação (não para assets)
app.get('*', (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ============================================================
 *  CONSTANTES DE JOGO (espelham src/utils/Constants.js)
 *  O servidor é AUTORITATIVO no modo online.
 * ============================================================ */
const GRID_COLS = 40;
const GRID_ROWS = 40;
const MOVE_DELAY = 120; // ms por passo (velocidade normal)

// Resolução do loop. O servidor "tica" rápido e cada jogador anda quando
// o seu acumulador atinge o próprio moveDelay (permite velocidades distintas).
const TICK_MS = 20;

// Contagem regressiva antes de a partida começar a se mover (3, 2, 1, TRON).
const COUNTDOWN_MS = 3000;

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const ARENA_TIMERS = {
  INITIAL_SHRINK_DELAY: 5000,
  SHRINK_INTERVAL: 3000,
  WARNING_DURATION: 3000
};

// Espelha src/utils/Constants.js -> POWER_UP
const POWER_UP = {
  SPAWN_DELAY: 4000,
  RESPAWN_DELAY: 7000,
  SPEED_MULTIPLIER: 1 / 1.4,
  DURATION: 5000
};

// Velocidade (moveDelay) com boost, mesma fórmula do Player.applySpeedBoost
const BOOST_MOVE_DELAY = Math.max(40, Math.floor(MOVE_DELAY * POWER_UP.SPEED_MULTIPLIER));

const rooms = {};
// Índice rápido socketId -> roomCode
const socketRoom = {};

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[code]);
  return code;
}

function getRoomBySocket(socketId) {
  const code = socketRoom[socketId];
  return code ? rooms[code] : null;
}

/* ------------------------------------------------------------
 *  Estado da partida (grid autoritativo)
 * ---------------------------------------------------------- */
function createGrid() {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    grid.push(new Array(GRID_COLS).fill(null));
  }
  return grid;
}

function isInside(x, y) {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

function dirEquals(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function isOpposite(a, b) {
  return a && b && a.x === -b.x && a.y === -b.y;
}

function startMatch(room) {
  // Posições/direções iniciais espelhando o cliente:
  // host -> canto inferior esquerdo indo p/ direita
  // guest -> canto superior direito indo p/ esquerda
  room.grid = createGrid();
  room.match = {
    elapsed: 0,
    arena: {
      bounds: { left: 0, right: GRID_COLS - 1, top: 0, bottom: GRID_ROWS - 1 },
      warningActive: false,
      nextShrinkTime: ARENA_TIMERS.INITIAL_SHRINK_DELAY,
      pendingBounds: null,
      warningEndTime: 0
    },
    powerUp: {
      active: null,                       // { x, y } enquanto houver power-up no mapa
      nextSpawnTime: POWER_UP.SPAWN_DELAY // quando tentar (re)spawnar
    },
    players: {
      [room.player1]: {
        id: room.player1,
        role: 'host',
        x: 1,
        y: GRID_ROWS - 2,
        direction: DIRECTIONS.RIGHT,
        nextDirection: DIRECTIONS.RIGHT,
        alive: true,
        moveDelay: MOVE_DELAY, // velocidade atual (ms por passo)
        moveAcc: 0,            // acumulador de tempo desde o último passo
        boostUntil: 0          // timestamp (match.elapsed) em que o boost expira
      },
      [room.player2]: {
        id: room.player2,
        role: 'guest',
        x: GRID_COLS - 2,
        y: 1,
        direction: DIRECTIONS.LEFT,
        nextDirection: DIRECTIONS.LEFT,
        alive: true,
        moveDelay: MOVE_DELAY,
        moveAcc: 0,
        boostUntil: 0
      }
    }
  };

  // A partida entra primeiro em contagem regressiva: ninguém se move até a
  // contagem terminar (tickRoom só age quando gameState === 'playing').
  room.gameState = 'countdown';

  room.countdownTimer = setTimeout(() => {
    if (!rooms[room.code]) return; // sala pode ter sido removida (desconexão)
    room.countdownTimer = null;
    room.gameState = 'playing';

    // Loop de jogo independente do foco de qualquer cliente.
    // Roda a TICK_MS; cada jogador anda quando seu acumulador atinge moveDelay.
    room.loop = setInterval(() => tickRoom(room), TICK_MS);
  }, COUNTDOWN_MS);
}

function stopMatch(room) {
  if (room.loop) {
    clearInterval(room.loop);
    room.loop = null;
  }
  if (room.countdownTimer) {
    clearTimeout(room.countdownTimer);
    room.countdownTimer = null;
  }
}

/* ------------------------------------------------------------
 *  Arena que encolhe (autoritativa)
 * ---------------------------------------------------------- */
function updateArena(match) {
  const a = match.arena;

  if (a.warningActive) {
    if (match.elapsed >= a.warningEndTime) {
      // aplica o novo limite
      a.bounds = a.pendingBounds;
      a.pendingBounds = null;
      a.warningActive = false;
      a.nextShrinkTime = a.warningEndTime + ARENA_TIMERS.SHRINK_INTERVAL;
    }
    return;
  }

  if (match.elapsed >= a.nextShrinkTime) {
    const b = a.bounds;
    if (b.right - b.left <= 6 || b.bottom - b.top <= 6) {
      a.nextShrinkTime = Number.POSITIVE_INFINITY;
      return;
    }
    a.warningActive = true;
    a.warningEndTime = match.elapsed + ARENA_TIMERS.WARNING_DURATION;
    a.pendingBounds = {
      left: b.left + 1,
      right: b.right - 1,
      top: b.top + 1,
      bottom: b.bottom - 1
    };
  }
}

function isInsideActiveArena(match, x, y) {
  const b = match.arena.bounds;
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}

/* ------------------------------------------------------------
 *  Power-up (autoritativo) — mesmas regras do singleplayer
 * ---------------------------------------------------------- */
function trySpawnPowerUp(room) {
  const match = room.match;
  const pu = match.powerUp;

  if (pu.active || match.elapsed < pu.nextSpawnTime) {
    return;
  }

  const players = Object.values(match.players);
  const freeCells = [];

  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      if (room.grid[y][x] !== null) continue;            // rastro ocupa
      if (!isInsideActiveArena(match, x, y)) continue;    // fora da arena ativa
      const onPlayer = players.some(p => p.alive && p.x === x && p.y === y);
      if (onPlayer) continue;
      freeCells.push({ x, y });
    }
  }

  if (freeCells.length === 0) {
    pu.nextSpawnTime = match.elapsed + POWER_UP.RESPAWN_DELAY;
    return;
  }

  const cell = freeCells[Math.floor(Math.random() * freeCells.length)];
  pu.active = { x: cell.x, y: cell.y };
}

function applyBoost(player, match) {
  player.moveDelay = BOOST_MOVE_DELAY;
  player.boostUntil = match.elapsed + POWER_UP.DURATION;
}

function expireBoosts(match) {
  for (const p of Object.values(match.players)) {
    if (p.boostUntil && match.elapsed >= p.boostUntil) {
      p.moveDelay = MOVE_DELAY;
      p.boostUntil = 0;
    }
  }
}

// Verifica coleta para um jogador específico (após ele se mover)
function checkPowerUpCollect(room, player) {
  const pu = room.match.powerUp;
  if (!pu.active || !player.alive) return;

  if (player.x === pu.active.x && player.y === pu.active.y) {
    applyBoost(player, room.match);
    pu.active = null;
    pu.nextSpawnTime = room.match.elapsed + POWER_UP.RESPAWN_DELAY;
    // avisa os clientes para tocar SFX
    io.to(room.code).emit('powerup:collected', { playerId: player.id });
  }
}

/* ------------------------------------------------------------
 *  Tick principal
 * ---------------------------------------------------------- */
function tickRoom(room) {
  const match = room.match;
  if (!match || room.gameState !== 'playing') {
    return;
  }

  // Avança o tempo de simulação por um tick
  match.elapsed += TICK_MS;

  updateArena(match);
  expireBoosts(match);
  trySpawnPowerUp(room);

  const players = Object.values(match.players);

  // 1) Move cada jogador conforme seu próprio acumulador (velocidade individual)
  const movedThisTick = [];
  for (const p of players) {
    if (!p.alive) continue;

    p.moveAcc += TICK_MS;
    if (p.moveAcc < p.moveDelay) {
      continue; // ainda não é hora desse jogador andar
    }
    p.moveAcc -= p.moveDelay;

    // adota a próxima direção se não for reversão
    if (p.nextDirection && !isOpposite(p.nextDirection, p.direction)) {
      p.direction = p.nextDirection;
    }

    // deixa rastro na célula atual
    if (isInside(p.x, p.y)) {
      room.grid[p.y][p.x] = p.id;
    }

    // move
    p.x += p.direction.x;
    p.y += p.direction.y;

    movedThisTick.push(p);
  }

  // Se ninguém andou neste tick, ainda assim transmitimos estado de tempos em
  // tempos não é necessário; mas mandamos sempre para manter clientes em sync.
  if (movedThisTick.length > 0) {
    // 2) Colisão de cabeças apenas entre quem andou e está na mesma célula
    const headMap = {};
    for (const p of players) {
      if (!p.alive) continue;
      const key = `${p.x},${p.y}`;
      headMap[key] = headMap[key] ? [...headMap[key], p] : [p];
    }

    for (const p of movedThisTick) {
      if (!p.alive) continue;

      const outOfBounds = !isInside(p.x, p.y);
      const hitTrail = !outOfBounds && room.grid[p.y][p.x] !== null;
      const outOfArena = !isInsideActiveArena(match, p.x, p.y);
      const headOn = (headMap[`${p.x},${p.y}`] || []).length > 1;

      if (outOfBounds || hitTrail || outOfArena || headOn) {
        p.alive = false;
      }
    }

    // 3) Coleta de power-up (só faz sentido para quem moveu)
    for (const p of movedThisTick) {
      checkPowerUpCollect(room, p);
    }
  }

  // 4) Monta snapshot e transmite
  const snapshot = {
    elapsed: match.elapsed,
    arena: {
      bounds: match.arena.bounds,
      warningActive: match.arena.warningActive,
      pendingBounds: match.arena.pendingBounds
    },
    powerUp: match.powerUp.active
      ? { x: match.powerUp.active.x, y: match.powerUp.active.y }
      : null,
    players: players.map(p => ({
      id: p.id,
      role: p.role,
      x: p.x,
      y: p.y,
      direction: p.direction,
      alive: p.alive,
      boost: p.boostUntil > match.elapsed
    }))
  };

  io.to(room.code).emit('state:update', snapshot);

  // 5) Condição de fim de jogo
  const alive = players.filter(p => p.alive);
  if (alive.length <= 1) {
    room.gameState = 'ended';
    stopMatch(room);
    const winnerId = alive.length === 1 ? alive[0].id : null; // null = empate
    io.to(room.code).emit('match:over', { winnerId });
  }
}

io.on('connection', (socket) => {
  console.log(`[CONNECT] Socket ${socket.id}`);

  socket.on('room:create', () => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      player1: socket.id,
      player2: null,
      gameState: 'waiting',
      grid: null,
      match: null,
      loop: null
    };
    socketRoom[socket.id] = code;
    socket.join(code);
    socket.emit('room:created', { code });
    console.log(`[ROOM] Created ${code} by ${socket.id}`);
  });

  socket.on('room:join', (data) => {
    const { code } = data || {};
    const room = rooms[code];

    if (!room) {
      socket.emit('room:joinFailed', { reason: 'Room not found' });
      return;
    }

    if (room.player2) {
      socket.emit('room:joinFailed', { reason: 'Room full' });
      return;
    }

    room.player2 = socket.id;
    socketRoom[socket.id] = code;
    socket.join(code);

    const room1Socket = io.sockets.sockets.get(room.player1);
    if (room1Socket) room1Socket.emit('room:joined', { opponentId: socket.id });
    socket.emit('room:joined', { opponentId: room.player1 });

    // Inicia a partida autoritativa
    startMatch(room);

    io.to(code).emit('game:start', {
      player1: room.player1,
      player2: room.player2,
      moveDelay: MOVE_DELAY,
      countdown: COUNTDOWN_MS
    });

    console.log(`[ROOM] ${code} full: ${room.player1} vs ${room.player2}`);
  });

  // Cliente envia apenas a direção desejada
  socket.on('player:input', (data) => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.match) return;

    const p = room.match.players[socket.id];
    if (!p || !p.alive) return;

    const dir = data && data.direction;
    if (!dir || typeof dir.x !== 'number' || typeof dir.y !== 'number') return;

    // valida que é uma das direções canônicas
    const valid = Object.values(DIRECTIONS).some(d => dirEquals(d, dir));
    if (!valid) return;

    // ignora reversão direta
    if (isOpposite(dir, p.direction)) return;

    p.nextDirection = { x: dir.x, y: dir.y };
  });

  socket.on('disconnect', () => {
    const code = socketRoom[socket.id];
    delete socketRoom[socket.id];

    if (code && rooms[code]) {
      const room = rooms[code];
      stopMatch(room);

      const otherPlayerId =
        room.player1 === socket.id ? room.player2 : room.player1;
      const otherSocket = otherPlayerId
        ? io.sockets.sockets.get(otherPlayerId)
        : null;

      if (otherSocket) {
        otherSocket.emit('opponent:disconnected');
      }

      delete rooms[code];
      console.log(`[ROOM] ${code} deleted after disconnect`);
    }

    console.log(`[DISCONNECT] Socket ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
