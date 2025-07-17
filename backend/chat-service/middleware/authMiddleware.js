const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Socket.io auth middleware
const socketAuthMiddleware = (socket, next) => {
  try {
    console.log('Socket auth middleware called');
    console.log('Auth object:', socket.handshake.auth);
    
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.log('Socket auth: No token provided');
      return next(new Error('Authentication failed: No token provided'));
    }
    
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Extract token if it has Bearer prefix
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    try {
      const decoded = verifyToken(tokenValue);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      console.log('Socket authenticated for user:', socket.userId);
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      next(new Error('Authentication failed: ' + jwtError.message));
    }
  } catch (error) {
    console.log('Socket auth error:', error.message);
    next(new Error('Authentication failed: ' + error.message));
  }
};

module.exports = { authMiddleware, socketAuthMiddleware }; 