// src/routes/fuel.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

// Ensure upload folder exists
const uploadFolder = path.join(__dirname, '../uploads/fuel');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadFolder),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/**
 * POST /api/fuel/:id
 * Upload fuel receipt + liters + cost
 */
router.post('/:id', upload.single('fuel_receipt'), async (req, res) => {
  const orderId = req.params.id;
  const { liters, cost, cash_spent } = req.body;

  if (!req.file) return res.status(400).json({ message: 'Fuel receipt is required' });
  if (!liters || !cost) return res.status(400).json({ message: 'Liters and cost are required' });

  try {
    const totalCost = parseFloat(liters) * parseFloat(cost);

    const fuelData = {
      order_id: orderId,
      file_path: `/uploads/fuel/${req.file.filename}`,
      liters: parseFloat(liters),
      cost: totalCost,
      uploaded_at: new Date().toISOString(),
    };

    await db('fuel').insert(fuelData);

    // Update cash spent
    const current = await db('orders').where({ id: orderId }).first('cash_spent');
    const newTotal = parseFloat(current?.cash_spent || 0) + (parseFloat(cash_spent || 0) + totalCost);

    await db('orders').where({ id: orderId }).update({
      cash_spent: newTotal,
      updated_at: new Date().toISOString(),
    });

    res.json({ message: '✅ Fuel record saved', fuel: fuelData, newTotal });
  } catch (err) {
    console.error('❌ Fuel upload error:', err);
    res.status(500).json({ message: 'Failed to upload fuel', error: err.message });
  }
});

/**
 * GET /api/fuel/:id
 * Fetch fuel logs for order
 */
router.get('/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const fuelRecords = await db('fuel')
      .where({ order_id: orderId })
      .orderBy('uploaded_at', 'desc');

    const order = await db('orders').where({ id: orderId }).first();

    res.json({ fuelRecords, cashSpent: order?.cash_spent || 0 });
  } catch (err) {
    console.error('❌ Fetch fuel records error:', err);
    res.status(500).json({ message: 'Failed to fetch fuel records' });
  }
});

module.exports = router;
