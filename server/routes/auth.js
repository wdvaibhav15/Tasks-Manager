import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manage_tasks_super_secret_key_123';

// Generate JWT token
const generateToken = (res, id) => {
  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
  
  // Save in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check existing
    const existing = await db.users.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set avatar representation (standard initials with a background color)
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const bgColors = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-cyan-600', 'bg-rose-600'];
    const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];
    const avatar = initials || 'EX';

    // Create user
    const newUser = await db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar,
      role: role || 'Member' // Defaults to Member
    });

    const token = generateToken(res, newUser._id);

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Registration failed:', err);
    return res.status(500).json({ error: 'Server registration error' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(res, user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server authentication error' });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  return res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get statistics
    const allProjects = await db.projects.find();
    // Projects created by this user or they are member of
    const userProjects = allProjects.filter(p => p.owner._id === req.user.id || (p.members || []).some(m => m._id === req.user.id));
    
    const allTasks = await db.tasks.find();
    const assignedTasks = allTasks.filter(t => t.assignedTo?._id === req.user.id);

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      stats: {
        projectsCount: userProjects.length,
        tasksCount: assignedTasks.length
      }
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, avatar, password, newPassword } = req.body;
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (avatar) updateData.avatar = avatar;

    // Handle password change
    if (password && newPassword) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await db.users.findByIdAndUpdate(req.user.id, updateData);

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server profile update error' });
  }
});

// @route   GET /api/auth/users (for team selection)
router.get('/users', protect, async (req, res) => {
  try {
    const list = await db.users.find();
    const safeUsers = list.map(u => ({
      id: u._id,
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role
    }));
    return res.json(safeUsers);
  } catch (err) {
    console.error('Get users failed:', err);
    return res.status(500).json({ error: 'Server users lookup error' });
  }
});

export default router;
