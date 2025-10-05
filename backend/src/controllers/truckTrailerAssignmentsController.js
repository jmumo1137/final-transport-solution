const db = require('../db');

// ✅ Assign a trailer to a truck
async function assignTrailer(req, res) {
  try {
    const { truck_id, trailer_id } = req.body;

    if (!truck_id || !trailer_id) {
      return res.status(400).json({ message: 'Truck and Trailer are required.' });
    }

    // End any active assignment for this trailer
    await db('truck_trailer_assignments')
      .where({ trailer_id })
      .whereNull('unassigned_date')
      .update({ unassigned_date: db.fn.now() });

    // End any active assignment for this truck
    await db('truck_trailer_assignments')
      .where({ truck_id })
      .whereNull('unassigned_date')
      .update({ unassigned_date: db.fn.now() });

    // Create new assignment
    const [assignment_id] = await db('truck_trailer_assignments')
      .insert({
        truck_id,
        trailer_id,
        assigned_date: db.fn.now(),
      });

    const assignment = await db('truck_trailer_assignments as tta')
      .join('trucks as trk', 'tta.truck_id', 'trk.truck_id')
      .join('trailers as trl', 'tta.trailer_id', 'trl.trailer_id')
      .where('tta.assignment_id', assignment_id)
      .select(
        'tta.assignment_id',
        'tta.assigned_date',
        'trk.truck_id',
        'trk.plate_number as truck_plate',
        'trl.trailer_id',
        'trl.plate_number as trailer_plate'
      )
      .first();

    res.status(201).json({
      message: 'Trailer assigned successfully.',
      assignment,
    });
  } catch (error) {
    console.error('❌ Error assigning trailer:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// ✅ Unassign a trailer
async function unassignTrailer(req, res) {
  try {
    const { assignmentId } = req.params;

    const updated = await db('truck_trailer_assignments')
      .where({ assignment_id: assignmentId })
      .whereNull('unassigned_date')
      .update({ unassigned_date: db.fn.now() });

    if (!updated) {
      return res.status(404).json({
        message: 'Assignment not found or already unassigned.',
      });
    }

    res.json({ message: 'Trailer unassigned successfully.' });
  } catch (error) {
    console.error('❌ Error unassigning trailer:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// ✅ Active assignments
async function getActiveAssignments(req, res) {
  try {
    const rows = await db('truck_trailer_assignments as tta')
      .join('trucks as trk', 'tta.truck_id', 'trk.truck_id')
      .join('trailers as trl', 'tta.trailer_id', 'trl.trailer_id')
      .whereNull('tta.unassigned_date')
      .select(
        'tta.assignment_id',
        'tta.assigned_date',
        'trk.truck_id',
        'trk.plate_number as truck_plate',
        'trl.trailer_id',
        'trl.plate_number as trailer_plate'
      )
      .orderBy('tta.assigned_date', 'desc');

    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching active assignments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// ✅ Full assignment history
async function getAssignmentHistory(req, res) {
  try {
    const rows = await db('truck_trailer_assignments as tta')
      .join('trucks as trk', 'tta.truck_id', 'trk.truck_id')
      .join('trailers as trl', 'tta.trailer_id', 'trl.trailer_id')
      .select(
        'tta.assignment_id',
        'tta.assigned_date',
        'tta.unassigned_date',
        'trk.truck_id',
        'trk.plate_number as truck_plate',
        'trl.trailer_id',
        'trl.plate_number as trailer_plate'
      )
      .orderBy('tta.assigned_date', 'desc');

    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching assignment history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// ✅ Available trucks (not assigned)
async function getAvailableTrucks(req, res) {
  try {
    const busyTrucks = await db('truck_trailer_assignments')
      .whereNull('unassigned_date')
      .pluck('truck_id');

    const availableTrucks = await db('trucks')
      .whereNotIn('truck_id', busyTrucks)
      .orderBy('plate_number');

    res.json(availableTrucks);
  } catch (error) {
    console.error('❌ Error fetching available trucks:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// ✅ Available trailers (not assigned)
async function getAvailableTrailers(req, res) {
  try {
    const busyTrailers = await db('truck_trailer_assignments')
      .whereNull('unassigned_date')
      .pluck('trailer_id');

    const availableTrailers = await db('trailers')
      .whereNotIn('trailer_id', busyTrailers)
      .orderBy('plate_number');

    res.json(availableTrailers);
  } catch (error) {
    console.error('❌ Error fetching available trailers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  assignTrailer,
  unassignTrailer,
  getActiveAssignments,
  getAssignmentHistory,
  getAvailableTrucks,
  getAvailableTrailers,
};
