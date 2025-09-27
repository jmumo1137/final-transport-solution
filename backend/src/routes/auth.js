// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // your knex instance

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db('users').where({ username }).first();
    if (!user) return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Incorrect password' });

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    // Send token, role, and userId to frontend
    res.json({
      token,
      role: user.role,
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const userRole = role || 'dispatcher'; // default role

  try {
    const existingUser = await db('users').where({ username }).first();
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db('users').insert({
      username,
      password: hashedPassword,
      role: userRole,
    });

    // Fetch user to get correct ID
    const user = await db('users').where({ username }).first();

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Registration successful', token, role: user.role, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
