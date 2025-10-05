// src/controllers/trailersController.js
const db = require('../db');

// Add Trailer
async function addTrailer(req, res) {
  try {
    const {
      plate_number,
      insurance_expiry_date,
      comesa_number,
      comesa_expiry_date,
      inspection_expiry_date
    } = req.body;

    if (!plate_number) {
      return res.status(400).json({ message: "Plate number is required" });
    }

    const insurance_file = req.files?.insurance_file?.[0]?.filename || null;
    const inspection_file = req.files?.inspection_file?.[0]?.filename || null;

    await db('trailers').insert({
      plate_number,
      insurance_expiry_date,
      insurance_file,
      comesa_number,
      comesa_expiry_date,
      inspection_expiry_date,
      inspection_file
    });

    res.status(201).json({ message: "Trailer added successfully" });
  } catch (error) {
    console.error("Error adding trailer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all trailers
async function getTrailers(req, res) {
  try {
    const trailers = await db('trailers').select('*').orderBy('created_at', 'desc');
    res.json(trailers);
  } catch (error) {
    console.error("Error fetching trailers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
// Get only available trailers (not currently assigned)
async function getAvailableTrailers(req, res) {
  try {
    const busyTrailers = await db('orders')
      .whereIn('status', ['assigned', 'loaded', 'enroute'])
      .pluck('trailer_id');

    const availableTrailers = await db('trailers')
      .whereNotIn('trailer_id', busyTrailers)
      .orderBy('plate_number');

    res.json(availableTrailers);
  } catch (error) {
    console.error('Error fetching available trailers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { addTrailer, getTrailers, getAvailableTrailers };