// src/routes/mileage.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// ---------- LOG MILEAGE ----------
router.post('/:id', async (req, res) => {
  const orderId = req.params.id;
  const { start_odometer, end_odometer, quantity_delivered } = req.body;

  if (end_odometer == null)
    return res.status(400).json({ message: 'End odometer is required.' });

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const startValue = parseFloat(start_odometer ?? order.start_odometer ?? 0);
    const endValue = parseFloat(end_odometer);

    if (endValue < startValue)
      return res.status(400).json({ message: 'End odometer cannot be less than start.' });

    // Save record
    await db('mileage').insert({
      order_id: orderId,
      start_odometer: startValue,
      end_odometer: endValue,
      logged_at: new Date().toISOString(), // ✅ prevent invalid date
    });

    // Determine lifecycle progression
    let newStatus = order.status;
    if (order.status === 'loaded') newStatus = 'enroute';
    else if (order.status === 'enroute') newStatus = 'delivered';

    // Prepare order update object
    const updateData = {
      start_odometer: startValue,
      end_odometer: endValue,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If delivered, add quantity_delivered
    if (newStatus === 'delivered' && quantity_delivered != null) {
      updateData.quantity_delivered = quantity_delivered;
      updateData.delivered_at = new Date().toISOString(); // ✅ valid timestamp
    }

    await db('orders').where({ id: orderId }).update(updateData);

    res.json({
      message: `Mileage logged successfully. Order now ${newStatus}.`,
      details: updateData,
    });
  } catch (err) {
    console.error('❌ Mileage log error:', err);
    res.status(500).json({ message: 'Failed to log mileage', error: err.message });
  }
});

// ---------- GET MILEAGE RECORDS ----------
router.get('/:id', async (req, res) => {
  try {
    const records = await db('mileage')
      .where({ order_id: req.params.id })
      .orderBy('logged_at', 'desc');
    res.json(records);
  } catch (err) {
    console.error('❌ Fetch mileage error:', err);
    res.status(500).json({ message: 'Failed to fetch mileage', error: err.message });
  }
});

module.exports = router;
