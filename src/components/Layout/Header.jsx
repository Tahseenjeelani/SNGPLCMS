// src/components/Layout/Header.jsx
import React from 'react';
import { FaBars, FaUser } from 'react-icons/fa';
import './Header.css';

const Header = ({ toggleSidebar }) => {
    return (
        <header className="header">
            <div className="header-left">
            </div>

            <div className="header-right">
                <div className="user-info">
                    <FaUser className="user-icon" />
                    <span className="user-name">Admin</span>
                </div>
            </div>
        </header>
    );
};

export default Header;