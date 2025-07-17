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
    
    // Allow service-to-service communication
    if (decoded.isServiceToken) {
      console.log(`Service token authentication: ${decoded.service}`);
      req.isServiceRequest = true;
      req.serviceInfo = decoded;
      next();
      return;
    }
    
    // Regular user authentication
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authMiddleware; 