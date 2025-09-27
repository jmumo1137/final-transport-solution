const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db'); // your working db

// Storage config
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/fuel'); // make sure folder exists
  },
  filename: function(req, file, cb) {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({ storage });

// POST /api/fuel/:orderId
router.post('/:orderId', upload.single('file'), async (req, res) => {
  try {
    const { liters, cost } = req.body;
    const orderId = req.params.orderId;

    if (!req.file) return res.status(400).json({ error: 'File missing' });

    const filePath = req.file.path;

    await db('fuel').insert({
      order_id: orderId,
      file_path: filePath,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      uploaded_at: new Date().toISOString(),
    });

    res.json({ ok: true, message: 'Fuel uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;
