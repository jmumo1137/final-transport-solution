import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../api/api';
import { logout, selectUserId, selectUserRole } from '../features/auth/authSlice';

export default function DriverOrders() {
  const [orders, setOrders] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);

  // Fetch assigned orders
  const fetchDriverOrders = async () => {
    try {
      const res = await api.get(`/api/driver/orders/${userId}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('fetchDriverOrders error:', err.response?.data || err.message);
    }
  };

  // Fetch driver info (for insurance/license status)
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers/${userId}`);
      setDriverInfo(res.data);
    } catch (err) {
      console.error('fetchDriverInfo error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (role === 'driver') {
      fetchDriverOrders();
      fetchDriverInfo();
    }
  }, [role, userId]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/delivered`);
      fetchDriverOrders();
    } catch (err) {
      console.error('Mark Delivered error:', err.response?.data || err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Dashboard</h1>
      <p>Welcome, Driver</p>

      {/* Insurance / license info */}
      <p>
        Insurance Status:{' '}
        {driverInfo?.license_number
          ? `License ${driverInfo.license_number} expires ${driverInfo.license_expiry_date}`
          : 'No license info'}
      </p>

      <button onClick={handleLogout} style={{ background: 'red', color: 'white' }}>
        Logout
      </button>

      <h2 style={{ marginTop: 20 }}>View Assigned Orders</h2>
      {orders.length === 0 ? (
        <p>No orders assigned yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ marginTop: 20, width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Pickup</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Qty Loaded</th>
              <th>Qty Delivered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{order.pickup}</td>
                <td>{order.destination}</td>
                <td>{order.status}</td>
                <td>{order.quantity_loaded || 0}</td>
                <td>{order.quantity_delivered || 0}</td>
                <td>
                  {/* Show relevant buttons based on status */}
                  {['created', 'assigned', 'loaded', 'enroute', 'delivered'].includes(
                    order.status
                  ) && (
                    <>
                      <button onClick={() => navigate(`/fuel/${order.id}`)}>Log Fuel</button>
                      <button
                        onClick={() => navigate(`/mileage/${order.id}`)}
                        style={{ marginLeft: 5 }}
                      >
                        Log Mileage
                      </button>
                      <button
                        onClick={() => navigate(`/documents/${order.id}`)}
                        style={{ marginLeft: 5 }}
                      >
                        Upload POD
                      </button>
                    </>
                  )}

                  {order.status === 'enroute' && (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      style={{ marginLeft: 5 }}
                    >
                      Mark Delivered
                    </button>
                  )}

                  {/* Log Expenses button */}
                  <button
                    onClick={() => navigate(`/expenses/${order.id}`)}
                    style={{ marginLeft: 5 }}
                  >
                    Log Expenses
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
