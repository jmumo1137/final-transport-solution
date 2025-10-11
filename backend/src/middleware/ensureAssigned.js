const db = require('../db');

async function ensureAssigned(req, res, next) {
  const { orderId } = req.params;
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (!order.truck_id || !order.driver_id || !order.waybill) {
    return res.status(400).json({ error: 'Order not fully assigned: vehicle, driver, and waybill required' });
  }

  req.order = order;
  next();
}

module.exports = { ensureAssigned };
