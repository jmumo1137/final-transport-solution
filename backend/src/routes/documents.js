const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Define upload folder relative to this file
const uploadFolder = path.join(__dirname, '../uploads/documents');

// Ensure the folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    // Save with timestamp + original name
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/\s+/g, '_'); // replace spaces
    cb(null, `${timestamp}-${sanitizedFilename}`);
  },
});

const upload = multer({ storage });

// GET uploaded documents for an order
router.get('/:orderId', async (req, res) => {
  try {
    const docs = await db('documents').where({ order_id: req.params.orderId });
    res.json(docs);
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST upload POD + quantity delivered
router.post('/:orderId', upload.single('file'), async (req, res) => {
  try {
    const { quantity_delivered } = req.body;

    if (!req.file) return res.status(400).json({ error: 'File is required' });

    // Insert document record
    await db('documents').insert({
      order_id: req.params.orderId,
      type: req.body.type || 'pod',
      file_path: `uploads/documents/${req.file.filename}`, // path used in frontend
      uploaded_at: new Date(),
    });

    // Update order quantity if provided
    if (quantity_delivered) {
      await db('orders')
        .where({ id: req.params.orderId })
        .update({ quantity_delivered: Number(quantity_delivered) });
    }
        // 🟢 Update order status to indicate POD uploaded / ready for delivery mark
    await db('orders')
      .where({ id: req.params.orderId })
      .update({ status: 'pod_uploaded' }); 

    res.json({ ok: true });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload POD' });
  }
});

module.exports = router;
