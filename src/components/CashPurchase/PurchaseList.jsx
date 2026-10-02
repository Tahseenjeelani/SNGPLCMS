// src/components/CashPurchase/PurchaseList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch, FaSync, FaCalendarAlt } from 'react-icons/fa';
import { api } from '../../services/api';

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedJobNo, setSelectedJobNo] = useState('ALL');
    const [selectedExpenseHead, setSelectedExpenseHead] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPurchases();
    }, []);

    useEffect(() => {
        filterPurchases();
    }, [purchases, startDate, endDate, selectedJobNo, selectedExpenseHead, searchTerm]);

    const loadPurchases = async () => {
        setLoading(true);
        try {
            const data = await api.getPurchases();
            if (Array.isArray(data)) {
                setPurchases(data);
                setFilteredPurchases(data);
                setLoading(false);
                return;
            }
        } catch (_) {}

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.purchases) {
                setPurchases(data.purchases);
                setFilteredPurchases(data.purchases);
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPurchases = () => {
        let filtered = [...purchases];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                (p.cpNo || '').toLowerCase().includes(term) ||
                (p.billInvoiceNo || '').toLowerCase().includes(term) ||
                (p.purchasedBy || '').toLowerCase().includes(term) ||
                (p.jobNo || '').toLowerCase().includes(term) ||
                (p.expenseHead || '').toLowerCase().includes(term)
            );
        }

        if (startDate) {
            filtered = filtered.filter(p => new Date(p.purchaseDate) >= new Date(startDate));
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(p => new Date(p.purchaseDate) <= end);
        }

        if (selectedJobNo !== 'ALL') {
            filtered = filtered.filter(p => (p.jobNo || '') === selectedJobNo);
        }

        if (selectedExpenseHead !== 'ALL') {
            filtered = filtered.filter(p => (p.expenseHead || '') === selectedExpenseHead);
        }

        setFilteredPurchases(filtered);
    };

    const handleDelete = async (cpNo) => {
        if (window.confirm('Are you sure you want to delete this cash purchase entry?')) {
            try {
                await api.deletePurchase(cpNo);
            } catch (_) {}

            try {
                const data = JSON.parse(localStorage.getItem('snglData')) || {};
                data.purchases = (data.purchases || []).filter(p => p.cpNo !== cpNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadPurchases();
            } catch (error) {
                console.error('Error deleting purchase:', error);
                alert('Error deleting purchase');
            }
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    // Calculate total amount of all bills (filtered)
    const grandTotalAmount = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

    // Dynamic lists for filters
    const existingJobNumbers = Array.from(new Set(purchases.map(p => p.jobNo).filter(Boolean)));
    const existingExpenseHeads = Array.from(new Set(purchases.map(p => p.expenseHead).filter(Boolean)));

    if (loading) {
        return <div className="loading">Loading cash purchases...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Cash Purchases</h1>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                        Register of all direct & store stock cash purchases
                    </p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/purchases/new" className="btn btn-primary">
                        <FaPlus /> New Cash Purchase
                    </Link>
                    <button onClick={loadPurchases} className="btn btn-outline">
                        <FaSync /> Refresh
                    </button>
                </div>
            </div>

            {/* Total Amount of ALL Bills Display */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                        Total Amount of All Bills ({filteredPurchases.length} Records)
                    </div>
                    <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
                        PKR {grandTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div>Filter Active: {selectedJobNo !== 'ALL' || selectedExpenseHead !== 'ALL' || startDate || endDate ? 'Yes' : 'No'}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Search
                        </label>
                        <div className="search-input-wrapper" style={{ width: '100%' }}>
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search CP#, Invoice, Purchased By..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Job No.
                        </label>
                        <select
                            value={selectedJobNo}
                            onChange={(e) => setSelectedJobNo(e.target.value)}
                            className="form-control"
                        >
                            <option value="ALL">All Job Numbers</option>
                            {existingJobNumbers.map(jn => (
                                <option key={jn} value={jn}>{jn}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Expense Head
                        </label>
                        <select
                            value={selectedExpenseHead}
                            onChange={(e) => setSelectedExpenseHead(e.target.value)}
                            className="form-control"
                        >
                            <option value="ALL">All Expense Heads</option>
                            {existingExpenseHeads.map(eh => (
                                <option key={eh} value={eh}>{eh}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {(startDate || endDate || selectedJobNo !== 'ALL' || selectedExpenseHead !== 'ALL' || searchTerm) && (
                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setSelectedJobNo('ALL'); setSelectedExpenseHead('ALL'); setSearchTerm(''); }}
                            className="btn btn-outline btn-sm"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Table: Date, Purchased By, Job No., Expense Head, Total Amount */}
            <div className="card">
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>CP #</th>
                                <th>Date</th>
                                <th>Purchased By</th>
                                <th>Job No.</th>
                                <th>Expense Head</th>
                                <th style={{ textAlign: 'right' }}>Total Amount</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        No cash purchases found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map((purchase) => (
                                    <tr key={purchase.cpNo}>
                                        <td><strong>{purchase.cpNo}</strong></td>
                                        <td>{formatDate(purchase.purchaseDate)}</td>
                                        <td><strong>{purchase.purchasedBy}</strong></td>
                                        <td>{purchase.jobNo || '—'}</td>
                                        <td>
                                            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                                {purchase.expenseHead || '—'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669', fontSize: '1rem' }}>
                                            PKR {(Number(purchase.totalAmount) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                                <Link
                                                    to={`/purchases/view/${purchase.cpNo}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="View"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    to={`/purchases/edit/${purchase.cpNo}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(purchase.cpNo)}
                                                    className="btn btn-danger btn-sm"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Showing {filteredPurchases.length} of {purchases.length} bills</span>
                    <strong>Grand Total: PKR {grandTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                </div>
            </div>
        </div>
    );
};

export default PurchaseList;