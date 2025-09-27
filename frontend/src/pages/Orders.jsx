import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/api';
import { selectUserRole } from '../features/auth/authSlice';

export default function Orders() {
  const [customer, setCustomer] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [driverUsername, setDriverUsername] = useState('');
  const [driverSuggestions, setDriverSuggestions] = useState([]);
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  // Driver autocomplete
  const handleDriverChange = async (e) => {
    const value = e.target.value;
    setDriverUsername(value);

    if (value.length >= 1) {
      try {
        const res = await api.get(`/users/drivers?search=${value}`); // Updated endpoint
        setDriverSuggestions(res.data || []);
      } catch (err) {
        console.error('Driver search error:', err);
        setDriverSuggestions([]);
      }
    } else {
      setDriverSuggestions([]);
    }
  };

  const handleSelectDriver = (username) => {
    setDriverUsername(username);
    setDriverSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer || !pickup || !destination) {
      alert('All fields are required.');
      return;
    }

    try {
      // Step 1: create order
      const createPayload = { customer_name: customer, pickup, destination, driver_username: driverUsername || null };
      const res = await api.post('/api/orders', createPayload); // Updated endpoint

      alert(`Order created! Waybill: ${res.data.waybill}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Create order error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to create order.');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '50px auto' }}>
      <h2>Create Order</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={customer}
          onChange={e => setCustomer(e.target.value)}
          placeholder="Customer Name"
          required
        />
        <input
          type="text"
          value={pickup}
          onChange={e => setPickup(e.target.value)}
          placeholder="Pickup Location"
          required
        />
        <input
          type="text"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Destination"
          required
        />

        {['dispatcher', 'admin'].includes(role) && (
          <div style={{ position: 'relative', marginTop: 10 }}>
            <input
              type="text"
              value={driverUsername}
              onChange={handleDriverChange}
              placeholder="Assign Driver (optional)"
            />
            {driverSuggestions.length > 0 && (
              <ul style={{
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
                zIndex: 10
              }}>
                {driverSuggestions.map(driver => (
                  <li
                    key={driver.id}
                    style={{ padding: 5, cursor: 'pointer' }}
                    onClick={() => handleSelectDriver(driver.username)}
                  >
                    {driver.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="submit" style={{ marginTop: 10 }}>Create Order</button>
      </form>
    </div>
  );
}
