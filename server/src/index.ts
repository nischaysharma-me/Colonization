import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CatanRoom } from './rooms/CatanRoom.js';

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Define Catan rooms
gameServer.define('catan', CatanRoom);

server.listen(port, () => {
  console.log(`[Catan Server] Running on ws://localhost:${port}`);
});
