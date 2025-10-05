// src/middleware/validateTrailerCompliance.js
const db = require('../db');

async function validateTrailerCompliance(req, res, next) {
  try {
    const { trailer_id } = req.body;

    if (!trailer_id) {
      return res.status(400).json({ message: "Trailer ID is required" });
    }

    const trailer = await db.get(`SELECT * FROM trailers WHERE trailer_id = ?`, [trailer_id]);

    if (!trailer) {
      return res.status(404).json({ message: "Trailer not found" });
    }

    const now = new Date();

    // Insurance validation
    if (trailer.insurance_expiry_date && new Date(trailer.insurance_expiry_date) < now) {
      return res.status(400).json({ message: "Trailer insurance has expired" });
    }

    // COMESA validation
    if (trailer.comesa_expiry_date && new Date(trailer.comesa_expiry_date) < now) {
      return res.status(400).json({ message: "Trailer COMESA has expired" });
    }

    // Inspection validation
    if (trailer.inspection_expiry_date && new Date(trailer.inspection_expiry_date) < now) {
      return res.status(400).json({ message: "Trailer inspection has expired" });
    }

    next(); // all good
  } catch (error) {
    console.error("Error validating trailer compliance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = validateTrailerCompliance;
