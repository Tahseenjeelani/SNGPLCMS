// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import { FaBars, FaBell, FaUser, FaSearch } from 'react-icons/fa';
import './Header.css';

const Header = ({ toggleSidebar }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <FaBars />
                </button>
                /<div className="search-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="header-search"
                    />
                </div>
            </div>

            <div className="header-right">
                <div className="notification-wrapper">
                    <button
                        className="icon-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <FaBell />
                        <span className="notification-badge">3</span>
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-item">
                                <div className="notification-title">Stock Alert</div>
                                <div className="notification-desc">3 items below minimum stock</div>
                            </div>
                            <div className="notification-item">
                                <div className="notification-title">Complaint Completed</div>
                                <div className="notification-desc">Complaint #05/07/2026 closed</div>
                            </div>
                            <div className="notification-item">
                                <div className="notification-title">New Purchase</div>
                                <div className="notification-desc">CP-005 added to stock</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-info">
                    <FaUser className="user-icon" />
                    <span className="user-name">Admin</span>
                </div>
            </div>
        </header>
    );
};

export default Header;