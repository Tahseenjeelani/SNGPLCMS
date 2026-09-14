import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';

// Complaints
import ComplaintList from './components/Complaints/ComplaintList';
import ComplaintForm from './components/Complaints/ComplaintForm';
import ComplaintDetail from './components/Complaints/ComplaintDetail';

// Issue Register
import IssueList from './components/IssueRegister/IssueList';
import IssueForm from './components/IssueRegister/IssueForm';
import IssueDetail from './components/IssueRegister/IssueDetail';

// Cash Purchase Register
import PurchaseList from './components/CashPurchase/PurchaseList';
import PurchaseForm from './components/CashPurchase/PurchaseForm';
import PurchaseDetail from './components/CashPurchase/PurchaseDetail';

// Scrap / Return Register
import ScrapList from './components/ScrapReturn/ScrapList';
import ScrapForm from './components/ScrapReturn/ScrapForm';
import ScrapDetail from './components/ScrapReturn/ScrapDetail';

// Stock Register (read-only aggregated view — no form)
import StockList from './components/StockRegister/StockList';
import StockHistory from './components/StockRegister/StockHistory';

import { initializeData } from './data/initialData';
import './App.css';

function App() {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        initializeData();
        setIsInitialized(true);
    }, []);

    if (!isInitialized) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Complaints — Parent Hub */}
                    <Route path="/complaints" element={<ComplaintList />} />
                    <Route path="/complaints/new" element={<ComplaintForm />} />
                    <Route path="/complaints/view/:id" element={<ComplaintDetail />} />
                    <Route path="/complaints/edit/:id" element={<ComplaintForm />} />

                    {/* Issue Register */}
                    <Route path="/issues" element={<IssueList />} />
                    <Route path="/issues/new" element={<IssueForm />} />
                    <Route path="/issues/view/:id" element={<IssueDetail />} />
                    <Route path="/issues/edit/:id" element={<IssueForm />} />

                    {/* Cash Purchase Register */}
                    <Route path="/purchases" element={<PurchaseList />} />
                    <Route path="/purchases/new" element={<PurchaseForm />} />
                    <Route path="/purchases/view/:id" element={<PurchaseDetail />} />
                    <Route path="/purchases/edit/:id" element={<PurchaseForm />} />

                    {/* Scrap / Return Register */}
                    <Route path="/scraps" element={<ScrapList />} />
                    <Route path="/scraps/new" element={<ScrapForm />} />
                    <Route path="/scraps/view/:id" element={<ScrapDetail />} />
                    <Route path="/scraps/edit/:id" element={<ScrapForm />} />

                    {/* Stock Register — read-only, no /new or /edit routes */}
                    <Route path="/stock" element={<StockList />} />
                    <Route path="/stock/history/:id" element={<StockHistory />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;