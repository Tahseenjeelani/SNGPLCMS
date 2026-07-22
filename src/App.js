// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ComplaintList from './components/Complaints/ComplaintList';
import ComplaintForm from './components/Complaints/ComplaintForm';
import ComplaintComplete from './components/Complaints/ComplaintComplete';
import IssueList from './components/IssueRegister/IssueList';
import IssueForm from './components/IssueRegister/IssueForm';
import PurchaseList from './components/CashPurchase/PurchaseList';
import PurchaseForm from './components/CashPurchase/PurchaseForm';
import ScrapList from './components/ScrapReturn/ScrapList';
import ScrapForm from './components/ScrapReturn/ScrapForm';
import StockList from './components/StockRegister/StockList';
import StockForm from './components/StockRegister/StockForm';
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

                    <Route path="/complaints" element={<ComplaintList />} />
                    <Route path="/complaints/new" element={<ComplaintForm />} />
                    <Route path="/complaints/edit/:id" element={<ComplaintForm />} />
                    <Route path="/complaints/complete/:id" element={<ComplaintComplete />} />

                    <Route path="/issues" element={<IssueList />} />
                    <Route path="/issues/new" element={<IssueForm />} />
                    <Route path="/issues/edit/:id" element={<IssueForm />} />

                    <Route path="/purchases" element={<PurchaseList />} />
                    <Route path="/purchases/new" element={<PurchaseForm />} />
                    <Route path="/purchases/edit/:id" element={<PurchaseForm />} />

                    <Route path="/scraps" element={<ScrapList />} />
                    <Route path="/scraps/new" element={<ScrapForm />} />
                    <Route path="/scraps/edit/:id" element={<ScrapForm />} />

                    <Route path="/stock" element={<StockList />} />
                    <Route path="/stock/new" element={<StockForm />} />
                    <Route path="/stock/edit/:id" element={<StockForm />} />
                    <Route path="/stock/history/:id" element={<StockHistory />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;