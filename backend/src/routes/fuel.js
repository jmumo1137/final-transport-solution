// src/routes/fuel.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db'); // Knex instance
const fs = require('fs');

const router = express.Router();

// Ensure upload folder exists
const uploadFolder = path.join(__dirname, '../uploads/fuel');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// ===================== UPLOAD FUEL =====================
router.post('/:id/fuel', upload.single('fuel_receipt'), async (req, res) => {
  const orderId = req.params.id;
  const { liters, cost } = req.body;

  try {
    if (!req.file) return res.status(400).json({ message: 'Fuel receipt is required' });
    if (!liters || !cost) return res.status(400).json({ message: 'Liters and cost are required' });

    // Insert into fuel table
    const insertData = {
      order_id: orderId,
      file_path: `/uploads/fuel/${req.file.filename}`,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      uploaded_at: new Date().toISOString()
    };

    await db('fuel').insert(insertData);

    // Optionally update cash spent in orders table
    const cashSpent = parseFloat(req.body.cash_spent || 0);
    if (cashSpent > 0) {
      await db('orders').where({ id: orderId }).update({ cash_spent: cashSpent });
    }

    res.json({ message: 'Fuel uploaded successfully', fuel: insertData });
  } catch (err) {
    console.error('Fuel upload error:', err);
    res.status(500).json({ message: 'Failed to upload fuel', error: err.message });
  }
});

// ===================== GET FUEL RECORDS =====================
router.get('/:id/fuel', async (req, res) => {
  const orderId = req.params.id;
  try {
    const fuelRecords = await db('fuel')
      .where({ order_id: orderId })
      .orderBy('uploaded_at', 'desc');

    const order = await db('orders').where({ id: orderId }).first();

    res.json({ fuelRecords, cashSpent: order?.cash_spent || 0 });
  } catch (err) {
    console.error('Fetch fuel records error:', err);
    res.status(500).json({ message: 'Failed to fetch fuel records' });
  }
});

module.exports = router;
