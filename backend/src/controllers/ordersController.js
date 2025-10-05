const db = require('../db');
const { format } = require('date-fns');

// Generate a unique waybill
function generateWaybill() {
  const date = format(new Date(), 'yyyyMMddHHmmss');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WB-${date}-${random}`;
}

// -------- CREATE NEW ORDER --------
async function createOrder(req, res) {
  try {
    const { customer_name, pickup, destination } = req.body;
    const consignee_id = req.user.id; // logged-in user

    if (!customer_name || !pickup || !destination) {
      return res.status(400).json({ message: 'Customer, pickup and destination are required' });
    }

    const waybill = generateWaybill();

    const insertedIds = await db('orders').insert({
      customer_name,
      pickup,
      destination,
      consignee_id,
      waybill,
      status: 'created',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    const id = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
    const order = await db('orders').where({ id }).first();

    res.status(201).json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// -------- LIST ORDERS (WITH CONSIGNEE FILTER) --------
async function listOrders(req, res) {
  try {
    const user = req.user;
    let orders;

    if (user.role === 'consignee') {
      orders = await db('orders')
        .where({ consignee_id: user.id })
        .orderBy('created_at', 'desc');
    } else {
      orders = await db('orders').orderBy('created_at', 'desc');
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// -------- ASSIGN DRIVER + TRUCK + TRAILER --------
async function assignOrder(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { driver_id, truck_id, trailer_id } = req.body;

    if (!driver_id || !truck_id) {
      return res.status(400).json({ error: 'Driver and Truck are required.' });
    }

    const driver = await db('users').where({ id: driver_id, role: 'driver' }).first();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const activeStatuses = ['assigned', 'loaded', 'enroute'];
    const truckConflict = await db('orders').where({ truck_id }).whereIn('status', activeStatuses).first();
    if (truckConflict) return res.status(400).json({ error: 'Truck is already assigned to another order.' });

    if (trailer_id) {
      const trailerConflict = await db('orders').where({ trailer_id }).whereIn('status', activeStatuses).first();
      if (trailerConflict) return res.status(400).json({ error: 'Trailer is already assigned to another order.' });
    }

    await db('orders').where({ id: orderId }).update({
      driver_id,
      truck_id: parseInt(truck_id, 10),
      trailer_id: trailer_id ? parseInt(trailer_id, 10) : null,
      status: 'assigned',
      updated_at: db.fn.now(),
    });

    res.json({ ok: true, message: 'Order assigned successfully.' });
  } catch (err) {
    console.error('❌ assignOrder error:', err);
    res.status(500).json({ error: 'Failed to assign order.' });
  }
}

// -------- UPDATE ORDER STATUS WITH VALIDATIONS --------
async function updateOrderStatus(req, res, newStatus, timeField = null) {
  try {
    const { id } = req.params;
    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // DRIVER VALIDATIONS
    if (newStatus === 'loaded' && (!order.truck_id || !order.driver_id)) {
      return res.status(400).json({ message: 'Cannot mark loaded: truck or driver missing.' });
    }
    if (newStatus === 'enroute' && order.status !== 'loaded') {
      return res.status(400).json({ message: 'Cannot start enroute: order not loaded.' });
    }
    if (newStatus === 'delivered' && !order.pod_file) {
      return res.status(400).json({ message: 'Cannot deliver: POD not uploaded.' });
    }

    const updateData = { status: newStatus, updated_at: db.fn.now() };
    if (timeField) updateData[timeField] = db.fn.now();

    await db('orders').where({ id }).update(updateData);
    const updatedOrder = await db('orders').where({ id }).first();
    res.json(updatedOrder);

  } catch (error) {
    console.error(`❌ Error updating order to ${newStatus}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// -------- STATUS ENDPOINTS --------
const markLoaded = (req, res) => updateOrderStatus(req, res, 'loaded', 'loaded_at');
const markEnroute = (req, res) => updateOrderStatus(req, res, 'enroute');
const markDelivered = (req, res) => updateOrderStatus(req, res, 'delivered', 'delivered_at');
const markAwaitingPayment = (req, res) => updateOrderStatus(req, res, 'awaiting_payment');
const markPaid = (req, res) => updateOrderStatus(req, res, 'paid', 'payment_date');
const closeOrder = (req, res) => updateOrderStatus(req, res, 'closed', 'closed_at');

module.exports = {
  createOrder,
  assignOrder,
  listOrders,
  markLoaded,
  markEnroute,
  markDelivered,
  markAwaitingPayment,
  markPaid,
  closeOrder
};
