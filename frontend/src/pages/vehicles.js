import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function AddVehicle() {
  const [reg, setReg] = useState('');
  const [model, setModel] = useState('');
  const [odometer, setOdometer] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/vehicles', { reg_number: reg, model, current_odometer: parseFloat(odometer) });
      alert('Vehicle added!');
      navigate('/dashboard'); // redirect after adding
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Registration" value={reg} onChange={e => setReg(e.target.value)} required />
      <input placeholder="Model" value={model} onChange={e => setModel(e.target.value)} required />
      <input placeholder="Current Odometer" type="number" value={odometer} onChange={e => setOdometer(e.target.value)} required />
      <button type="submit">Add Vehicle</button>
    </form>
  );
}
