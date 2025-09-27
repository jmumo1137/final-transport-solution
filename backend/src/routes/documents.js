const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { ensureAssigned } = require('../middleware/ensureAssigned');
const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// Upload POD
router.post('/:orderId/pod', ensureAssigned, upload.single('pod'), async (req, res) => {
  const { orderId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'POD file required' });

  const file_path = `/uploads/${req.file.filename}`;

  try {
    await db('documents').insert({ order_id: orderId, type: 'POD', file_path, uploaded_at: new Date().toISOString() });
    await db('orders').where({ id: orderId }).update({ status: 'delivered', updated_at: new Date().toISOString() });
    res.json({ ok: true, file_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'POD upload failed' });
  }
});

module.exports = router;
