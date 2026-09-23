// Updated src/components/Layout/Sidebar.jsx - Remove logo image reference
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaHome,
    FaClipboardList,
    FaExchangeAlt,
    FaShoppingCart,
    FaTrash,
    FaBoxes,
    FaChevronLeft,
    FaChevronRight,
    FaTools
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navItems = [
        { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
        { path: '/complaints', icon: FaClipboardList, label: 'Complaints' },
        { path: '/issues', icon: FaExchangeAlt, label: 'Issue Register' },
        { path: '/purchases', icon: FaShoppingCart, label: 'Cash Purchase' },
        { path: '/scraps', icon: FaTrash, label: 'Scrap Return' },
        { path: '/stock', icon: FaBoxes, label: 'Stock Register' }
    ];

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">
                        <FaTools />
                    </div>
                    <span className="logo-text">SNGPL CMS</span>
                </div>
                <button
                    className="toggle-btn"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={!isOpen ? item.label : ''}
                        data-tooltip={item.label}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="nav-icon" />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="version">v1.0.0</div>
            </div>
        </div>
    );
};

export default Sidebar;