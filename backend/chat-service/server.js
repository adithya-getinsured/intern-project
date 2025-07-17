const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const chatSocket = require('./src/sockets/chatSocket');

const PORT = process.env.PORT || 3002;

connectDB();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }
});

// Register io on the Express app so controllers can emit socket events
app.set('io', io);

chatSocket(io);

server.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`);
});