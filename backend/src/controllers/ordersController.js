// src/controllers/ordersController.js
const db = require('../db');
const { format } = require('date-fns');

// ---------- WAYBILL ----------
function generateWaybill() {
  const date = format(new Date(), 'yyyyMMddHHmmss');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WB-${date}-${random}`;
}

// ---------- CREATE ----------
async function createOrder(req, res) {
  try {
    const { customer_name, pickup, destination } = req.body;
    if (!customer_name || !pickup || !destination)
      return res.status(400).json({ message: 'Customer, pickup, and destination are required.' });

    const userId = req.user?.id; // from authenticateToken
    const waybill = generateWaybill();

    const [id] = await db('orders').insert({
      customer_name,
      pickup,
      destination,
      waybill,
      status: 'created',
      created_by: userId || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    const order = await db('orders').where({ id }).first();
    res.status(201).json(order);
  } catch (error) {
    console.error('❌ createOrder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ---------- LIST (role-based filter) ----------
async function listOrders(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let query = db('orders').orderBy('created_at', 'desc');

    if (role === 'consignee') {
      query = query.where('created_by', userId);
    }

    const orders = await query;
    res.json(orders);
  } catch (error) {
    console.error('❌ listOrders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


// ✅ Assign Order (Fixed)
async function assignOrder(req, res) {
  try {
    const orderId = Number(req.params.id);
    const { driver_id, truck_id, trailer_id } = req.body;

    console.log("🚚 Incoming body:", req.body);

    if (!driver_id || !truck_id)
      return res.status(400).json({ error: "Driver and Truck are required." });

    // 🚛 Find truck by PLATE NUMBER (not ID)
    console.log("🔍 Checking truck plate:", truck_id);
    const truck = await db("trucks").where({ plate_number: truck_id }).first();
    console.log("✅ Truck fetched:", truck);

    if (!truck)
      return res.status(400).json({ error: `Truck with plate ${truck_id} not found.` });

    // 🚚 Find trailer by PLATE NUMBER (if provided)
    let trailer = null;
    if (trailer_id) {
      console.log("🔍 Checking trailer plate:", trailer_id);
      trailer = await db("trailers").where({ plate_number: trailer_id }).first();
      console.log("✅ Trailer fetched:", trailer);

      if (!trailer)
        return res.status(400).json({ error: `Trailer with plate ${trailer_id} not found.` });
    }

    // 🧩 Compliance Checks
    const reasons = [];
    const now = new Date();

    if (truck.insurance_expiry_date && new Date(truck.insurance_expiry_date) < now)
      reasons.push("Truck insurance expired");
    if (truck.inspection_expiry_date && new Date(truck.inspection_expiry_date) < now)
      reasons.push("Truck inspection expired");

    if (trailer) {
      if (trailer.insurance_expiry_date && new Date(trailer.insurance_expiry_date) < now)
        reasons.push("Trailer insurance expired");
      if (trailer.inspection_expiry_date && new Date(trailer.inspection_expiry_date) < now)
        reasons.push("Trailer inspection expired");
    }

    if (reasons.length > 0) {
      console.log("❌ Compliance failed reasons:", reasons);
      return res.status(400).json({ allowed: false, reasons });
    }

    // ✅ Update order with correct numeric IDs
    await db("orders").where({ id: orderId }).update({
      driver_id,
      truck_id: truck.truck_id,
      trailer_id: trailer ? trailer.trailer_id : null,
      status: "assigned",
      updated_at: db.fn.now(),
    });

    console.log("✅ Order assigned successfully!");
    res.json({ ok: true, message: "Order assigned successfully." });
  } catch (err) {
    console.error("❌ assignOrder Error:", err);
    res.status(500).json({ error: "Failed to assign order." });
  }
}

// ---------- LOAD ----------
async function markLoaded(req, res) {
  try {
    const orderId = Number(req.params.id);
    const { quantity_loaded } = req.body;

    if (quantity_loaded == null || quantity_loaded <= 0)
      return res.status(400).json({ message: 'Quantity loaded must be greater than zero.' });

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Validation: must have driver + truck; trailer optional
    if (!order.driver_id || !order.truck_id)
      return res.status(400).json({ message: 'Driver and Truck must be assigned before loading.' });

    if (order.status !== 'assigned')
      return res.status(400).json({ message: 'Only assigned orders can be marked as loaded.' });

    await db('orders')
      .where({ id: orderId })
      .update({
        quantity_loaded,
        status: 'loaded',
        loaded_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

    res.json({ message: 'Order marked as loaded successfully.' });
  } catch (err) {
    console.error('❌ markLoaded:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ---------- CASH SPENT ----------
async function updateCashSpent(req, res) {
  try {
    const { id } = req.params;
    const { cash_spent } = req.body;

    if (cash_spent == null || cash_spent < 0)
      return res.status(400).json({ message: 'Cash spent must be provided and >= 0.' });

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    await db('orders')
      .where({ id })
      .update({
        cash_spent,
        updated_at: db.fn.now(),
      });

    res.json({ message: 'Cash spent updated successfully.' });
  } catch (err) {
    console.error('❌ updateCashSpent:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/fuel_receipts/'),
  filename: (req, file, cb) =>
    cb(null, `fuel_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ---------- FUEL LOG ----------
async function addFuelRecord(req, res) {
  try {
    const { id } = req.params; // order_id
    const { liters, cost } = req.body;

    if (!liters || !cost || !req.file)
      return res.status(400).json({ message: 'Receipt, liters, and cost are required.' });

    await db('fuel').insert({
      order_id: id,
      file_path: req.file.filename,
      liters,
      cost,
      uploaded_at: db.fn.now(),
    });

    res.json({ message: 'Fuel record saved successfully.' });
  } catch (err) {
    console.error('❌ addFuelRecord:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ---------- GENERIC STATUS HANDLER ----------
async function updateOrderStatus(req, res, newStatus, timeField = null) {
  try {
    const { id } = req.params;
    console.log(`🚦 Incoming update for Order ID: ${id}, target status: ${newStatus}, timeField: ${timeField}`);

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const validFlow = {
      created: 'assigned',
      assigned: 'loaded',
      loaded: 'enroute',
      enroute: 'delivered',
      pod_uploaded: 'delivered',
      delivered: 'awaiting_payment',
      awaiting_payment: 'paid',
      paid: 'closed',
    };

    if (order.status === newStatus && timeField) {
      const deliveredAt = req.body.delivered_at || new Date().toISOString();
      const updateData = { [timeField]: deliveredAt, updated_at: new Date().toISOString() };
      await db('orders').where({ id }).update(updateData);
      const updatedOrder = await db('orders').where({ id }).first();
      return res.json(updatedOrder);
    }

    if (validFlow[order.status] !== newStatus) {
      return res
        .status(400)
        .json({ message: `Invalid status transition from ${order.status} → ${newStatus}` });
    }

    if (newStatus === 'delivered') {
      console.log('📦 Checking POD + fuel/mileage before marking delivered...');
      const pod = await db('documents')
        .where({ order_id: id, type: 'pod' }) 
        .first();
      if (!pod)
        return res.status(400).json({ message: 'POD must be uploaded before marking as delivered.' });

      const [fuelCount] = await db('fuel').where({ order_id: id }).count({ c: '*' });
      const [mileageCount] = await db('mileage').where({ order_id: id }).count({ c: '*' });

      if (Number(fuelCount.c) === 0)
        return res.status(400).json({ message: 'At least one fuel record required before delivery.' });
      if (Number(mileageCount.c) === 0)
        return res.status(400).json({ message: 'Mileage record required before delivery.' });
    }

    const updateData = { status: newStatus, updated_at: new Date().toISOString() };
    if (timeField) updateData[timeField] = new Date().toISOString();

    await db('orders').where({ id }).update(updateData);
    const updatedOrder = await db('orders').where({ id }).first();

    res.json(updatedOrder);
  } catch (error) {
    console.error(`❌ updateOrderStatus ${newStatus}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


// ---------- WRAPPERS ----------
const markEnroute = (req, res) => updateOrderStatus(req, res, 'enroute');
const markDelivered = (req, res) => updateOrderStatus(req, res, 'delivered', 'delivered_at');
const markAwaitingPayment = (req, res) => updateOrderStatus(req, res, 'awaiting_payment');
const markPaid = (req, res) => updateOrderStatus(req, res, 'paid', 'payment_date');
const closeOrder = (req, res) => updateOrderStatus(req, res, 'closed', 'closed_at');

// ---------- EXPORT ----------
module.exports = {
  createOrder,
  listOrders,
  assignOrder,
  markLoaded,
  markEnroute,
  markDelivered,
  markAwaitingPayment,
  markPaid,
  closeOrder,
  updateCashSpent,
  upload,
  addFuelRecord,
};
