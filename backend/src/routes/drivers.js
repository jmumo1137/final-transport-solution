// routes/drivers.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// -------------------- Multer File Upload Setup --------------------
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// -------------------- CRUD ROUTES --------------------

// GET all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await db('drivers').select('*');
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET single driver
router.get('/:id', async (req, res) => {
  try {
    const driver = await db('drivers').where({ driver_id: req.params.id }).first();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// CREATE driver
router.post('/', upload.fields([
  { name: 'license_file' },
  { name: 'passport_photo' },
  { name: 'good_conduct_certificate' },
  { name: 'port_pass' }
]), async (req, res) => {
  try {
    const { full_name, username, license_number, license_expiry_date } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Full name is required' });

    const files = req.files;
    const newDriver = {
      full_name,
      username: username || null,
      license_number: license_number || null,
      license_expiry_date: license_expiry_date || null,
      license_file: files?.license_file?.[0]?.filename || null,
      passport_photo: files?.passport_photo?.[0]?.filename || null,
      good_conduct_certificate: files?.good_conduct_certificate?.[0]?.filename || null,
      port_pass: files?.port_pass?.[0]?.filename || null
    };

    const [driver_id] = await db('drivers').insert(newDriver);
    res.status(201).json({ driver_id, ...newDriver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// UPDATE driver
router.put('/:id', upload.fields([
  { name: 'license_file' },
  { name: 'passport_photo' },
  { name: 'good_conduct_certificate' },
  { name: 'port_pass' }
]), async (req, res) => {
  try {
    const { full_name, username, license_number, license_expiry_date } = req.body;
    const files = req.files;

    const updatedDriver = {
      full_name,
      username: username || null,
      license_number: license_number || null,
      license_expiry_date: license_expiry_date || null,
      updated_at: new Date().toISOString()
    };

    // Update file paths if new files uploaded
    if (files?.license_file) updatedDriver.license_file = files.license_file[0].filename;
    if (files?.passport_photo) updatedDriver.passport_photo = files.passport_photo[0].filename;
    if (files?.good_conduct_certificate) updatedDriver.good_conduct_certificate = files.good_conduct_certificate[0].filename;
    if (files?.port_pass) updatedDriver.port_pass = files.port_pass[0].filename;

    const count = await db('drivers').where({ driver_id: req.params.id }).update(updatedDriver);
    if (!count) return res.status(404).json({ error: 'Driver not found' });

    res.json({ driver_id: req.params.id, ...updatedDriver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// DELETE driver
router.delete('/:id', async (req, res) => {
  try {
    const count = await db('drivers').where({ driver_id: req.params.id }).del();
    if (!count) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// GET driver stats (total & expiring soon)
router.get('/stats', async (req, res) => {
  try {
    const total = await db('drivers').count('driver_id as count').first();

    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);

    const expiringSoon = await db('drivers')
      .whereBetween('license_expiry_date', [today.toISOString().split('T')[0], thirtyDays.toISOString().split('T')[0]])
      .count('driver_id as count')
      .first();

    res.json({ total: total.count, expiringSoon: expiringSoon.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
