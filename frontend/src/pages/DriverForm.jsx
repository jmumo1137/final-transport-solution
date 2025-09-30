// src/pages/DriverForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './DriverForm.css';

export default function DriverForm({ driver, onClose }) {
  const [formData, setFormData] = useState({
    full_name: driver?.full_name || '',
    username: driver?.username || '',
    license_number: driver?.license_number || '',
    license_expiry_date: driver?.license_expiry_date || '',
    license_file: null,
    passport_photo: null,
    good_conduct_certificate: null,
    port_pass: null
  });

  const handleChange = (e) => {
    if (e.target.files) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) data.append(key, formData[key]);
    }

    try {
      if (driver) {
        await axios.put(`http://localhost:5000/api/drivers/${driver.driver_id}`, data);
      } else {
        await axios.post('http://localhost:5000/api/drivers', data);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="driver-form-overlay">
      <div className="driver-form">
        <h2>{driver ? 'Edit Driver' : 'Add Driver'}</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
          <input name="license_number" placeholder="License Number" value={formData.license_number} onChange={handleChange} />
          <input name="license_expiry_date" type="date" value={formData.license_expiry_date} onChange={handleChange} />

          <label>License File:</label>
          <input name="license_file" type="file" onChange={handleChange} />

          <label>Passport Photo:</label>
          <input name="passport_photo" type="file" onChange={handleChange} />

          <label>Good Conduct Certificate:</label>
          <input name="good_conduct_certificate" type="file" onChange={handleChange} />

          <label>Port Pass:</label>
          <input name="port_pass" type="file" onChange={handleChange} />

          <div className="form-buttons">
            <button type="submit">{driver ? 'Update' : 'Create'}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
