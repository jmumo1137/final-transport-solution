const express = require('express');
const router = express.Router();
const db = require('../db'); // Knex or SQLite instance
const { authenticateToken } = require('../middleware/auth');

// Get orders for logged-in driver with truck/trailer insurance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user.userId || req.user.id;

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID missing in token' });
    }

    // Fetch orders with truck/trailer insurance info
    const orders = await db('orders as o')
      .leftJoin('trucks as t', 't.truck_id', 'o.truck_id')
      .leftJoin('trailers as tr', 'tr.trailer_id', 'o.trailer_id')
      .where('o.driver_id', driverId)
      .select(
        'o.*',
        't.plate_number as truck_plate',
        't.insurance_file as truck_insurance_file',
        't.insurance_expiry_date as truck_insurance_expiry',
        'tr.plate_number as trailer_plate',
        'tr.insurance_file as trailer_insurance_file',
        'tr.insurance_expiry_date as trailer_insurance_expiry'
      )
      .orderBy('o.created_at', 'desc');

    // Combine insurance info into a single field for frontend
    const formattedOrders = orders.map(order => {
      const insuranceFile = order.truck_insurance_file || order.trailer_insurance_file || null;
      const insuranceExpiry = order.truck_insurance_expiry || order.trailer_insurance_expiry || null;
      return {
        ...order,
        insurance: insuranceExpiry ? { file: insuranceFile, expiry_date: insuranceExpiry } : null
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error('Driver orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch driver orders' });
  }
});

module.exports = router;
