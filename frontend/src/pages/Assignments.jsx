import React, { useState, useEffect } from 'react';
import api from '../api/api';

export default function TruckTrailerAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'history'

  useEffect(() => {
    fetchAssignments();
    fetchTrucks();
    fetchTrailers();
  }, [viewMode]);

  const fetchAssignments = async () => {
    try {
      const endpoint =
        viewMode === 'active'
          ? '/api/truck-trailer/active'
          : '/api/truck-trailer/history';
      const res = await api.get(endpoint);
      setAssignments(res.data);
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await api.get('/api/truck-trailer/available-trucks');
      setTrucks(res.data);
    } catch (error) {
      console.error('❌ Error loading trucks:', error);
    }
  };

  const fetchTrailers = async () => {
    try {
      const res = await api.get('/api/truck-trailer/available-trailers');
      setTrailers(res.data);
    } catch (error) {
      console.error('❌ Error loading trailers:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTruck || !selectedTrailer) {
      alert('Truck and Trailer are required!');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/truck-trailer/assign', {
        truck_id: selectedTruck,
        trailer_id: selectedTrailer,
      });

      alert(res.data.message || 'Trailer assigned successfully!');
      setShowModal(false);
      setSelectedTruck('');
      setSelectedTrailer('');
      fetchAssignments();
      fetchTrucks();
      fetchTrailers();
    } catch (error) {
      console.error('❌ Error assigning trailer:', error);
      alert(error.response?.data?.message || 'Failed to assign trailer.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!window.confirm('Unassign this trailer from its truck?')) return;

    try {
       await api.put(`/api/truck-trailer/${assignmentId}/unassign`);
      alert('Trailer unassigned successfully.');
      fetchAssignments();
      fetchTrucks();
      fetchTrailers();
    } catch (error) {
      console.error('❌ Error unassigning trailer:', error);
      alert(error.response?.data?.message || 'Failed to unassign.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🚛 Truck–Trailer Assignments</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Assign Trailer
        </button>
      </div>

      {/* Toggle between Active / History */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            viewMode === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setViewMode('active')}
        >
          Active Assignments
        </button>
        <button
          className={`px-4 py-2 rounded ${
            viewMode === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setViewMode('history')}
        >
          View History
        </button>
      </div>

      {/* Assignment Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Truck</th>
              <th className="p-2 border">Trailer</th>
              <th className="p-2 border">Assigned Date</th>
              <th className="p-2 border">Unassigned Date</th>
              <th className="p-2 border">Status</th>
              {viewMode === 'active' && <th className="p-2 border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td
                  colSpan={viewMode === 'active' ? 7 : 6}
                  className="text-center py-4 text-gray-500"
                >
                  No {viewMode === 'active' ? 'active' : 'past'} assignments found.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.assignment_id} className="text-center">
                  <td className="p-2 border">{a.assignment_id}</td>
                  <td className="p-2 border">{a.truck_plate}</td>
                  <td className="p-2 border">{a.trailer_plate}</td>
                  <td className="p-2 border">
                    {new Date(a.assigned_date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">
                    {a.unassigned_date
                      ? new Date(a.unassigned_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="p-2 border">
                    {!a.unassigned_date ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  {viewMode === 'active' && (
                    <td className="p-2 border">
                      <button
                        onClick={() => handleUnassign(a.assignment_id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Unassign
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Assign Trailer to Truck</h3>

            <label className="block mb-2 font-medium">Truck:</label>
            <select
              className="border w-full p-2 mb-4 rounded"
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
            >
              <option value="">Select Truck</option>
              {trucks.map((t) => (
                <option key={t.truck_id} value={t.truck_id}>
                  {t.plate_number}
                </option>
              ))}
            </select>

            <label className="block mb-2 font-medium">Trailer:</label>
            <select
              className="border w-full p-2 mb-4 rounded"
              value={selectedTrailer}
              onChange={(e) => setSelectedTrailer(e.target.value)}
            >
              <option value="">Select Trailer</option>
              {trailers.map((t) => (
                <option key={t.trailer_id} value={t.trailer_id}>
                  {t.plate_number}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
