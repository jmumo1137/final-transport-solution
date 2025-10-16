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
    const [openSubmenu, setOpenSubmenu] = useState(null);

    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const handleSubmenuToggle = (name) => {
        setOpenSubmenu(openSubmenu === name ? null : name);
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: <FaTachometerAlt />,
            roles: ['admin', 'dispatcher', 'operations', 'driver', 'customer', 'accounts'],
        },
        {
            name: 'Orders',
            icon: <FaClipboardList />,
            roles: ['admin', 'dispatcher', 'operations', 'customer'],
            subItems: role === 'customer'
                ? [
                    { name: 'My Orders', path: '/orders' },
                    { name: 'Create Order', path: '/orders/create' },
                  ]
                : [
                    { name: 'All Orders', path: '/orders' },
                    { name: 'Create Order', path: '/orders/create' },
                  ],
        },
        {
            name: 'Trucks',
            path: '/trucks',
            icon: <FaTruck />,
            roles: ['admin', 'dispatcher', 'operations'],
        },
        {
            name: 'Trailers',
            path: '/trailers',
            icon: <FaTruckMoving />,
            roles: ['admin', 'dispatcher', 'operations'],
        },
        {
            name: 'Assignments',
            path: '/assignments',
            icon: <FaTasks />,
            roles: ['admin', 'dispatcher', 'operations'],
        },
        {
            name: 'Alerts',
            path: '/alerts',
            icon: <FaBell />,
            roles: ['admin', 'dispatcher', 'operations'],
        },
        {
            name: 'Driver',
            path: '/driver',
            icon: <FaUser />,
            roles: ['driver'],
        },
    ];

    return (
        <>
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
                                    key={item.name}
                                    className={`menu-item ${
                                        location.pathname === item.path ||
                                        (item.subItems && item.subItems.some(sub => sub.path === location.pathname))
                                            ? 'active'
                                            : ''
                                    }`}
                                    title={collapsed ? item.name : ''}
                                >
                                    {item.subItems ? (
                                        <>
                                            <div
                                                className="menu-parent"
                                                onClick={() => handleSubmenuToggle(item.name)}
                                            >
                                                <span className="icon">{item.icon}</span>
                                                {!collapsed && (
                                                    <span className="text">
                                                        {item.name}
                                                        <span className="arrow">
                                                            {openSubmenu === item.name ? '▲' : '▼'}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            {!collapsed && openSubmenu === item.name && (
                                                <ul className="submenu">
                                                    {item.subItems.map(sub => (
                                                        <li
                                                            key={sub.path}
                                                            className={location.pathname === sub.path ? 'active' : ''}
                                                            onClick={() => setMobileOpen(false)}
                                                        >
                                                            <Link to={sub.path}>{sub.name}</Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link to={item.path} onClick={() => setMobileOpen(false)}>
                                            <span className="icon">{item.icon}</span>
                                            {!collapsed && <span className="text">{item.name}</span>}
                                        </Link>
                                    )}
                                </li>
                            ))}
                    </ul>
                </nav>

                <div className="logout-section" onClick={handleLogout}>
                    <span className="icon"><FaSignOutAlt /></span>
                    {!collapsed && <span className="text">Logout</span>}
                </div>
            </div>
        </>
    );
}
