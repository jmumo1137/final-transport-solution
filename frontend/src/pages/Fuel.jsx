// src/pages/Fuel.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

export default function Fuel() {
  const { id } = useParams(); // order ID
  const [file, setFile] = useState(null);
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [fuelRecords, setFuelRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch fuel records for this order
  const fetchFuelRecords = async () => {
    try {
      const res = await api.get(`/api/fuel/${id}`);
      setFuelRecords(res.data || []);
    } catch (err) {
      console.error('Fetch fuel records error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchFuelRecords();
  }, [id]);

  // Upload fuel receipt
  const handleUpload = async () => {
    if (!file || !liters || !cost) {
      alert('File, liters, and cost are required!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('liters', liters);
    formData.append('cost', cost);

    try {
      setLoading(true);
      const res = await api.post(`/api/fuel/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.ok) {
        alert('Fuel record uploaded successfully!');
        setFile(null);
        setLiters('');
        setCost('');
        fetchFuelRecords();
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to upload fuel record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Fuel — Order {id}</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          onChange={e => setFile(e.target.files[0])}
        />
        <br />
        <input
          type="number"
          placeholder="Liters"
          value={liters}
          onChange={e => setLiters(e.target.value)}
          style={{ marginTop: 5 }}
        />
        <br />
        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={e => setCost(e.target.value)}
          style={{ marginTop: 5 }}
        />
        <br />
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ marginTop: 10 }}
        >
          {loading ? 'Uploading...' : 'Upload Receipt'}
        </button>
      </div>

      <h3>Previous Fuel Records</h3>
      {fuelRecords.length === 0 ? (
        <p>No fuel records yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>File</th>
              <th>Liters</th>
              <th>Cost</th>
              <th>Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {fuelRecords.map(record => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  <a href={`/${record.file_path}`} target="_blank" rel="noreferrer">
                    View
                  </a>
                </td>
                <td>{record.liters}</td>
                <td>{record.cost}</td>
                <td>{new Date(record.uploaded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
