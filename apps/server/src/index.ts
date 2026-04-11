import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerHandlers } from './socket/handlers';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const httpServer = createServer(app);

// תמיכה בכמה origins (פיתוח + ייצור)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log(`שחקן התחבר: ${socket.id}`);
  registerHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`🎮 שרת The Killer פועל על פורט ${PORT}`);
});
