import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../api/api';
import { logout, selectUserId, selectUserRole } from '../features/auth/authSlice';

export default function DriverOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);

  const fetchDriverOrders = async () => {
    try {
      const res = await api.get(`/api/driver/orders/${userId}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('fetchDriverOrders error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (role === 'driver') {
      fetchDriverOrders();
    }
  }, [role, userId]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Dashboard</h1>
      <p>Welcome, Driver</p>
      <button onClick={handleLogout} style={{ background: 'red', color: 'white' }}>
        Logout
      </button>

      {orders.length === 0 ? (
        <p style={{ marginTop: 20 }}>No orders assigned yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ marginTop: 20, width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Pickup</th>
              <th>Destination</th>
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
                <td>{order.status}</td>
                <td>
                  <button onClick={() => navigate(`/fuel/${order.id}`)}>Log Fuel</button>
                  <button onClick={() => navigate(`/mileage/${order.id}`)} style={{ marginLeft: 5 }}>
                    Log Mileage
                  </button>
                  <button onClick={() => navigate(`/documents/${order.id}`)} style={{ marginLeft: 5 }}>
                    Upload POD
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
