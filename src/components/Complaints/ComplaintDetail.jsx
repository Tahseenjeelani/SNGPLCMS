// src/components/Complaints/ComplaintDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaEye, FaBoxOpen, FaShoppingCart, FaRecycle, FaCheckCircle, FaClock } from 'react-icons/fa';
import { api } from '../../services/api';

const ComplaintDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [linkedEntries, setLinkedEntries] = useState({ issues: [], purchases: [], scraps: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('issues');

    useEffect(() => {
        loadComplaintData();
    }, [id]);

    const loadComplaintData = async () => {
        setLoading(true);
        let foundComplaint = null;

        // Try API
        try {
            foundComplaint = await api.getComplaint(id);
        } catch (_) {}

        // Fallback to localStorage
        if (!foundComplaint || foundComplaint.error) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                foundComplaint = (data?.complaints || []).find(c => c.id === id) || null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
            }
        }

        setComplaint(foundComplaint);

        // Load linked entries
        await loadLinkedEntries(id);
        setLoading(false);
    };

    const loadLinkedEntries = async (complaintId) => {
        // Try API first
        try {
            const data = await api.getComplaintLinks(complaintId);
            if (data && (data.issues || data.purchases || data.scraps)) {
                setLinkedEntries({
                    issues: data.issues || [],
                    purchases: data.purchases || [],
                    scraps: data.scraps || []
                });
                return;
            }
        } catch (_) {}

        // Fallback to localStorage
        try {
            const localData = JSON.parse(localStorage.getItem('snglData')) || {};

            const issues = (localData.issues || []).filter(
                i => i.sourceDocType === 'COMPLAINT' && i.sourceReference === complaintId
            ).map(i => ({
                irNo: i.irNo,
                itemName: i.itemName,
                quantity: i.quantity,
                unit: i.unit,
                issuedTo: i.issuedTo,
                issueDate: i.issueDate,
                tradeSection: i.tradeSection
            }));

            const purchases = (localData.purchases || []).filter(
                p => p.sourceDocType === 'COMPLAINT' && p.sourceReference === complaintId
            ).map(p => ({
                cpNo: p.cpNo,
                items: (p.items || []).map(i => i.itemName),
                totalAmount: p.totalAmount,
                purchasedBy: p.purchasedBy,
                purchaseDate: p.purchaseDate,
                isStoreStockItem: p.isStoreStockItem
            }));

            const scraps = (localData.scraps || []).filter(
                s => s.sourceDocType === 'COMPLAINT' && s.sourceReference === complaintId
            ).map(s => ({
                srNo: s.srNo,
                itemName: s.itemName,
                quantity: s.quantity,
                unit: s.unit,
                returnedBy: s.returnedBy,
                date: s.date,
                tradeSection: s.tradeSection
            }));

            setLinkedEntries({ issues, purchases, scraps });
        } catch (err) {
            console.error('Error loading linked entries from localStorage:', err);
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state" style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                    <p>Loading complaint details...</p>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="page-container">
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <h2>Complaint Not Found</h2>
                    <p style={{ color: '#6b7280', margin: '16px 0' }}>No complaint found with ID "{id}".</p>
                    <button onClick={() => navigate('/complaints')} className="btn btn-primary">
                        <FaArrowLeft /> Back to Complaints
                    </button>
                </div>
            </div>
        );
    }

    const isOpen = complaint.status === 'Open';
    const tabs = [
        { key: 'issues', label: 'Issues', count: linkedEntries.issues.length, icon: <FaBoxOpen /> },
        { key: 'purchases', label: 'Cash Purchases', count: linkedEntries.purchases.length, icon: <FaShoppingCart /> },
        { key: 'scraps', label: 'Scrap Returns', count: linkedEntries.scraps.length, icon: <FaRecycle /> }
    ];

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Complaint: {complaint.id}</h1>
                    <span
                        className={`badge ${isOpen ? 'badge-warning' : 'badge-success'}`}
                        style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        {isOpen ? <FaClock /> : <FaCheckCircle />}
                        {complaint.status}
                    </span>
                </div>
                <div className="page-actions">
                    <button onClick={() => navigate('/complaints')} className="btn btn-outline">
                        <FaArrowLeft /> Back
                    </button>
                    <Link to={`/complaints/edit/${complaint.id}`} className="btn btn-primary">
                        <FaEdit /> Edit
                    </Link>
                </div>
            </div>

            {/* Complaint Info Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                    Complaint Information
                </h3>
                <div className="detail-grid">
                    <div>
                        <span className="label">Complaint Date</span>
                        <span className="value">{formatDate(complaint.complaintDate)}</span>
                    </div>
                    <div>
                        <span className="label">Station</span>
                        <span className="value">{complaint.station || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Location</span>
                        <span className="value">{complaint.location || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Complainant</span>
                        <span className="value">{complaint.complainant || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Status</span>
                        <span className="value">
                            <span className={`badge ${isOpen ? 'badge-warning' : 'badge-success'}`}>
                                {complaint.status}
                            </span>
                        </span>
                    </div>
                    <div>
                        <span className="label">Created</span>
                        <span className="value">{formatDate(complaint.createdAt)}</span>
                    </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                    <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                        Description
                    </span>
                    <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>{complaint.description || '—'}</p>
                </div>
                {complaint.remarks && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{complaint.remarks}</p>
                    </div>
                )}
            </div>

            {/* Linked Entries Dashboard */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                    Linked Register Entries
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>
                    All Issue, Cash Purchase, and Scrap entries that reference this complaint.
                </p>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                textAlign: 'left',
                                background: activeTab === tab.key ? '#eff6ff' : '#f9fafb',
                                borderLeft: activeTab === tab.key ? '4px solid #2563eb' : '4px solid transparent',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem', color: activeTab === tab.key ? '#2563eb' : '#9ca3af' }}>{tab.icon}</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{tab.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: activeTab === tab.key ? '#1d4ed8' : '#374151' }}>
                                    {tab.count}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Issues Table */}
                {activeTab === 'issues' && (
                    linkedEntries.issues.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>IR #</th>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Issued To</th>
                                        <th>Date</th>
                                        <th>Trade</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedEntries.issues.map(issue => (
                                        <tr key={issue.irNo}>
                                            <td><strong>{issue.irNo}</strong></td>
                                            <td>{issue.itemName}</td>
                                            <td>{issue.quantity}</td>
                                            <td>{issue.unit}</td>
                                            <td>{issue.issuedTo}</td>
                                            <td>{formatDate(issue.issueDate)}</td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    {issue.tradeSection}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/issues/view/${issue.irNo}`} className="btn btn-outline btn-sm">
                                                    <FaEye /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState message="No Issue Register entries linked to this complaint." />
                    )
                )}

                {/* Purchases Table */}
                {activeTab === 'purchases' && (
                    linkedEntries.purchases.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>CP #</th>
                                        <th>Items</th>
                                        <th>Total Amount</th>
                                        <th>Purchased By</th>
                                        <th>Date</th>
                                        <th>Store Stock?</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedEntries.purchases.map(purchase => (
                                        <tr key={purchase.cpNo}>
                                            <td><strong>{purchase.cpNo}</strong></td>
                                            <td>{Array.isArray(purchase.items) ? purchase.items.join(', ') : '—'}</td>
                                            <td>PKR {(purchase.totalAmount || 0).toLocaleString()}</td>
                                            <td>{purchase.purchasedBy}</td>
                                            <td>{formatDate(purchase.purchaseDate)}</td>
                                            <td>
                                                <span className={`badge ${purchase.isStoreStockItem ? 'badge-success' : 'badge-info'}`}>
                                                    {purchase.isStoreStockItem ? '✓ Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/purchases/view/${purchase.cpNo}`} className="btn btn-outline btn-sm">
                                                    <FaEye /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState message="No Cash Purchase entries linked to this complaint." />
                    )
                )}

                {/* Scraps Table */}
                {activeTab === 'scraps' && (
                    linkedEntries.scraps.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>SR #</th>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Returned By</th>
                                        <th>Date</th>
                                        <th>Trade</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedEntries.scraps.map(scrap => (
                                        <tr key={scrap.srNo}>
                                            <td><strong>{scrap.srNo}</strong></td>
                                            <td>{scrap.itemName}</td>
                                            <td>{scrap.quantity}</td>
                                            <td>{scrap.unit}</td>
                                            <td>{scrap.returnedBy}</td>
                                            <td>{formatDate(scrap.date)}</td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    {scrap.tradeSection}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/scraps/view/${scrap.srNo}`} className="btn btn-outline btn-sm">
                                                    <FaEye /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState message="No Scrap Return entries linked to this complaint." />
                    )
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ message }) => (
    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
        <p style={{ margin: 0 }}>{message}</p>
    </div>
);

export default ComplaintDetail;
