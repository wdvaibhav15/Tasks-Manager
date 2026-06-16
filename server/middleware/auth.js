import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'manage_tasks_super_secret_key_123';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await db.users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    // Attach to request
    req.user = {
      id: user._id || user.id,
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('Authentication check failed:', err);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `User role '${req.user?.role || 'Guest'}' is not authorized to perform this action` });
    }
    next();
  };
};
