// backend/src/controllers/trucksController.js
const db = require('../db');
const { Parser } = require('json2csv'); 

async function addTruck(req, res) {
  try {
    const {
      plate_number,
      insurance_expiry_date,
      comesa_number,
      comesa_expiry_date,
      inspection_expiry_date
    } = req.body;

    const insurance_file = req.files?.insurance_file?.[0]?.filename || null;
    const inspection_file = req.files?.inspection_file?.[0]?.filename || null;

    if (!plate_number) {
      return res.status(400).json({ message: 'Plate number is required' });
    }

    // Knex insert
    const [truck_id] = await db('trucks').insert({
      plate_number,
      insurance_expiry_date,
      insurance_file,
      comesa_number,
      comesa_expiry_date,
      inspection_expiry_date,
      inspection_file
    });

    res.status(201).json({
      message: 'Truck added successfully',
      truck_id
    });
  } catch (error) {
    console.error('Error adding truck:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}


// Fetch trucks
async function getTrucks(req, res) {
  try {
    const trucks = await db('trucks')
      .select('*')
      .orderBy('created_at', 'desc');

    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
// Get only available trucks (not currently assigned)
async function getAvailableTrucks(req, res) {
  try {
    const busyTrucks = await db('orders')
       .whereIn('status', ['assigned', 'loaded', 'enroute'])
      .pluck('truck_id');

    const availableTrucks = await db('trucks')
      .whereNotIn('truck_id', busyTrucks)
      .orderBy('plate_number');

    res.json(availableTrucks);
  } catch (error) {
    console.error('Error fetching available trucks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
// Export trucks for admin download
async function exportTrucks(req, res) {
  try {
    const trucks = await db('trucks').select(
      'plate_number',
      'comesa_number',
      'comesa_expiry_date',
      'insurance_expiry_date',
      'inspection_expiry_date',
      'created_at'
    );

    if (!trucks.length) {
      return res.status(404).json({ message: 'No trucks found' });
    }

    const formatted = trucks.map((t) => ({
      Plate_Number: t.plate_number || 'N/A',
      COMESA_Number: t.comesa_number || 'N/A',
      COMESA_Expiry: t.comesa_expiry_date
        ? new Date(t.comesa_expiry_date).toISOString().split('T')[0]
        : 'N/A',
      Insurance_Expiry: t.insurance_expiry_date
        ? new Date(t.insurance_expiry_date).toISOString().split('T')[0]
        : 'N/A',
      Inspection_Expiry: t.inspection_expiry_date
        ? new Date(t.inspection_expiry_date).toISOString().split('T')[0]
        : 'N/A',
      Registered_On: t.created_at
        ? new Date(t.created_at).toISOString().split('T')[0]
        : 'N/A',
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header('Content-Type', 'text/csv');
    res.attachment('trucks_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting trucks:', error);
    res.status(500).json({ message: 'Failed to export trucks' });
  }
}
module.exports = { addTruck, getTrucks, getAvailableTrucks, exportTrucks };

