import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from '../features/auth/authSlice';

export default function Payment() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    API.get(`/orders/${id}`).then(r => setOrder(r.data));
  }, [id]);

  async function createInvoice() {
    if (!amount || Number(amount) <= 0) return alert('amount > 0 required');
    await API.post(`/payments/${id}/invoice`, { amount: Number(amount) });
    alert('invoice requested (pending)');
  }

  async function markPaid() {
    await API.post('/webhook/payment', { order_id: Number(id), status: 'paid' });
    alert('payment webhook simulated');
    const r = await API.get(`/orders/${id}`);
    setOrder(r.data);
  }

  return (
    <div>
      <h3>Payment — Order {id}</h3>
      <div>Current status: {order?.payment_status} | order status: {order?.status}</div>
      <input placeholder="amount" value={amount} onChange={e => setAmount(e.target.value)} />
      <button onClick={createInvoice}>Create Invoice</button>
      <button onClick={markPaid}>Simulate Payment Paid</button>
    </div>
  );
}
