import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { Game } from './types';
import { setupSocketHandlers } from './socket';
import { initializeGame } from './gameState';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://scat-31-cardgame-1.onrender.com"
    ],
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());

// CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

app.get('/', (req, res) => res.send('Backend is running!'));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', err.stack || err);
  res.status(500).send('Something broke!');
});

// Initialize game state
const game: Game = initializeGame();

// Setup socket handlers
setupSocketHandlers(io, game);

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 