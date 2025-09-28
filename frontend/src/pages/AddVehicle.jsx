import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function AddVehicle() {
  const [reg, setReg] = useState('');
  const [model, setModel] = useState('');
  const [odometer, setOdometer] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reg.trim() || !model.trim()) {
      alert('Registration and model are required!');
      return;
    }

    try {
      await api.post('/api/vehicles', {
        reg_number: reg.trim(),
        model: model.trim(),
        current_odometer: Number(odometer) || 0
      });

      alert('Vehicle added!');

      // Dispatch event so Dashboard can refresh vehicles
      window.dispatchEvent(new Event('vehicleAdded'));

      navigate('/dashboard'); // redirect back to dashboard
    } catch (err) {
      console.error('Add vehicle error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Registration"
        value={reg}
        onChange={e => setReg(e.target.value)}
        required
      />
      <input
        placeholder="Model"
        value={model}
        onChange={e => setModel(e.target.value)}
        required
      />
      <input
        placeholder="Current Odometer"
        type="number"
        value={odometer}
        onChange={e => setOdometer(e.target.value)}
        required
      />
      <button type="submit">Add Vehicle</button>
    </form>
  );
}
