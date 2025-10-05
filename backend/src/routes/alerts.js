// routes/alerts.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET alerts by entity type (optional filter)
router.get('/:entity_type/:entity_id', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await db.query(
      'SELECT * FROM alerts WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entity_type, entity_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching alerts by entity:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Update alert status (resolve/dismiss)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query(
      'UPDATE alerts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE alert_id = $2',
      [status, id]
    );
    res.json({ message: 'Alert updated' });
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

module.exports = router;
