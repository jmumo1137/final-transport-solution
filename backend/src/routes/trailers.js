const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { trailerUpload } = require('../config/uploadConfig');
const trailersController = require('../controllers/trailersController');

// GET all trailers
router.get('/', authenticateToken, trailersController.getTrailers);

router.get('/available', authenticateToken, trailersController.getAvailableTrailers);

// POST add trailer with file uploads
router.post(
  '/',
  authenticateToken,
  trailerUpload.fields([
    { name: 'insurance_file', maxCount: 1 },
    { name: 'inspection_file', maxCount: 1 },
  ]),
  trailersController.addTrailer
);

module.exports = router;
