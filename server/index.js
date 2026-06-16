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

// Fallback para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const rooms = {};

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
      players: {}
    };
    socket.join(code);
    socket.emit('room:created', { code });
    console.log(`[ROOM] Created ${code} by ${socket.id}`);
  });

  socket.on('room:join', (data) => {
    const { code } = data;
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
    socket.join(code);
    room.gameState = 'playing';

    const room1Socket = io.sockets.sockets.get(room.player1);
    const room2Socket = io.sockets.sockets.get(room.player2);

    if (room1Socket) room1Socket.emit('room:joined', { opponentId: socket.id });
    socket.emit('room:joined', { opponentId: room.player1 });

    io.to(code).emit('game:start');
    console.log(`[ROOM] ${code} full: ${room.player1} vs ${socket.id}`);
  });

  socket.on('player:move', (data) => {
    const code = Object.keys(rooms).find(c => {
      const room = rooms[c];
      return room.player1 === socket.id || room.player2 === socket.id;
    });

    if (!code || !rooms[code]) {
      console.log(`[MOVE] Player ${socket.id} not in a room`);
      return;
    }

    const room = rooms[code];
    room.players[socket.id] = {
      x: data.x,
      y: data.y,
      direction: data.direction
    };

    const otherPlayerId = room.player1 === socket.id ? room.player2 : room.player1;
    const otherSocket = io.sockets.sockets.get(otherPlayerId);

    if (otherSocket) {
      otherSocket.emit('opponent:move', {
        x: data.x,
        y: data.y,
        direction: data.direction
      });
    }
  });

  socket.on('player:death', (data) => {
    const code = Object.keys(rooms).find(c => {
      const room = rooms[c];
      return room.player1 === socket.id || room.player2 === socket.id;
    });

    if (!code || !rooms[code]) return;

    const room = rooms[code];
    const otherPlayerId = room.player1 === socket.id ? room.player2 : room.player1;
    const otherSocket = io.sockets.sockets.get(otherPlayerId);

    if (otherSocket) {
      otherSocket.emit('game:over', { winner: 'opponent' });
    }

    room.gameState = 'ended';
    console.log(`[GAME] ${code} ended - player ${socket.id} died`);
  });

  socket.on('disconnect', () => {
    const code = Object.keys(rooms).find(c => {
      const room = rooms[c];
      return room.player1 === socket.id || room.player2 === socket.id;
    });

    if (code && rooms[code]) {
      const room = rooms[code];
      const otherPlayerId = room.player1 === socket.id ? room.player2 : room.player1;
      const otherSocket = io.sockets.sockets.get(otherPlayerId);

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
