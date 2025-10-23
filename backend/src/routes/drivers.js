// backend/src/routes/driversRoutes.js
const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');
const { driverUpload } = require('../config/uploadConfig');

// GET all drivers (for OrdersList dropdown)
router.get('/drivers', driversController.getAllDrivers);

// GET single driver
router.get('/:id', driversController.getDriver);
//  PUT update driver policies
router.put('/:id/policies', driversController.updateDriverPolicies);

// ✅ Allow multiple named fields for driver document uploads
router.put(
  '/:id',
  driverUpload.fields([
    { name: 'license_file', maxCount: 1 },
    { name: 'passport_photo', maxCount: 1 },
    { name: 'good_conduct_certificate', maxCount: 1 },
    { name: 'port_pass', maxCount: 1 },
  ]),
  driversController.updateDriver
);

module.exports = router;
