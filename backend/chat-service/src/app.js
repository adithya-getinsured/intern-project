const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/rooms', roomRoutes);

// Health
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Chat Service' });
});

// Global Catch
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;
