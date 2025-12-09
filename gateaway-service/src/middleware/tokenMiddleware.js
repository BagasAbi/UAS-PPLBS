const jwt = require('jsonwebtoken');

function verifyBackendToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: token required' });

  const secret = process.env.BACKEND_JWT_SECRET;
  if (!secret) return res.status(500).json({ message: 'Server misconfiguration: BACKEND_JWT_SECRET not set' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    next();
  });
}

module.exports = { verifyBackendToken };
