const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { truckUpload } = require('../config/uploadConfig');
const trucksController = require('../controllers/trucksController');

// GET all trucks
router.get('/', authenticateToken, trucksController.getTrucks);

// GET available trucks
router.get('/available', authenticateToken, trucksController.getAvailableTrucks);

// POST add truck with file uploads
router.post(
  '/',
  authenticateToken,
  truckUpload.fields([
    { name: 'insurance_file', maxCount: 1 },
    { name: 'inspection_file', maxCount: 1 },
  ]),
  trucksController.addTruck
);

module.exports = router;
