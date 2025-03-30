const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '⚠️ No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Expects 'Bearer <token>'
  if (!token) {
    return res.status(403).json({ error: '⚠️ Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '⚠️ Invalid token' });
  }
};

module.exports = verifyToken; 