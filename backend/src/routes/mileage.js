const express = require('express');
const router = express.Router();
const db = require('../db'); // your DB instance

// POST /api/mileage/:orderId
router.post('/:orderId', async (req, res) => {
  const { start_odometer, end_odometer } = req.body;
  const { orderId } = req.params;

  if (start_odometer === undefined || end_odometer === undefined) {
    return res.status(400).json({ error: 'Start and End odometer are required' });
  }

  if (end_odometer < start_odometer) {
    return res.status(400).json({ error: 'End odometer must be >= start odometer' });
  }

  try {
    const result = await db('mileage').insert({
      order_id: orderId,
      start_odometer,
      end_odometer,
      logged_at: new Date()
    });

    res.json({ ok: true, mileageId: result[0] });
  } catch (err) {
    console.error('Mileage insert error:', err);
    res.status(500).json({ error: 'Failed to log mileage' });
  }
});

module.exports = router;
