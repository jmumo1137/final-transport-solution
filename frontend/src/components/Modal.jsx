// src/pages/DriverDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserId, selectUserRole, logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Modal from '../components/Modal';

export default function DriverDashboard() {
  const [orders, setOrders] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);
  const [modalData, setModalData] = useState(null); // { type, orderId }

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

  // Modal Handlers
  const handleConfirmLoad = async (orderId, qtyLoaded) => {
    if (!qtyLoaded || qtyLoaded <= 0) {
      alert('Please enter a valid quantity loaded');
      return;
    }
    try {
      await api.post(`/api/orders/${orderId}/load`, { qty_loaded: qtyLoaded });
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, status: 'loaded', quantity_loaded: qtyLoaded } : o
        )
      );
      closeModal();
    } catch (err) {
      console.error('Confirm Load error:', err.response?.data || err.message);
      alert('Failed to confirm loading');
    }
  };

  const handleStartTrip = async (orderId, startOdometer) => {
    if (!startOdometer || startOdometer <= 0) {
      alert('Please enter a valid start odometer');
      return;
    }
    try {
      await api.post(`/api/orders/${orderId}/start`, { start_odometer: startOdometer });
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, status: 'enroute', start_odometer: startOdometer } : o
        )
      );
      closeModal();
    } catch (err) {
      console.error('Start Trip error:', err.response?.data || err.message);
      alert('Failed to start trip');
    }
  };

  const handleFuelUpload = async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append('fuel_receipt', file);
      await api.post(`/api/fuel/${orderId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, fuel_uploaded: true } : o
        )
      );
      closeModal();
    } catch (err) {
      console.error('Fuel Upload error:', err.response?.data || err.message);
      alert('Failed to upload fuel receipt');
    }
  };

  const handleMarkDelivered = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order?.fuel_uploaded) {
      alert('Please upload fuel receipt before marking delivered');
      return;
    }
    try {
      await api.post(`/api/orders/${orderId}/delivered`);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: 'delivered' } : o))
      );
    } catch (err) {
      console.error('Mark Delivered error:', err.response?.data || err.message);
      alert('Failed to mark delivered');
    }
  };

  const closeModal = () => setModalData(null);

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

      <button
        onClick={handleLogout}
        style={{ background: 'red', color: 'white', marginBottom: 20 }}
      >
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
                  {/* Fuel Upload available anytime */}
                  <button
                    onClick={() => setModalData({ type: 'fuel', orderId: order.id })}
                  >
                    Upload Fuel
                  </button>

                  {/* Assigned → Confirm Loading */}
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => setModalData({ type: 'loading', orderId: order.id })}
                      style={{ marginLeft: 5 }}
                    >
                      Confirm Loading
                    </button>
                  )}

                  {/* Loaded → Start Trip */}
                  {order.status === 'loaded' && (
                    <button
                      onClick={() => setModalData({ type: 'start', orderId: order.id })}
                      style={{ marginLeft: 5, background: 'green', color: 'white' }}
                    >
                      Start Trip
                    </button>
                  )}

                  {/* Enroute → Mark Delivered (only if fuel uploaded) */}
                  {order.status === 'enroute' && (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      style={{ marginLeft: 5 }}
                      disabled={!order.fuel_uploaded}
                      title={!order.fuel_uploaded ? 'Upload fuel receipt first' : ''}
                    >
                      Mark Delivered
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/mileage/${order.id}`)}
                    style={{ marginLeft: 5 }}
                  >
                    Log Mileage
                  </button>

                  <button
                    onClick={() => navigate(`/expenses/${order.id}`)}
                    style={{ marginLeft: 5 }}
                  >
                    Log Expenses
                  </button>

                  <button
                    onClick={() => navigate(`/documents/${order.id}`)}
                    style={{ marginLeft: 5 }}
                  >
                    Upload POD
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modalData && (
        <Modal
          type={modalData.type}
          orderId={modalData.orderId}
          closeModal={closeModal}
          handleConfirmLoad={handleConfirmLoad}
          handleStartTrip={handleStartTrip}
          handleFuelUpload={handleFuelUpload}
          handleMarkDelivered={handleMarkDelivered}
        />
      )}
    </div>
  );
}
