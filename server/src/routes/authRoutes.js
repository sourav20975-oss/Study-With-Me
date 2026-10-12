import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../db/store.js';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  const user = store.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  store.update('users', user.id, { lastLoginAt: new Date().toISOString() });

  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/me', authenticate, (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Update User Profile (Name, Avatar Image, Bio, Phone)
router.patch('/profile', authenticate, (req, res) => {
  const { name, avatarUrl, bio, phone } = req.body;
  const user = store.getById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updatedFields = {};
  if (name !== undefined && name.trim()) updatedFields.name = name.trim();
  if (avatarUrl !== undefined) updatedFields.avatarUrl = avatarUrl;
  if (bio !== undefined) updatedFields.bio = bio.trim();
  if (phone !== undefined) updatedFields.phone = phone.trim();

  const updated = store.update('users', req.user.id, updatedFields);

  const token = jwt.sign(
    { id: updated.id, email: updated.email, role: updated.role, name: updated.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const { passwordHash, ...safeUser } = updated;
  res.json({ success: true, token, user: safeUser });
});

// Demo helper to easily switch between tutor and student in testing
router.post('/demo-switch', (req, res) => {
  const { role } = req.body;
  const targetEmail = role === 'admin' ? 'tutor@studysathi.com' : 'student@studysathi.com';
  const user = store.findOne('users', (u) => u.email.toLowerCase() === targetEmail);

  if (!user) {
    return res.status(404).json({ error: 'Demo user not found.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

export default router;
