import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useParams } from 'react-router-dom';

export default function Mileage() {
  const { id } = useParams();
  const [startOdometer, setStartOdometer] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [records, setRecords] = useState([]);
  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
      if (res.data?.quantity_loaded && !quantityDelivered) {
        setQuantityDelivered(res.data.quantity_loaded);
      }
    } catch (err) {
      console.error('❌ Error fetching order:', err);
    }
  };

  const fetchMileage = async () => {
    try {
      const res = await api.get(`/api/mileage/${id}`);
      setRecords(res.data);
    } catch (err) {
      console.error('❌ Error fetching mileage:', err);
    }
  };

  const handleSubmit = async () => {
    if (!endOdometer) {
      alert('End odometer is required!');
      return;
    }

    try {
      await api.post(`/api/mileage/${id}`, {
        start_odometer: startOdometer || null,
        end_odometer: endOdometer,
      });
      alert('Mileage logged successfully.');
      setEndOdometer('');
      fetchMileage();
      fetchOrder();
    } catch (err) {
      console.error('❌ Mileage log error:', err);
      alert(err.response?.data?.message || 'Failed to log mileage');
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchMileage();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">
        Mileage — Order #{id}
      </h2>

      <div className="bg-gray-100 p-4 rounded-md mb-4">
        <div className="mb-3">
          <label className="block font-medium">
            Start Odometer
          </label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={startOdometer}
            onChange={(e) => setStartOdometer(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block font-medium">End Odometer</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={endOdometer}
            onChange={(e) => setEndOdometer(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Mileage
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">
        Previous Mileage Records
      </h3>
      {records.length === 0 ? (
        <p>No mileage records yet.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Start</th>
              <th className="p-2 border">End</th>
              <th className="p-2 border">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td className="p-2 border">{r.start_odometer}</td>
                <td className="p-2 border">{r.end_odometer}</td>
                <td className="p-2 border">
                  {r.logged_at
                    ? new Date(r.logged_at).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
