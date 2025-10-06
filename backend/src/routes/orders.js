const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { validateDriverCompliance, validateTruckTrailerCompliance } = require('../middleware/validateCompliance');
const ordersController = require('../controllers/ordersController');

// Create + List
router.post('/', authenticateToken, ordersController.createOrder);
router.get('/', authenticateToken, ordersController.listOrders);

// Assign (with compliance validation)
router.post(
  '/:id/assign',
  authenticateToken,
  validateDriverCompliance,
  validateTruckTrailerCompliance,
  ordersController.assignOrder
);
// Order lifecycle with validations
router.post('/:id/loaded', authenticateToken, ordersController.markLoaded);
router.post('/:id/enroute', authenticateToken, ordersController.markEnroute);
router.post('/:id/delivered', authenticateToken, ordersController.markDelivered);
router.post('/:id/awaiting-payment', authenticateToken, ordersController.markAwaitingPayment);
router.post('/:id/paid', authenticateToken, ordersController.markPaid);
router.post('/:id/close', authenticateToken, ordersController.closeOrder);

module.exports = router;
