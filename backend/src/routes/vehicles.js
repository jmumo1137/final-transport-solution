// backend/src/routes/vehicles.js
const express = require('express');
const router = express.Router();
const db = require('../dB'); 

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await db('vehicles').select('*');
    res.json(vehicles);
  } catch (err) {
    console.error('Fetch vehicles error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST a new vehicle
router.post('/', async (req, res) => {
  const { reg_number, model, current_odometer } = req.body;

  if (!reg_number || !model || current_odometer == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [id] = await db('vehicles').insert({
      reg_number,
      model,
      current_odometer
    });
    res.json({ ok: true, id, reg_number, model, current_odometer });
  } catch (err) {
    console.error('Add vehicle error:', err);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

module.exports = router;
