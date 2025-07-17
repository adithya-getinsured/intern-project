const jwt = require('jsonwebtoken');

// Use a hardcoded secret to ensure consistency between services
const JWT_SECRET = 'your-super-secret-jwt-key-here';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken }; 