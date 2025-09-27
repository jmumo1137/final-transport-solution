import React, { useState } from 'react';
import API from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';

export default function Fuel() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!file || !liters || !cost) return alert('file + liters + cost required');
    const fd = new FormData();
    fd.append('receipt', file);
    fd.append('liters', liters);
    fd.append('cost', cost);
    try {
      await API.post(`/fuel/${id}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('uploaded');
      nav(`/orders/${id}/mileage`);
    } catch (err) {
      alert(err?.response?.data?.error || 'upload failed');
    }
  }

  return (
    <div>
      <h3>Fuel — Order {id}</h3>
      <form onSubmit={submit}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <input placeholder="liters" value={liters} onChange={e => setLiters(e.target.value)} />
        <input placeholder="cost" value={cost} onChange={e => setCost(e.target.value)} />
        <button>Upload Receipt</button>
      </form>
    </div>
  );
}
