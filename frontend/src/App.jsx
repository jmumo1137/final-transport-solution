import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from './features/auth/authSlice';

// Import all pages from src/pages
import LoginForm from './pages/LoginForm';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Fuel from './pages/Fuel';
import Mileage from './pages/Mileage';
import Documents from './pages/Documents';
import Payment from './pages/Payment';

function App() {
  const token = useSelector(selectToken);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/orders" element={token ? <Orders /> : <Navigate to="/login" />} />
        <Route path="/fuel/:id" element={token ? <Fuel /> : <Navigate to="/login" />} />
        <Route path="/mileage/:id" element={token ? <Mileage /> : <Navigate to="/login" />} />
        <Route path="/documents/:id" element={token ? <Documents /> : <Navigate to="/login" />} />
        <Route path="/payment/:id" element={token ? <Payment /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
