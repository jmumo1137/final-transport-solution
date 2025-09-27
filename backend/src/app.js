const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');
const vehiclesRouter = require('./routes/vehicles');
const fuelRouter = require('./routes/fuel');
const mileageRouter = require('./routes/mileage');
const documentsRouter = require('./routes/documents');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');

const app = express();

// Enable CORS for frontend
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/auth', authRouter);            // /auth/login, /auth/register
app.use('/api/orders', ordersRouter);    // all order routes
// app.use('/users', usersRouter);          // driver search
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/mileage', mileageRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/payments', paymentsRouter);

// Webhook endpoint
app.post('/api/webhook/payment', async (req, res) => {
  const { order_id, status } = req.body;
  try {
    const db = require('./db');
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

module.exports = app;
