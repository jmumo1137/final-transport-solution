const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');
const multer = require('multer');
const path = require('path');

// Multer setup for single file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/driver');
    fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
router.get('/:id', driversController.getDriver);

// Single file upload or license number update
router.put('/:id', upload.single('file'), driversController.updateDriver);

module.exports = router;
