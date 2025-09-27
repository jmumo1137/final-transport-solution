const express = require('express');
const router = express.Router();
const db = require('../db');

// Get orders assigned to a driver
router.get('/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
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
