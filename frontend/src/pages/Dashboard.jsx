import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { logout, selectUserRole, selectUserId } from '../features/auth/authSlice';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignOrderId, setAssignOrderId] = useState(null);
  const [driverUsername, setDriverUsername] = useState('');
  const [driverSuggestions, setDriverSuggestions] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      let filtered = res.data;

      if (role === 'driver') filtered = filtered.filter(o => o.driver_id === userId);
      else if (role === 'consignee') filtered = filtered.filter(o => o.customer_name === userId);

      setOrders(filtered);
    } catch (err) {
      console.error('fetchOrders error:', err);
    }
  };

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/vehicles');
      setVehicles(res.data || []);
    } catch (err) {
      console.error('fetchVehicles error:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVehicles();
  }, [role, userId]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNextStep = async (order) => {
    try {
      let res;
      switch (order.status.toLowerCase()) {
        case 'created':
          alert('Order must be assigned first via Assign Driver!');
          return;
        case 'assigned':
          res = await api.post(`/api/orders/${order.id}/loaded`);
          break;
        case 'loaded':
          res = await api.post(`/api/orders/${order.id}/enroute`, { start_odometer: 0 });
          break;
        case 'enroute':
          res = await api.post(`/api/orders/${order.id}/delivered`);
          break;
        case 'delivered':
          alert('Order delivered. Payment must be confirmed via webhook.');
          return;
        default:
          alert('Unknown order status');
          return;
      }
      if (res?.data?.ok || res?.data) fetchOrders();
    } catch (err) {
      console.error('Next step error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to move to next step.');
    }
  };

  const getNextStepLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'created': return 'Assign Driver';
      case 'assigned': return 'Mark Loaded';
      case 'loaded': return 'Start Transport';
      case 'enroute': return 'Mark Delivered';
      case 'delivered': return 'Await Payment';
      default: return 'Next Step';
    }
  };

  // Driver autocomplete
  const handleDriverChange = async (e) => {
    const value = e.target.value;
    setDriverUsername(value);
    if (value.length >= 1) {
      try {
        const res = await api.get(`/users/drivers?search=${value}`);
        setDriverSuggestions(res.data || []);
      } catch (err) {
        console.error('Driver search error:', err);
        setDriverSuggestions([]);
      }
    } else setDriverSuggestions([]);
  };

  const handleSelectDriver = (username) => {
    setDriverUsername(username);
    setDriverSuggestions([]);
  };

  // Assign driver & vehicle
  const handleAssignDriver = async () => {
    if (!driverUsername || !vehicleId) {
      alert('Driver and Vehicle are required!');
      return;
    }
    try {
      await api.post(`/api/orders/${assignOrderId}/assign`, {
        driver_username: driverUsername,
        vehicle_id: parseInt(vehicleId, 10)
      });
      alert('Driver & Vehicle assigned!');
      setAssignOrderId(null);
      setDriverUsername('');
      setVehicleId('');
      fetchOrders();
    } catch (err) {
      console.error('Assign driver error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to assign driver.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Role: {role}</p>
      <button onClick={() => navigate('/orders')}>Create Order</button>
      <button onClick={handleLogout} style={{ marginLeft: 10, background: 'red', color: 'white' }}>Logout</button>

      <table border="1" cellPadding="5" style={{ marginTop: 20, width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Pickup</th>
            <th>Destination</th>
            <th>Waybill</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer_name}</td>
              <td>{order.pickup}</td>
              <td>{order.destination}</td>
              <td>{order.waybill}</td>
              <td>{order.status}</td>
              <td>
                <button onClick={() => {
                  if (order.status.toLowerCase() === 'created') setAssignOrderId(order.id);
                  else handleNextStep(order);
                }}>
                  {getNextStepLabel(order.status)}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Assign Driver & Vehicle Modal */}
      {assignOrderId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          height: '100%', background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 400 }}>
            <h3>Assign Driver & Vehicle</h3>

            {/* Driver input with suggestions */}
            <input
              type="text"
              value={driverUsername}
              onChange={handleDriverChange}
              placeholder="Driver username"
              style={{ width: '100%', padding: 5 }}
            />
            {driverSuggestions.length > 0 && (
              <ul style={{
                background: '#fff', border: '1px solid #ccc', margin: 0,
                padding: 0, listStyle: 'none', maxHeight: 120, overflowY: 'auto'
              }}>
                {driverSuggestions.map(d => (
                  <li key={d.id} style={{ padding: 5, cursor: 'pointer' }}
                      onClick={() => handleSelectDriver(d.username)}>
                    {d.username}
                  </li>
                ))}
              </ul>
            )}

            {/* Vehicle dropdown */}
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              style={{ marginTop: 10, width: '100%', padding: 5 }}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.reg_number} - {v.model} (Odometer: {v.current_odometer})
                </option>
              ))}
            </select>

            <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleAssignDriver}>Assign</button>
              <button onClick={() => setAssignOrderId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
