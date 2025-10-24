const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const {
  validateDriverCompliance,
  validateTruckTrailerCompliance,
} = require('../middleware/validateCompliance');

const ordersController = require('../controllers/ordersController');

// ----------- CREATE + LIST -----------
router.post('/', authenticateToken, ordersController.createOrder);

// Auto-filters based on logged-in user’s role:
// - Admin / Dispatcher → All orders
// - Consignee → Only orders they created
router.get('/', authenticateToken, ordersController.listOrders);

// ----------- ASSIGN (with compliance) -----------
router.post(
  '/:id/assign',
  authenticateToken,
  validateDriverCompliance,
  validateTruckTrailerCompliance,
  ordersController.assignOrder
);

// ----------- ORDER LIFECYCLE -----------
router.post('/:id/loaded', authenticateToken, ordersController.markLoaded);
router.post('/:id/enroute', authenticateToken, ordersController.markEnroute);
router.post('/:id/delivered', authenticateToken, ordersController.markDelivered);
router.post('/:id/awaiting-payment', authenticateToken, ordersController.markAwaitingPayment);
router.post('/:id/paid', authenticateToken, ordersController.markPaid);
router.post('/:id/close', authenticateToken, ordersController.closeOrder);

module.exports = router;
