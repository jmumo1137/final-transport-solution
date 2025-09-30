// src/pages/Drivers.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DriverForm from './DriverForm';
import './Drivers.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ total: 0, expiringSoon: 0 });
  const [editingDriver, setEditingDriver] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/drivers/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchStats();
  }, []);

  // Delete driver
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/drivers/${id}`);
      fetchDrivers();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="drivers-page">
      <h1>Drivers Management</h1>

      <div className="driver-stats">
        <span>Total Drivers: {stats.total}</span>
        <span>Expiring Licenses Soon: {stats.expiringSoon}</span>
      </div>

      <button onClick={() => { setEditingDriver(null); setShowForm(true); }}>
        Add Driver
      </button>

      {showForm && (
        <DriverForm
          driver={editingDriver}
          onClose={() => { setShowForm(false); fetchDrivers(); fetchStats(); }}
        />
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Username</th>
            <th>License Number</th>
            <th>License Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d.driver_id}>
              <td>{d.driver_id}</td>
              <td>{d.full_name}</td>
              <td>{d.username}</td>
              <td>{d.license_number}</td>
              <td>{d.license_expiry_date}</td>
              <td>
                <button onClick={() => { setEditingDriver(d); setShowForm(true); }}>Edit</button>
                <button onClick={() => handleDelete(d.driver_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
