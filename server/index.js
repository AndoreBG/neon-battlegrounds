import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
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
const MOVE_DELAY = 120; // ms por passo

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
    players: {
      [room.player1]: {
        id: room.player1,
        role: 'host',
        x: 1,
        y: GRID_ROWS - 2,
        direction: DIRECTIONS.RIGHT,
        nextDirection: DIRECTIONS.RIGHT,
        alive: true
      },
      [room.player2]: {
        id: room.player2,
        role: 'guest',
        x: GRID_COLS - 2,
        y: 1,
        direction: DIRECTIONS.LEFT,
        nextDirection: DIRECTIONS.LEFT,
        alive: true
      }
    }
  };

  room.gameState = 'playing';

  // Loop de jogo independente do foco de qualquer cliente
  room.loop = setInterval(() => tickRoom(room), MOVE_DELAY);
}

function stopMatch(room) {
  if (room.loop) {
    clearInterval(room.loop);
    room.loop = null;
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
 *  Tick principal
 * ---------------------------------------------------------- */
function tickRoom(room) {
  const match = room.match;
  if (!match || room.gameState !== 'playing') {
    return;
  }

  match.elapsed += MOVE_DELAY;
  updateArena(match);

  const players = Object.values(match.players);

  // 1) Aplica direção e marca rastro na posição atual, depois move
  for (const p of players) {
    if (!p.alive) continue;

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
  }

  // 2) Detecta colisões (rastro/parede/arena) e colisão de cabeças
  const headMap = {};
  for (const p of players) {
    if (!p.alive) continue;
    const key = `${p.x},${p.y}`;
    headMap[key] = headMap[key] ? [...headMap[key], p] : [p];
  }

  for (const p of players) {
    if (!p.alive) continue;

    const outOfBounds = !isInside(p.x, p.y);
    const hitTrail = !outOfBounds && room.grid[p.y][p.x] !== null;
    const outOfArena = !isInsideActiveArena(match, p.x, p.y);
    const headOn = (headMap[`${p.x},${p.y}`] || []).length > 1;

    if (outOfBounds || hitTrail || outOfArena || headOn) {
      p.alive = false;
    }
  }

  // 3) Monta snapshot e transmite
  const snapshot = {
    elapsed: match.elapsed,
    arena: {
      bounds: match.arena.bounds,
      warningActive: match.arena.warningActive,
      pendingBounds: match.arena.pendingBounds
    },
    players: players.map(p => ({
      id: p.id,
      role: p.role,
      x: p.x,
      y: p.y,
      direction: p.direction,
      alive: p.alive
    }))
  };

  io.to(room.code).emit('state:update', snapshot);

  // 4) Condição de fim de jogo
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
      moveDelay: MOVE_DELAY
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