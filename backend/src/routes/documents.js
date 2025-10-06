const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db'); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// GET uploaded documents for an order
router.get('/:orderId', async (req, res) => {
  try {
    const docs = await db('documents').where({ order_id: req.params.orderId });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST upload POD + quantity delivered
router.post('/:orderId', upload.single('file'), async (req, res) => {
  try {
    const { quantity_delivered } = req.body;

    if (!req.file) return res.status(400).json({ error: 'File is required' });

    // 1️⃣ Insert document record
    await db('documents').insert({
      order_id: req.params.orderId,
      type: req.body.type || 'pod',
      file_path: `uploads/documents/${req.file.filename}`,
      uploaded_at: new Date(),
    });

    // 2️⃣ Update quantity delivered in orders table if provided
    if (quantity_delivered) {
      await db('orders')
        .where({ id: req.params.orderId })
        .update({ quantity_delivered: Number(quantity_delivered) });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload POD' });
  }
});

module.exports = router;
