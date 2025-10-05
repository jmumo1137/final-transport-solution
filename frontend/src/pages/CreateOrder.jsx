// src/pages/CreateOrder.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/api';
import { selectUserRole } from '../features/auth/authSlice';

export default function CreateOrder() {
  const [customer, setCustomer] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [driverQuery, setDriverQuery] = useState('');
  const [driverSuggestions, setDriverSuggestions] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  // ---------- Driver Autocomplete ----------
  const handleDriverChange = async (e) => {
    const value = e.target.value;
    setDriverQuery(value);
    setSelectedDriverId(null); // Reset selected driver if typing

    if (value.length > 0) {
      try {
        const res = await api.get(`/users/drivers?search=${value}`);
        setDriverSuggestions(res.data || []);
      } catch (err) {
        console.error('Driver search error:', err);
        setDriverSuggestions([]);
      }
    } else {
      setDriverSuggestions([]);
    }
  };

  const handleSelectDriver = (driver) => {
    setDriverQuery(driver.username);
    setSelectedDriverId(driver.id);
    setDriverSuggestions([]);
  };

  // ---------- Submit Form ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer || !pickup || !destination) {
      alert('All fields are required.');
      return;
    }

    try {
      const payload = {
        customer_name: customer,
        pickup,
        destination,
        driver_id: selectedDriverId || null, // send driver ID instead of username
      };

      const res = await api.post('/api/orders', payload);
      const order = res?.data;

      console.log('Order created:', order);

      if (!order?.waybill) {
        alert('Order created, but waybill is missing!');
      } else {
        alert(`Order created! Waybill: ${order.waybill}`);
      }

      // Clear form
      setCustomer('');
      setPickup('');
      setDestination('');
      setDriverQuery('');
      setSelectedDriverId(null);
      setDriverSuggestions([]);

      navigate('/orders');
    } catch (err) {
      console.error('Create order error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to create order.');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <h2>Create Order</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Customer Name"
          required
        />
        <input
          type="text"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="Pickup Location"
          required
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          required
        />

        {['dispatcher', 'admin'].includes(role) && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={driverQuery}
              onChange={handleDriverChange}
              placeholder="Assign Driver (optional)"
            />
            {driverSuggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ccc',
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: 120,
                  overflowY: 'auto',
                  zIndex: 10,
                }}
              >
                {driverSuggestions.map((driver) => (
                  <li
                    key={driver.id}
                    style={{ padding: 5, cursor: 'pointer' }}
                    onClick={() => handleSelectDriver(driver)}
                  >
                    {driver.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="submit" style={{ marginTop: 10 }}>
          Create Order
        </button>
      </form>
    </div>
  );
}
