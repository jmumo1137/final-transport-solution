const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { ensureAssigned } = require('../middleware/ensureAssigned');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });
const router = express.Router();

// Upload fuel receipt
router.post('/:orderId/upload', ensureAssigned, upload.single('fuel'), async (req, res) => {
  const { orderId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'Fuel file required' });
  const { liters, cost } = req.body;
  if (!liters || !cost) return res.status(400).json({ error: 'Liters and cost required' });

  const file_path = `/uploads/${req.file.filename}`;

  try {
    await db('fuel').insert({
      order_id: orderId,
      file_path,
      liters: Number(liters),
      cost: Number(cost),
      uploaded_at: new Date().toISOString()
    });
    res.json({ ok: true, file_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fuel upload failed' });
  }
});

module.exports = router;
