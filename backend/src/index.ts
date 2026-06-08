import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import { createApp, type Broadcaster } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

// engine.io needs a broadcaster, but we build the app first now.
const io = new Server();   // create detached, attach below

const broadcaster: Broadcaster = {
  emit: (event, payload) => io.emit(event, payload),
};

const app = createApp({ broadcaster });

// Express is the HTTP handler; Socket.IO attaches to the same server
// and claims /socket.io/ before Express sees it.
const server = http.createServer(app);
io.attach(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log(`socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});