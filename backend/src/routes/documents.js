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

// POST upload POD
router.post('/:orderId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    await db('documents').insert({
      order_id: req.params.orderId,
      type: req.body.type || 'pod',
      file_path: `uploads/documents/${req.file.filename}`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload POD' });
  }
});

module.exports = router;
