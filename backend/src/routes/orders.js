const express = require('express');
const db = require('../db'); // knex instance
const router = express.Router();

// ===================== CREATE ORDER =====================
router.post('/', async (req, res) => {
  const { customer_name, pickup, destination, driver_username } = req.body;

  if (!customer_name || !pickup || !destination) {
    return res.status(400).json({ error: 'Customer, pickup, and destination are required' });
  }

  try {
    let driverId = null;

    if (driver_username) {
      const driver = await db('users')
        .where({ username: driver_username, role: 'driver' })
        .first();

      if (!driver) return res.status(400).json({ error: 'Driver not found' });
      driverId = driver.id;
    }

    const insertData = {
      customer_name,
      pickup,
      destination,
      driver_id: driverId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'created',
    };

    const [id] = await db('orders').insert(insertData);
    const waybill = `WB-${Date.now()}-${id}`;
    await db('orders').where({ id }).update({ waybill });

    const order = await db('orders').where({ id }).first();
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Create order failed', details: err.message });
  }
});

// ===================== LIST ORDERS =====================
router.get('/', async (req, res) => {
  try {
    const list = await db('orders').select('*').orderBy('id', 'desc');
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ===================== DRIVER SEARCH =====================
router.get('/drivers', async (req, res) => {
  const { search } = req.query;
  try {
    let query = db('users').where({ role: 'driver' });
    if (search) query = query.andWhere('username', 'like', `%${search}%`);
    const drivers = await query.select('id', 'username');
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// ===================== ASSIGN DRIVER & VEHICLE =====================
router.post('/:orderId/assign', async (req, res) => {
  const { orderId } = req.params;
  const { driver_username, vehicle_id } = req.body;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const driver = await db('users').where({ username: driver_username, role: 'driver' }).first();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Auto-generate waybill if not already set
    const waybill = order.waybill || `WB-${Date.now()}-${order.id}`;

    await db('orders').where({ id: orderId }).update({
      driver_id: driver.id,
      vehicle_id: vehicle_id || null,
      status: 'assigned',
      waybill,
      updated_at: new Date().toISOString()
    });

    const updated = await db('orders').where({ id: orderId }).first();
    res.json(updated);
  } catch (err) {
    console.error('Assign route error:', err);
    res.status(500).json({ error: 'Assign failed' });
  }
});

// ===================== MARK LOADED =====================
router.post('/:orderId/loaded', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.driver_id || !order.vehicle_id || !order.waybill) {
      return res.status(400).json({ error: 'Driver, vehicle, and waybill required' });
    }

    await db('orders').where({ id: orderId }).update({
      status: 'loaded',
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true, message: 'Order marked as loaded' });
  } catch (err) {
    console.error('Mark loaded error:', err);
    res.status(500).json({ error: 'Failed to mark loaded' });
  }
});
// ===================== MARK DELIVERED =====================
router.post('/:orderId/delivered', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status.toLowerCase() !== 'enroute') {
      return res.status(400).json({ error: 'Order must be enroute before marking delivered' });
    }

    // Optional: you can check if POD is uploaded here if your system requires it
    // e.g. if (!order.pod) return res.status(400).json({ error: 'POD is required before delivery' });

    await db('orders').where({ id: orderId }).update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true, message: 'Order marked as delivered' });
  } catch (err) {
    console.error('Mark delivered error:', err);
    res.status(500).json({ error: 'Failed to mark delivered' });
  }
});


// ===================== MARK ENROUTE =====================
router.post('/:orderId/enroute', async (req, res) => {
  const { orderId } = req.params;
  const { start_odometer } = req.body;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.status || order.status.toLowerCase() !== 'loaded') {
      return res.status(400).json({ error: 'Order must be loaded before starting transport' });
    }

    await db('orders').where({ id: orderId }).update({
      status: 'enroute',
      start_odometer: start_odometer || order.start_odometer,
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true, message: 'Order marked as enroute' });
  } catch (err) {
    console.error('Mark enroute error:', err);
    res.status(500).json({ error: 'Failed to mark enroute' });
  }
});
// ===================== MARK AWAITING PAYMENT =====================
router.post('/:orderId/awaiting-payment', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Order must be delivered before awaiting payment' });
    }

    await db('orders').where({ id: orderId }).update({
      status: 'awaiting_payment',
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Awaiting payment error:', err);
    res.status(500).json({ error: 'Failed to mark awaiting payment' });
  }
});


// ===================== MARK AS PAID =====================
router.post('/:orderId/paid', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'awaiting_payment') {
      return res.status(400).json({ error: 'Order must be awaiting payment before marking paid' });
    }

    await db('orders').where({ id: orderId }).update({
      status: 'paid',
      payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mark paid error:', err);
    res.status(500).json({ error: 'Failed to mark paid' });
  }
});

// ===================== CLOSE ORDER =====================
router.post('/:orderId/close', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Order must be paid before closing' });
    }

    await db('orders').where({ id: orderId }).update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Close order error:', err);
    res.status(500).json({ error: 'Failed to close order' });
  }
});


// ===================== GET SINGLE ORDER =====================
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
