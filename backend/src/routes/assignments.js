const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all assignments
router.get('/', (req, res) => {
    try {
        const assignments = db.prepare(`
            SELECT ta.id, t.plate_number AS truck_plate, tr.plate_number AS trailer_plate, ta.assigned_date, ta.unassigned_date
            FROM truck_trailer_assignments ta
            LEFT JOIN trucks t ON ta.truck_id = t.id
            LEFT JOIN trailers tr ON ta.trailer_id = tr.id
        `).all();
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign a trailer to a truck
router.post('/', (req, res) => {
    const { truck_id, trailer_id } = req.body;
    try {
        const stmt = db.prepare(`INSERT INTO truck_trailer_assignments (truck_id, trailer_id) VALUES (?, ?)`);
        const info = stmt.run(truck_id, trailer_id);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unassign a trailer
router.put('/:id/unassign', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare(`UPDATE truck_trailer_assignments SET unassigned_date=CURRENT_DATE WHERE id=?`).run(id);
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
