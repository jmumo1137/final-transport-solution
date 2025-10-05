const express = require('express');
const router = express.Router();
const {
  assignTrailer,
  unassignTrailer,
  getActiveAssignments,
  getAssignmentHistory,
  getAvailableTrucks,
  getAvailableTrailers
} = require('../controllers/truckTrailerAssignmentsController');

// ✅ Assign trailer to truck
router.post('/assign', assignTrailer);

// ✅ Unassign trailer
router.put('/:assignmentId/unassign', unassignTrailer);

// ✅ Fetch active assignments
router.get('/active', getActiveAssignments);

// ✅ Fetch full assignment history
router.get('/history', getAssignmentHistory);

// ✅ Fetch available trucks for dropdown
router.get('/available-trucks', getAvailableTrucks);

// ✅ Fetch available trailers for dropdown
router.get('/available-trailers', getAvailableTrailers);

// (Optional aliases – only if frontend still uses /trucks or /trailers)
router.get('/trucks', getAvailableTrucks);
router.get('/trailers', getAvailableTrailers);

module.exports = router;
