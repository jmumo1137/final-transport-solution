import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Mileage() {
  const { id } = useParams(); // order ID
  const navigate = useNavigate();

  const [startOdometer, setStartOdometer] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [cashSpent, setCashSpent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!startOdometer || !endOdometer) {
      alert('Start and End odometer are required!');
      return;
    }
    if (Number(endOdometer) < Number(startOdometer)) {
      alert('End odometer must be greater than or equal to start odometer');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/api/mileage/${id}`, {
        start_odometer: Number(startOdometer),
        end_odometer: Number(endOdometer),
        cash_spent: cashSpent || 0
      });

      if (res.data?.ok) {
        alert('Mileage logged successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Mileage error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to log mileage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Log Mileage — Order {id}</h2>
      <input type="number" placeholder="Start Odometer" value={startOdometer} onChange={e => setStartOdometer(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
      <input type="number" placeholder="End Odometer" value={endOdometer} onChange={e => setEndOdometer(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
      <input type="number" placeholder="Cash Spent (optional)" value={cashSpent} onChange={e => setCashSpent(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
      <button onClick={handleSubmit} disabled={loading}>{loading ? 'Logging...' : 'Log Mileage'}</button>
    </div>
  );
}
