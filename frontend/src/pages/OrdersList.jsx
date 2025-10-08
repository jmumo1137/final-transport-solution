// src/pages/OrdersList.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/api';
import { selectUserRole, selectUsername } from '../features/auth/authSlice';

export default function OrdersList() {
  const role = useSelector(selectUserRole);
  const username = useSelector(selectUsername);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment modal state
  const [assignOrderId, setAssignOrderId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverUsername, setDriverUsername] = useState('');
  const [driverSuggestions, setDriverSuggestions] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState('');
  const [trailers, setTrailers] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState('');

  // Create order form (for customers)
  const [formData, setFormData] = useState({ pickup: '', destination: '' });
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    fetchOrders();
    if (['dispatcher', 'admin'].includes(role)) fetchResources();
  }, [role]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders');
      let filtered = res.data;
      if (role === 'customer') {
        filtered = res.data.filter(o => o.customer_name === username);
      }
      setOrders(filtered);
    } catch (err) {
      console.error('Error fetching orders:', err);
      alert('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const [driversRes, trucksRes, trailersRes] = await Promise.all([
        api.get('/api/users/drivers'),
        api.get('/api/trucks/available'),
        api.get('/api/trailers/available'),
      ]);
      setDrivers(driversRes.data);
      setTrucks(trucksRes.data);
      setTrailers(trailersRes.data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  // NEXT STEP LOGIC
  const getNextStepLabel = status => {
    switch (status?.toLowerCase()) {
      case 'created': return 'Assign Driver';
      case 'assigned': return 'Mark Loaded';
      case 'loaded': return 'Start Transport';
      case 'enroute': return 'Mark Delivered';
      case 'delivered': return 'Awaiting Payment';
      case 'awaiting_payment': return 'Mark as Paid';
      case 'paid': return 'Close Order';
      default: return 'Order Closed';
    }
  };

  const handleNextStep = async order => {
    if (role === 'customer') return;
    const orderId = order.id;
    try {
      let res;
      switch (order.status.toLowerCase()) {
        case 'created': setAssignOrderId(orderId); return;
        case 'assigned': res = await api.post(`/api/orders/${orderId}/loaded`); break;
        case 'loaded': res = await api.post(`/api/orders/${orderId}/enroute`); break;
        case 'enroute': res = await api.post(`/api/orders/${orderId}/delivered`); break;
        case 'delivered': res = await api.post(`/api/orders/${orderId}/awaiting-payment`); break;
        case 'awaiting_payment': res = await api.post(`/api/orders/${orderId}/paid`); break;
        case 'paid': res = await api.post(`/api/orders/${orderId}/close`); break;
        case 'closed': alert('Order is already closed.'); return;
        default: alert('Unknown order status.'); return;
      }
      if (res?.data) fetchOrders();
    } catch (err) {
      console.error('Next step error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to move to next step.');
    }
  };

  // DRIVER AUTOCOMPLETE
  const handleDriverChange = async e => {
    const value = e.target.value;
    setDriverUsername(value);
    setSelectedDriverId(null);
    if (value.length >= 1) {
      try {
        const res = await api.get(`/api/users/drivers?search=${value}`);
        setDriverSuggestions(res.data);
      } catch {
        setDriverSuggestions([]);
      }
    } else setDriverSuggestions([]);
  };

  const handleSelectDriver = driver => {
    setDriverUsername(driver.username);
    setSelectedDriverId(driver.id);
    setDriverSuggestions([]);
  };

  const handleAssignSubmit = async () => {
    if (!selectedDriverId || !selectedTruck) {
      alert('Driver and Truck are required!');
      return;
    }
    try {
      await api.post(`/api/orders/${assignOrderId}/assign`, {
        driver_id: selectedDriverId,
        truck_id: selectedTruck,
        trailer_id: selectedTrailer || null,
      });
      alert('Order assigned successfully!');
      setAssignOrderId(null);
      setDriverUsername('');
      setSelectedDriverId(null);
      setSelectedTruck('');
      setSelectedTrailer('');
      fetchOrders();
      fetchResources();
    } catch (err) {
      console.error('Assignment error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to assign order');
    }
  };

  const handleCreateOrder = async e => {
    e.preventDefault();
    if (!formData.pickup || !formData.destination) {
      alert('Pickup and Destination required.');
      return;
    }
    setCreatingOrder(true);
    try {
      await api.post('/api/orders', { ...formData, customer_name: username });
      alert('Order created successfully!');
      setFormData({ pickup: '', destination: '' });
      fetchOrders();
    } catch (err) {
      console.error('Create order error:', err);
      alert('Failed to create order.');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Orders</h2>

      {role === 'customer' && (
        <form onSubmit={handleCreateOrder} style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={username}
            disabled
            style={{ padding: 5, width: '200px', background: '#eee' }}
          />
          <input
            type="text"
            placeholder="Pickup"
            value={formData.pickup}
            onChange={e => setFormData({ ...formData, pickup: e.target.value })}
            style={{ padding: 5, width: '200px' }}
          />
          <input
            type="text"
            placeholder="Destination"
            value={formData.destination}
            onChange={e => setFormData({ ...formData, destination: e.target.value })}
            style={{ padding: 5, width: '200px' }}
          />
          <button type="submit" disabled={creatingOrder} style={{ padding: '5px 15px' }}>
            {creatingOrder ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Pickup</th>
            <th>Destination</th>
            <th>Waybill</th>
            <th>Status</th>
            {role !== 'customer' && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ background: order.status === 'awaiting_payment' ? '#fff7e6' : 'transparent' }}>
              <td>{order.id}</td>
              <td>{order.customer_name}</td>
              <td>{order.pickup}</td>
              <td>{order.destination}</td>
              <td>{order.waybill || '-'}</td>
              <td>{order.status}</td>
              {role !== 'customer' && (
                <td>
                  <button onClick={() => handleNextStep(order)}>
                    {getNextStepLabel(order.status)}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Assign Modal */}
      {assignOrderId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 350 }}>
            <h3>Assign Order #{assignOrderId}</h3>

            <div style={{ marginBottom: 10 }}>
              <label>Driver:</label>
              <input
                type="text"
                value={driverUsername}
                onChange={handleDriverChange}
                placeholder="Type driver username"
                style={{ width: '100%', padding: 5 }}
              />
              {driverSuggestions.length > 0 && (
                <ul style={{
                  background: '#fff', border: '1px solid #ccc', listStyle: 'none',
                  margin: 0, padding: 0, maxHeight: 120, overflowY: 'auto'
                }}>
                  {driverSuggestions.map(d => (
                    <li key={d.id} style={{ padding: 5, cursor: 'pointer' }}
                        onClick={() => handleSelectDriver(d)}>
                      {d.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Truck:</label>
              <select
                value={selectedTruck}
                onChange={e => setSelectedTruck(e.target.value)}
                style={{ width: '100%', padding: 5 }}
              >
                <option value="">Select Truck</option>
                {trucks.map(t => (
                  <option key={t.id} value={t.id}>{t.plate_number}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Trailer (optional):</label>
              <select
                value={selectedTrailer}
                onChange={e => setSelectedTrailer(e.target.value)}
                style={{ width: '100%', padding: 5 }}
              >
                <option value="">No Trailer</option>
                {trailers.map(tr => (
                  <option key={tr.id} value={tr.id}>{tr.plate_number}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
              <button onClick={handleAssignSubmit}>Assign</button>
              <button onClick={() => setAssignOrderId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
