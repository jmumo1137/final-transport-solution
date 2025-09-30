const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get orders for logged-in driver
router.get('/', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user.userId || req.user.id;  // handle both cases

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID missing in token' });
    }

    const orders = await db('orders')
      .where({ driver_id: driverId })
      .orderBy('created_at', 'desc');

    res.json(orders);
  } catch (err) {
    console.error('Driver orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch driver orders' });
  }
});

module.exports = router;
