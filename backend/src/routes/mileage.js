const express = require('express');
const db = require('../db');
const { ensureAssigned } = require('../middleware/ensureAssigned');
const router = express.Router();

// Log mileage
router.post('/:orderId/log', ensureAssigned, async (req, res) => {
  const { orderId } = req.params;
  const { start_odometer, end_odometer } = req.body;

  if (start_odometer == null || end_odometer == null) {
    return res.status(400).json({ error: 'start and end odometer required' });
  }
  if (Number(end_odometer) < Number(start_odometer)) {
    return res.status(400).json({ error: 'end_odometer must be >= start_odometer' });
  }

  try {
    await db('mileage').insert({
      order_id: orderId,
      start_odometer: Number(start_odometer),
      end_odometer: Number(end_odometer),
      logged_at: new Date().toISOString()
    });
    await db('orders').where({ id: orderId }).update({ end_odometer: Number(end_odometer), updated_at: new Date().toISOString() });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mileage log failed' });
  }
});

module.exports = router;
