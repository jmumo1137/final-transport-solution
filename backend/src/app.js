const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Routers
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');
const fuelRouter = require('./routes/fuel');
const mileageRouter = require('./routes/mileage');
const documentsRouter = require('./routes/documents');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');
const driverOrdersRouter = require('./routes/DriverOrders');
const driversRouter = require('./routes/drivers');
const alertsRouter = require('./routes/alerts');
const trucksRouter = require('./routes/trucks');
const trailersRouter = require('./routes/trailers');
const truckTrailerAssignmentsRoutes = require('./routes/truckTrailerAssignments');


const app = express();

// ---------------- Middleware ----------------
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------- Serve uploaded files ----------------
app.use('/uploads/driver', express.static(path.join(__dirname, 'uploads/driver')));
app.use('/uploads/trucks', express.static(path.join(__dirname, 'uploads/trucks')));
app.use('/uploads/trailers', express.static(path.join(__dirname, 'uploads/trailers')));
app.use('/uploads/fuel', express.static(path.join(__dirname, 'uploads/fuel')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));



// ---------------- Mount Routers ----------------
app.use('/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/mileage', mileageRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/driver/orders', driverOrdersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/trucks', trucksRouter);
app.use('/api/trailers', trailersRouter);
app.use('/api/truck-trailer', truckTrailerAssignmentsRoutes);

// ---------------- Webhook ----------------
app.post('/api/webhook/payment', async (req, res) => {
  const { order_id, status } = req.body;
  try {
    const db = require('./db');
    const order = await db('orders').where({ id: order_id }).first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'paid') {
      await db('orders').where({ id: order_id }).update({
        payment_status: 'paid',
        status: 'paid',
        updated_at: new Date().toISOString()
      });
    } else {
      await db('orders').where({ id: order_id }).update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'webhook failed' });
  }
});

// ---------------- Cron Job ----------------
require('./cron/alertsCron');

module.exports = app;
