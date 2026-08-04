// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    return (
        <div className={`layout ${isDashboard ? 'no-sidebar' : ''}`}>
            {!isDashboard && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}
            <div className={`main-content ${isDashboard ? 'full-width' : (sidebarOpen ? 'sidebar-open' : 'sidebar-closed')}`}>
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;