const jwt = require('jsonwebtoken');
const axios = require('axios');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/api/auth/verify-token`, {
      token
    });

    if (!response.data.valid) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = response.data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Socket auth middleware
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('No token provided'));
    }

    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/api/auth/verify-token`, {
      token
    });

    if (!response.data.valid) {
      return next(new Error('Invalid token'));
    }

    socket.user = response.data.user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
};

module.exports = { authMiddleware, socketAuthMiddleware };