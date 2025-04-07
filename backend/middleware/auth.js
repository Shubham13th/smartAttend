const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
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
    
    // Add user info including company details to the request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: '⚠️ User not found' });
    }
    
    req.user.companyId = user.companyId;
    req.user.companyName = user.companyName;
    req.user.name = user.name;
    req.user.email = user.email;
    req.user.role = user.role;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: '⚠️ Invalid token' });
  }
};

module.exports = verifyToken; 