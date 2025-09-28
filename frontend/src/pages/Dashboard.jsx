import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { logout, selectUserRole, selectUserId, selectUsername } from '../features/auth/authSlice';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignOrderId, setAssignOrderId] = useState(null);
  const [driverUsername, setDriverUsername] = useState('');
  const [driverSuggestions, setDriverSuggestions] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [newVehicle, setNewVehicle] = useState({ reg_number: '', model: '', current_odometer: 0 });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);
  const username = useSelector(selectUsername);

console.log('Logged-in username:', username);
  const activeStatuses = ['created', 'assigned', 'loaded', 'enroute', 'delivered', 'awaiting_payment', 'paid'];
  const blinkStyle = { animation: 'blink 1s infinite' };

  // Fetch orders
const fetchOrders = async () => {
  try {
    const res = await api.get('/api/orders');
    let filtered = res.data;

    if (role === 'driver') {
      filtered = filtered.filter(o => o.driver_id === userId);
    } 
    else if (role === 'consignee') {
      filtered = filtered.filter(o => o.customer_name === username);
    }

    setOrders(filtered);
  } catch (err) {
    console.error('fetchOrders error:', err);
  }
};


  // Fetch vehicles (only for admin/dispatcher)
  const fetchVehicles = async () => {
    if (role === 'consignee') return;
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

  const getNextStepLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'created': return 'Assign Driver';
      case 'assigned': return 'Mark Loaded';
      case 'loaded': return 'Start Transport';
      case 'enroute': return 'Mark Delivered';
      case 'delivered': return 'Awaiting Payment';
      case 'awaiting_payment': return 'Mark as Paid';
      case 'paid': return 'Close Order';
      default: return 'Order closed';
    }
  };

  const handleNextStep = async (order) => {
    if (role === 'consignee') return; // Consignees cannot move orders

    try {
      let res;
      switch (order.status.toLowerCase()) {
        case 'created': alert('Order must be assigned first via Assign Driver!'); return;
        case 'assigned': res = await api.post(`/api/orders/${order.id}/loaded`); break;
        case 'loaded': res = await api.post(`/api/orders/${order.id}/enroute`, { start_odometer: 0 }); break;
        case 'enroute': res = await api.post(`/api/orders/${order.id}/delivered`); break;
        case 'delivered': res = await api.post(`/api/orders/${order.id}/awaiting-payment`); break;
        case 'awaiting_payment': res = await api.post(`/api/orders/${order.id}/paid`); break;
        case 'paid': res = await api.post(`/api/orders/${order.id}/close`); break;
        case 'closed': alert('Order is already closed. No further actions.'); return;
        default: alert('Unknown order status'); return;
      }
      if (res?.data?.ok || res?.data) fetchOrders();
    } catch (err) {
      console.error('Next step error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to move to next step.');
    }
  };

  // Vehicle helpers (only for admin/dispatcher)
  const availableVehicles = vehicles.filter(v => {
    return !orders.some(o => o.vehicle_id === v.id && activeStatuses.includes(o.status.toLowerCase()));
  });
  const getVehicleRowColor = (status) => {
    if (status === 'Available') return '#d4edda';
    if (['created', 'assigned', 'loaded', 'enroute'].includes(status.toLowerCase())) return '#ffe5b4';
    if (['delivered', 'awaiting_payment', 'paid'].includes(status.toLowerCase())) return '#fff3cd';
    return '#f8d7da';
  };
  const vehiclesWithStatus = vehicles.map(v => {
    const assignedOrder = orders.find(o => o.vehicle_id === v.id && activeStatuses.includes(o.status.toLowerCase()));
    return {
      ...v,
      status: assignedOrder ? assignedOrder.status : 'Available',
      rowColor: assignedOrder ? getVehicleRowColor(assignedOrder.status) : getVehicleRowColor('Available')
    };
  });

  // Driver autocomplete (only for admin/dispatcher)
  const handleDriverChange = async (e) => {
    if (role === 'consignee') return;
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

  // Add Vehicle (admin/dispatcher only)
  const handleAddVehicle = async () => {
    if (role === 'consignee') return;
    const { reg_number, model, current_odometer } = newVehicle;
    if (!reg_number.trim() || !model.trim()) {
      alert('Registration and Model are required!');
      return;
    }

    try {
      const res = await api.post('/api/vehicles', {
        reg_number: reg_number.trim(),
        model: model.trim(),
        current_odometer: Number(current_odometer)
      });
      setVehicles(prev => [...prev, res.data || { id: Date.now(), reg_number, model, current_odometer }]);
      setNewVehicle({ reg_number: '', model: '', current_odometer: 0 });
      alert('Vehicle added!');
    } catch (err) {
      console.error('Add vehicle error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to add vehicle.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <style>{`@keyframes blink {0%{background-color:#ffe5b4}50%{background-color:#ffd966}100%{background-color:#ffe5b4}}`}</style>

      <h1>Dashboard</h1>
      <p>Role: {role}</p>
      <button onClick={() => navigate('/orders')}>Create Order</button>
      <button onClick={handleLogout} style={{ marginLeft: 10, background: 'red', color: 'white' }}>Logout</button>

      {/* Orders Table */}
      <table border="1" cellPadding="5" style={{ marginTop: 20, width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Customer</th><th>Pickup</th><th>Destination</th><th>Waybill</th><th>Status</th>
            {role !== 'consignee' && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td><td>{order.customer_name}</td><td>{order.pickup}</td><td>{order.destination}</td>
              <td>{order.waybill}</td><td>{order.status}</td>
              {role !== 'consignee' && (
                <td>
                  <button onClick={() => {
                    if (order.status.toLowerCase() === 'created') setAssignOrderId(order.id);
                    else handleNextStep(order);
                  }}>{getNextStepLabel(order.status)}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Vehicles Section (admin/dispatcher only) */}
     {role !== 'consignee' && (
  <>
    <h2 style={{ marginTop: 40 }}>Add Vehicle</h2>
    <div style={{ marginBottom: 20 }}>
      <input
        placeholder="Registration"
        value={newVehicle.reg_number}
        onChange={e => setNewVehicle({ ...newVehicle, reg_number: e.target.value })}
      />
      <input
        placeholder="Model"
        value={newVehicle.model}
        onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
      />
      <input
        placeholder="Odometer"
        type="number"
        value={newVehicle.current_odometer}
        onChange={e => setNewVehicle({ ...newVehicle, current_odometer: e.target.value })}
      />
      <button onClick={handleAddVehicle}>Add Vehicle</button>
    </div>

    <h2>Vehicles</h2>
    <table border="1" cellPadding="5" style={{ width: '100%' }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Registration</th>
          <th>Model</th>
          <th>Odometer</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {vehiclesWithStatus.map(v => {
          // Build descriptive tooltip
          let tooltip = '';
          if (v.status === 'Available') {
            tooltip = 'This vehicle is available for assignment';
          } else {
            const assignedOrder = orders.find(o => o.vehicle_id === v.id);
            if (assignedOrder) {
              tooltip = `Assigned to Order #${assignedOrder.id} (${assignedOrder.status})\nPickup: ${assignedOrder.pickup}\nDestination: ${assignedOrder.destination}`;
            } else {
              tooltip = 'Assigned to an order';
            }
          }

          return (
            <tr
              key={v.id}
              style={{
                backgroundColor: v.rowColor,
                cursor: v.status === 'Available' ? 'default' : 'pointer',
                ...(v.status.toLowerCase() === 'enroute' ? blinkStyle : {})
              }}
              title={tooltip}
            >
              <td>{v.id}</td>
              <td>{v.reg_number}</td>
              <td>{v.model}</td>
              <td>{v.current_odometer}</td>
              <td>{v.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
)}


      {/* Assign Driver Modal (admin/dispatcher only) */}
      {assignOrderId && role !== 'consignee' && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', padding:20, borderRadius:8, width:400 }}>
            <h3>Assign Driver & Vehicle</h3>
            <input type="text" value={driverUsername} onChange={handleDriverChange} placeholder="Driver username" style={{ width:'100%', padding:5 }} />
            {driverSuggestions.length>0 && (
              <ul style={{ background:'#fff', border:'1px solid #ccc', margin:0, padding:0, listStyle:'none', maxHeight:120, overflowY:'auto' }}>
                {driverSuggestions.map(d => (
                  <li key={d.id} style={{ padding:5, cursor:'pointer' }} onClick={()=>handleSelectDriver(d.username)}>{d.username}</li>
                ))}
              </ul>
            )}
            <select value={vehicleId} onChange={e=>setVehicleId(e.target.value)} style={{ marginTop:10, width:'100%', padding:5 }}>
              <option value="">Select Vehicle</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.reg_number} - {v.model} (Odometer: {v.current_odometer})</option>
              ))}
            </select>
            <div style={{ marginTop:15, display:'flex', justifyContent:'space-between' }}>
              <button onClick={handleAssignDriver}>Assign</button>
              <button onClick={()=>setAssignOrderId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
