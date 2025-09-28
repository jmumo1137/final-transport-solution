import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../api/api';
import { logout, selectUserId, selectUserRole } from '../features/auth/authSlice';

export default function DriverDashboard() {
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

  // 🔹 Driver lifecycle actions
  const handleDriverAction = async (order) => {
    try {
      let res;
      switch (order.status.toLowerCase()) {
        case 'assigned':
          res = await api.post(`/api/orders/${order.id}/loaded`);
          break;
        case 'loaded':
          res = await api.post(`/api/orders/${order.id}/enroute`, { start_odometer: 0 });
          break;
        case 'enroute':
          res = await api.post(`/api/orders/${order.id}/delivered`);
          break;
        default:
          alert('No driver action available for this status.');
          return;
      }
      if (res?.data?.ok || res?.data) {
        fetchDriverOrders();
      }
    } catch (err) {
      console.error('Driver action error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to update order.');
    }
  };

  const getDriverActionLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned': return 'Confirm Loaded';
      case 'loaded': return 'Start Trip';
      case 'enroute': return 'Mark Delivered';
      default: return null;
    }
  };

  // 🔹 Button availability rules
  const canLogFuel = (status) => ['loaded', 'enroute'].includes(status.toLowerCase());
  const canLogMileage = (status) => ['enroute', 'delivered'].includes(status.toLowerCase());
  const canUploadPOD = (status) => status.toLowerCase() === 'enroute';

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Dashboard</h1>
      <p>Welcome, Driver</p>
      <button onClick={handleLogout} style={{ background: 'red', color: 'white' }}>
        Logout
      </button>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => navigate('/driver/orders')}
          style={{ background: '#007bff', color: 'white', padding: '6px 12px', borderRadius: 4 }}
        >
          View Assigned Orders
        </button>
      </div>

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
                  {/*  Driver lifecycle button */}
                  {getDriverActionLabel(order.status) && (
                    <button
                      onClick={() => handleDriverAction(order)}
                      style={{ marginRight: 5, background: 'green', color: 'white' }}
                    >
                      {getDriverActionLabel(order.status)}
                    </button>
                  )}

                  {/*  Fuel logging */}
                  <button
                    onClick={() => navigate(`/fuel/${order.id}`)}
                    disabled={!canLogFuel(order.status)}
                  >
                    Log Fuel
                  </button>

                  {/*  Mileage logging */}
                  <button
                    onClick={() => navigate(`/mileage/${order.id}`)}
                    style={{ marginLeft: 5 }}
                    disabled={!canLogMileage(order.status)}
                  >
                    Log Mileage
                  </button>

                  {/*  POD upload */}
                  <button
                    onClick={() => navigate(`/documents/${order.id}`)}
                    style={{ marginLeft: 5 }}
                    disabled={!canUploadPOD(order.status)}
                  >
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
