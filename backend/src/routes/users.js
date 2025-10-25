const express = require('express');
const db = require('../db');
const router = express.Router();

// Driver search: GET /users/drivers?search=...
router.get('/drivers', async (req, res) => {
  const { search } = req.query;
  try {
    let query = db('users').where({ role: 'driver' })
    .select(
        'id',
        'full_name',
        'username',
        'id_number',
        'phone_number',
        'email',
        'license_number',
        'license_expiry_date',
        'license_file',
        'passport_photo',
        'good_conduct_certificate',
        'port_pass',
        'residence',
        'next_of_kin_name',
        'next_of_kin_phone'
        
        
      );
    if (search) query = query.andWhere('username', 'like', `%${search}%`);
    const drivers = await query.select('id', 'username');
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

module.exports = router;
