import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import { createApp, type Broadcaster } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

// Create the HTTP server first so Socket.IO can share the same port.
const server = http.createServer();
const io = new Server(server, {
  // Would also not let this fly in Prod. But for demo we'll let it slide
  // because messing with CORS is not something I'd want to prioritze for a demo
  cors: { origin: '*' },
});

// Adapt socket.io's io.emit into our Broadcaster interface so app.ts
// stays decoupled from the socket library.
const broadcaster: Broadcaster = {
  emit: (event, payload) => io.emit(event, payload),
};

const app = createApp(broadcaster);
server.on('request', app);

io.on('connection', (socket) => {
  console.log(`socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});