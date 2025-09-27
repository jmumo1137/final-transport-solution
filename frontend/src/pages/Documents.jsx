import React, { useState } from 'react';
import API from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from '../features/auth/authSlice';

export default function Documents() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!file) return alert('POD required');
    const fd = new FormData();
    fd.append('pod', file);
    try {
      await API.post(`/documents/${id}/pod`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('POD uploaded & order marked delivered');
      nav(`/orders/${id}/payment`);
    } catch (err) {
      alert(err?.response?.data?.error || 'upload failed');
    }
  }

  return (
    <div>
      <h3>Upload POD — Order {id}</h3>
      <form onSubmit={submit}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button>Upload POD</button>
      </form>
    </div>
  );
}
