import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from './features/auth/authSlice';

// Import pages
import LoginForm from './pages/LoginForm';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Fuel from './pages/Fuel';
import Mileage from './pages/Mileage';
import Documents from './pages/Documents';
import Payment from './pages/Payment';
import DriverDashboard from './pages/DriverDashboard';
import DriverOrders from './pages/DriverOrders';
import AddVehicle from './pages/AddVehicle';
import Trucks from './pages/Trucks';
import Trailers from './pages/Trailers';
import Assignments from './pages/Assignments';
import Alerts from './pages/Alerts';
import Sidebar from './pages/Sidebar';

function App() {
  const token = useSelector(selectToken);

  return (
    <Router>
      {token && <Sidebar />} {/* Show sidebar only if logged in */}
      <div style={{ marginLeft: token ? '200px' : '0', padding: '20px' }}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/orders" element={<DriverOrders />} />
          <Route path="/orders" element={token ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/fuel/:id" element={token ? <Fuel /> : <Navigate to="/login" />} />
          <Route path="/mileage/:id" element={token ? <Mileage /> : <Navigate to="/login" />} />
          <Route path="/documents/:id" element={token ? <Documents /> : <Navigate to="/login" />} />
          <Route path="/payment/:id" element={token ? <Payment /> : <Navigate to="/login" />} />
          <Route path="/add-vehicle" element={token ? <AddVehicle /> : <Navigate to="/login" />} />
          <Route path="/trucks" element={token ? <Trucks /> : <Navigate to="/login" />} />
          <Route path="/trailers" element={token ? <Trailers /> : <Navigate to="/login" />} />
          <Route path="/assignments" element={token ? <Assignments /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={token ? <Alerts /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
