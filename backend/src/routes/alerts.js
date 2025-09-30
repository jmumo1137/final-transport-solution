const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all alerts
router.get('/', (req, res) => {
    try {
        const alerts = db.prepare('SELECT * FROM alerts ORDER BY alert_date ASC').all();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create an alert
router.post('/', (req, res) => {
    const { entity_type, entity_id, alert_type, alert_date, status } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO alerts (entity_type, entity_id, alert_type, alert_date, status)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = stmt.run(entity_type, entity_id, alert_type, alert_date, status || 'pending');
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resolve an alert
router.put('/:id/resolve', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare(`UPDATE alerts SET status='resolved' WHERE id=?`).run(id);
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
