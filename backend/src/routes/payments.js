const express = require('express');
const db = require('../db');
const router = express.Router();

// Create invoice / request payment
router.post('/:orderId/invoice', async (req, res) => {
  const { orderId } = req.params;
  const { amount } = req.body;

  try {
    await db('payments').insert({
      order_id: orderId,
      amount: Number(amount),
      method: 'invoice',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    await db('orders').where({ id: orderId }).update({
      invoice_amount: Number(amount),
      status: 'invoiced',
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Invoice creation failed' });
  }
});

// Confirm payment (or simulate webhook)
router.post('/:orderId/confirm', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'paid' or 'pending'

  try {
    await db('payments').where({ order_id: orderId }).update({ status });
    if (status === 'paid') {
      await db('orders').where({ id: orderId }).update({ payment_status: 'paid', status: 'paid', updated_at: new Date().toISOString() });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

module.exports = router;
