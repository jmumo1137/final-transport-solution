const express = require('express');
const router = express.Router();
const db = require('../db'); // your SQLite connection

// Get all trucks
router.get('/', async (req, res) => {
    try {
        const trucks = db.prepare('SELECT * FROM trucks').all();
        res.json(trucks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new truck
router.post('/', async (req, res) => {
    const { plate_number, insurance_expiry_date, comesa_number } = req.body;
    try {
        const stmt = db.prepare(`INSERT INTO trucks (plate_number, insurance_expiry_date, comesa_number) VALUES (?, ?, ?)`);
        const info = stmt.run(plate_number, insurance_expiry_date, comesa_number);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update truck
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { plate_number, insurance_expiry_date, comesa_number } = req.body;
    try {
        db.prepare(`UPDATE trucks SET plate_number=?, insurance_expiry_date=?, comesa_number=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
          .run(plate_number, insurance_expiry_date, comesa_number, id);
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
