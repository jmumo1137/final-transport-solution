// src/pages/DriverDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserId, selectUserRole, logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function DriverDashboard() {
  const [orders, setOrders] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [qtyLoaded, setQtyLoaded] = useState('');

  const userId = useSelector(selectUserId);
  const role = useSelector(selectUserRole);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch assigned orders
  const fetchOrders = async () => {
    try {
      const res = await api.get(`/api/driver/orders`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('fetchOrders error:', err.response?.data || err.message);
    }
  };

  // Fetch driver info
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers`);
      setDriverInfo(res.data || {});
    } catch (err) {
      console.error('fetchDriverInfo error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (role === 'driver' && userId) {
      fetchOrders();
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
      fetchOrders();
    } catch (err) {
      console.error('Mark Delivered error:', err.response?.data || err.message);
    }
  };

  const handleConfirmLoad = async (orderId) => {
    try {
      if (!qtyLoaded || qtyLoaded <= 0) {
        alert('Please enter a valid quantity loaded');
        return;
      }
      await api.post(`/api/orders/${orderId}/load`, { qty_loaded: qtyLoaded });
      setActiveOrderId(null);
      setQtyLoaded('');
      fetchOrders();
    } catch (err) {
      console.error('Confirm Load error:', err.response?.data || err.message);
      alert('Failed to confirm loading');
    }
  };

  const renderInsuranceStatus = () => {
    if (!driverInfo?.license_expiry_date) return 'No license info';
    const today = new Date();
    const expiry = new Date(driverInfo.license_expiry_date);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30
      ? `⚠ License expiring in ${diffDays} day(s)!`
      : `Valid until ${expiry.toLocaleDateString()}`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Dashboard</h1>
      <p>Welcome, {driverInfo?.full_name || 'Driver'}</p>
      <p>Insurance Status: {renderInsuranceStatus()}</p>

      <button onClick={handleLogout} style={{ background: 'red', color: 'white', marginBottom: 20 }}>
        Logout
      </button>

      <h3>View Assigned Orders</h3>
      {orders.length === 0 ? (
        <p>No orders assigned yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Pickup</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Qty Loaded</th>
              <th>Qty Delivered</th>
              <th>Expenses</th>
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
                <td>{order.quantity_loaded || 0}</td>
                <td>{order.quantity_delivered || 0}</td>
                <td>{order.expenses ? `$${order.expenses}` : '-'}</td>
                <td>
                  <button onClick={() => navigate(`/fuel/${order.id}`)}>Log Fuel</button>
                  <button onClick={() => navigate(`/mileage/${order.id}`)} style={{ marginLeft: 5 }}>
                    Log Mileage
                  </button>
                  <button onClick={() => navigate(`/expenses/${order.id}`)} style={{ marginLeft: 5 }}>
                    Log Expenses
                  </button>
                  <button onClick={() => navigate(`/documents/${order.id}`)} style={{ marginLeft: 5 }}>
                    Upload POD
                  </button>
                  {order.status === 'assigned' && (
                    <>
                      {activeOrderId === order.id ? (
                        <div style={{ marginTop: 5 }}>
                          <input
                            type="number"
                            placeholder="Qty Loaded"
                            value={qtyLoaded}
                            onChange={(e) => setQtyLoaded(e.target.value)}
                          />
                          <button
                            onClick={() => handleConfirmLoad(order.id)}
                            style={{ marginLeft: 5 }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setActiveOrderId(null)}
                            style={{ marginLeft: 5 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveOrderId(order.id)}
                          style={{ marginLeft: 5 }}
                        >
                          Confirm Loading
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'enroute' && (
                    <button onClick={() => handleMarkDelivered(order.id)} style={{ marginLeft: 5 }}>
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
