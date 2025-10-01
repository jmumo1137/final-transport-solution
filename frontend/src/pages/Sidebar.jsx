import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserRole, logout } from '../features/auth/authSlice';
import { 
    FaTachometerAlt, FaTruck, FaTasks, FaBell, 
    FaClipboardList, FaUser, FaTruckMoving, FaBars, FaSignOutAlt
} from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const role = useSelector(selectUserRole);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <FaTachometerAlt />, roles: ['admin','dispatcher','operations','driver','customer','accounts'] },
        { name: 'Trucks', path: '/trucks', icon: <FaTruck />, roles: ['admin','dispatcher','operations'] },
        { name: 'Trailers', path: '/trailers', icon: <FaTruckMoving />, roles: ['admin','dispatcher','operations'] },
        { name: 'Assignments', path: '/assignments', icon: <FaTasks />, roles: ['admin','dispatcher','operations'] },
        { name: 'Alerts', path: '/alerts', icon: <FaBell />, roles: ['admin','dispatcher','operations'] },
        { name: 'Orders', path: '/orders', icon: <FaClipboardList />, roles: ['admin','dispatcher','operations','customer'] },
        { name: 'Driver', path: '/driver', icon: <FaUser />, roles: ['driver'] },
    ];

    return (
        <>
            {/* Mobile hamburger button */}
            <button className="mobile-toggle" onClick={toggleMobileSidebar}>
                <FaBars size={24} />
            </button>

            <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <h2>{collapsed ? 'TP' : 'Transport Portal'}</h2>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {collapsed ? '➡️' : '⬅️'}
                </button>

                <nav className="menu">
                    <ul>
                        {menuItems
                            .filter(item => item.roles.includes(role))
                            .map(item => (
                                <li 
                                    key={item.path} 
                                    className={location.pathname === item.path ? 'active' : ''} 
                                    title={collapsed ? item.name : ''} 
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Link to={item.path}>
                                        <span className="icon">{item.icon}</span>
                                        {!collapsed && <span className="text">{item.name}</span>}
                                    </Link>
                                </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout at bottom */}
                <div className="logout-section" onClick={handleLogout}>
                    <span className="icon"><FaSignOutAlt /></span>
                    {!collapsed && <span className="text">Logout</span>}
                </div>
            </div>
        </>
    );
}
