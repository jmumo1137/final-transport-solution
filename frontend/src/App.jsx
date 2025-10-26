import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken, selectUserRole } from './features/auth/authSlice';

// Pages
import LandingPage from './pages/LandingPage';
import LoginForm from './pages/LoginForm';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateOrder from './pages/CreateOrder';
import OrdersList from './pages/OrdersList';
import Fuel from './pages/Fuel';
import Mileage from './pages/Mileage';
import Documents from './pages/Documents';
import Payment from './pages/Payment';
import DriverDashboard from './pages/DriverDashboard';
import DriverOrders from './pages/DriverOrders';
import Trucks from './pages/Trucks';
import Trailers from './pages/Trailers';
import Assignments from './pages/Assignments';
import Alerts from './pages/Alerts';
import Sidebar from './pages/Sidebar';

// Wrapper to redirect based on user role
function DashboardWrapper() {
  const role = useSelector(selectUserRole);

  switch (role) {
    case 'driver':
      return <DriverDashboard />;
    case 'consignee': // customer role
      return <CustomerDashboard />; // Or create a dedicated CustomerDashboard
    case 'dispatcher':
    case 'admin':
    case 'operations':
      return <Dashboard />;
    default:
      return <LandingPage />;
  }
}

function App() {
  const token = useSelector(selectToken);

  return (
    <Router>
      {/* Sidebar visible only if logged in */}
      {token && <Sidebar />}

      <div style={{ marginLeft: token ? '200px' : '0', padding: '20px' }}>
        <Routes>
          {/* Landing / Login */}
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={<LoginForm />} />

          {/* Dashboard Wrapper with role-based redirection */}
          <Route path="/dashboard" element={token ? <DashboardWrapper /> : <Navigate to="/login" />} />

          {/* Driver Routes */}
          <Route path="/driver" element={token ? <DriverDashboard /> : <Navigate to="/login" />} />
          <Route path="/driver/orders" element={token ? <DriverOrders /> : <Navigate to="/login" />} />

          {/* Customer / Consignee Routes */}
          <Route path="/customer-dashboard" element={token ? <CustomerDashboard /> : <Navigate to="/login" />} />

          {/* General Operations/Admin Routes */}
          <Route path="/orders" element={token ? <OrdersList /> : <Navigate to="/login" />} />
          <Route path="/orders/create" element={token ? <CreateOrder /> : <Navigate to="/login" />} />
          <Route path="/fuel/:id" element={token ? <Fuel /> : <Navigate to="/login" />} />
          <Route path="/mileage/:id" element={token ? <Mileage /> : <Navigate to="/login" />} />
          <Route path="/documents/:id" element={token ? <Documents /> : <Navigate to="/login" />} />
          <Route path="/payment/:id" element={token ? <Payment /> : <Navigate to="/login" />} />
          <Route path="/trucks" element={token ? <Trucks /> : <Navigate to="/login" />} />
          <Route path="/trailers" element={token ? <Trailers /> : <Navigate to="/login" />} />
          <Route path="/assignments" element={token ? <Assignments /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={token ? <Alerts /> : <Navigate to="/login" />} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
