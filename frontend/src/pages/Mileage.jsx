import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from '../features/auth/authSlice';

export default function Mileage() {
  const { id } = useParams();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    API.get(`/orders/${id}`).then(r => {
      setStart(r.data.start_odometer || 0);
    });
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (Number(end) < Number(start)) return alert('end must be >= start');
    await API.post(`/mileage/${id}/log`, { start_odometer: Number(start), end_odometer: Number(end) });
    alert('mileage logged');
  }

  return (
    <div>
      <h3>Mileage — Order {id}</h3>
      <form onSubmit={submit}>
        <input value={start} onChange={e => setStart(e.target.value)} />
        <input value={end} onChange={e => setEnd(e.target.value)} placeholder="end odometer" />
        <button>Log Mileage</button>
      </form>
    </div>
  );
}
