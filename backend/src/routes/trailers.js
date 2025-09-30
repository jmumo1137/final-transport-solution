const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all trailers
router.get('/', (req, res) => {
    try {
        const trailers = db.prepare('SELECT * FROM trailers').all();
        res.json(trailers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new trailer
router.post('/', (req, res) => {
    const { plate_number, insurance_expiry_date, comesa_number } = req.body;
    try {
        const stmt = db.prepare(`INSERT INTO trailers (plate_number, insurance_expiry_date, comesa_number) VALUES (?, ?, ?)`);
        const info = stmt.run(plate_number, insurance_expiry_date, comesa_number);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update trailer
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { plate_number, insurance_expiry_date, comesa_number } = req.body;
    try {
        db.prepare(`UPDATE trailers SET plate_number=?, insurance_expiry_date=?, comesa_number=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
          .run(plate_number, insurance_expiry_date, comesa_number, id);
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
