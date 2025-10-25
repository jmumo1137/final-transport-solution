// src/pages/DriverForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './DriverForm.css';

export default function DriverForm({ driver, onClose }) {
  const [formData, setFormData] = useState({
    full_name: driver?.full_name || '',
    username: driver?.username || '',
    id_number: driver?.id_number || '',
    phone_number: driver?.phone_number || '',
    email: driver?.email || '',
    residence: driver?.residence || '',
    kra_pin: driver?.kra_pin || '',
    nssf: driver?.nssf || '',
    nhif: driver?.nhif || '',
    license_number: driver?.license_number || '',
    license_expiry_date: driver?.license_expiry_date || '',
    next_of_kin_name: driver?.next_of_kin_name || '',
    next_of_kin_phone: driver?.next_of_kin_phone || '',
    next_of_kin_relationship: driver?.next_of_kin_relationship || '',
    safety_policy_accepted: driver?.safety_policy_accepted || false,
    driver_policy_accepted: driver?.driver_policy_accepted || false,
    company_policy_accepted: driver?.company_policy_accepted || false,
    license_file: null,
    passport_photo: null,
    good_conduct_certificate: null,
    port_pass: null,
  });

  const handleChange = (e) => {
    const { name, type, checked, files, value } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    }

    try {
      if (driver) {
        await axios.put(`http://localhost:5000/api/drivers/${driver.id}`, data);
      } else {
        await axios.post('http://localhost:5000/api/drivers', data);
      }
      alert('Driver saved successfully');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving driver');
    }
  };

  return (
    <div className="driver-form-overlay">
      <div className="driver-form">
        <h2>{driver ? 'Edit Driver' : 'Add Driver'}</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* --- Personal Details --- */}
          <h3>Personal Information</h3>
          <input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
          <input name="id_number" placeholder="ID Number" value={formData.id_number} onChange={handleChange} />
          <input name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <input name="residence" placeholder="Residence" value={formData.residence} onChange={handleChange} />
          <input name="kra_pin" placeholder="KRA PIN" value={formData.kra_pin} onChange={handleChange} />
          <input name="nssf" placeholder="NSSF" value={formData.nssf} onChange={handleChange} />
          <input name="nhif" placeholder="NHIF" value={formData.nhif} onChange={handleChange} />

          {/* --- License & Compliance --- */}
          <h3>License & Compliance Documents</h3>
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

          {/* --- Next of Kin --- */}
          <h3>Next of Kin</h3>
          <input name="next_of_kin_name" placeholder="Next of Kin Name" value={formData.next_of_kin_name} onChange={handleChange} />
          <input name="next_of_kin_phone" placeholder="Next of Kin Phone" value={formData.next_of_kin_phone} onChange={handleChange} />
          <input name="next_of_kin_relationship" placeholder="Relationship" value={formData.next_of_kin_relationship} onChange={handleChange} />

          {/* --- Policies --- */}
          <h3>Policy Agreements</h3>
          <label className="policy-check">
            <input type="checkbox" name="safety_policy_accepted" checked={formData.safety_policy_accepted} onChange={handleChange} />
            I have read and agree to the Safety Policy
          </label>
          <label className="policy-check">
            <input type="checkbox" name="driver_policy_accepted" checked={formData.driver_policy_accepted} onChange={handleChange} />
            I have read and agree to the Driver Policy
          </label>
          <label className="policy-check">
            <input type="checkbox" name="company_policy_accepted" checked={formData.company_policy_accepted} onChange={handleChange} />
            I have read and agree to the Company Policy
          </label>

          {/* --- Buttons --- */}
          <div className="form-buttons">
            <button type="submit">{driver ? 'Update' : 'Create'}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
