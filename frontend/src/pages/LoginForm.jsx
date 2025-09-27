import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dispatcher');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setUsername('');
    setPassword('');
    setRole('dispatcher');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { username, password, role });
        const { token, role: userRole, userId } = res.data;
        dispatch(loginSuccess({ token, role: userRole, userId }));
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/login', { username, password });
        const { token, role: userRole, userId } = res.data;
        dispatch(loginSuccess({ token, role: userRole, userId }));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error occurred!');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {isRegister && (
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ marginTop: 10 }}
          >
            <option value="dispatcher">Dispatcher</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
            <option value="consignee">Consignee</option>
          </select>
        )}
        <button type="submit" style={{ marginTop: 10 }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <p
        style={{ marginTop: 10, cursor: 'pointer', color: 'blue' }}
        onClick={toggleForm}
      >
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
      </p>
    </div>
  );
}
