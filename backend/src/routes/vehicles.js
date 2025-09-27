const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await db('vehicles').select('*').orderBy('id', 'asc');
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

module.exports = router;
