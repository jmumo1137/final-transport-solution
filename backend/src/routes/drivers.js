const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');
const multer = require('multer');
const path = require('path');

// Multer storage for driver files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/driver')); // backend/uploads/driver
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
router.get('/:id', driversController.getDriver);
router.put('/:id', upload.fields([
  { name: 'license_file' },
  { name: 'passport_photo' },
  { name: 'good_conduct_certificate' },
  { name: 'port_pass' }
]), driversController.updateDriver);

module.exports = router;
