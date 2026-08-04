// src/components/Complaints/ComplaintDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaCheck, FaLock, FaEye } from 'react-icons/fa';
import { api } from '../../services/api';

const ComplaintDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [linkedEntries, setLinkedEntries] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadComplaintData();
    }, [id]);

    const loadComplaintData = async () => {
        setLoading(true);
        let foundComplaint = null;

        // Try loading complaint from localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.complaints) {
                foundComplaint = data.complaints.find(c => c.id === id);
            }
        } catch (error) {
            console.error('Error reading complaint from localStorage:', error);
        }

        // Fallback to API if not in localStorage
        if (!foundComplaint) {
            try {
                foundComplaint = await api.getComplaint(id);
            } catch (error) {
                console.error('Error fetching complaint from API:', error);
            }
        }

        setComplaint(foundComplaint);

        // Load linked entries
        if (id) {
            await loadLinkedEntries(id);
        }

        setLoading(false);
    };

    const loadLinkedEntries = async (complaintId) => {
        try {
            const data = await api.getComplaintLinks(complaintId);
            if (data && (data.issues || data.purchases || data.scraps)) {
                setLinkedEntries(data);
                return;
            }
        } catch (error) {
            console.warn('API getComplaintLinks failed, using localStorage fallback:', error);
        }

        // Fallback to localStorage
        try {
            const localData = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (localData.issues || []).reduce((acc, issue) => {
                const doc = (issue.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        irNo: issue.irNo,
                        itemName: issue.itemName,
                        allocation: doc.allocation,
                        unit: issue.unit,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        issueDate: issue.issueDate,
                        issuedTo: issue.issuedTo
                    });
                }
                return acc;
            }, []);

            const purchases = (localData.purchases || []).reduce((acc, purchase) => {
                const doc = (purchase.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        cpNo: purchase.cpNo,
                        items: (purchase.items || []).map(i => i.itemName || i),
                        allocation: doc.allocation,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        purchaseDate: purchase.purchaseDate,
                        purchasedBy: purchase.purchasedBy
                    });
                }
                return acc;
            }, []);

            const scraps = (localData.scraps || []).reduce((acc, scrap) => {
                const doc = (scrap.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        srNo: scrap.srNo,
                        itemName: scrap.itemName,
                        allocation: doc.allocation,
                        unit: scrap.unit,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        date: scrap.date,
                        returnedBy: scrap.returnedBy
                    });
                }
                return acc;
            }, []);

            setLinkedEntries({
                complaintId,
                issues,
                purchases,
                scraps
            });
        } catch (err) {
            console.error('Error loading linked entries from localStorage:', err);
        }
    };

    if (loading) {
        return <div className="loading">Loading complaint details...</div>;
    }

    if (!complaint) {
        return (
            <div className="page-container">
                <div className="card text-center" style={{ padding: '40px' }}>
                    <h2>Complaint Not Found</h2>
                    <p style={{ margin: '16px 0', color: '#6b7280' }}>The complaint ID "{id}" could not be found.</p>
                    <button onClick={() => navigate('/complaints')} className="btn btn-primary">
                        <FaArrowLeft /> Back to Complaints
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Complaint: {complaint.id}</h1>
                    <span className={`badge ${complaint.isCompleted ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '8px' }}>
                        {complaint.isCompleted ? '✓ Completed' : complaint.status}
                    </span>
                </div>
                <div className="page-actions">
                    <button onClick={() => navigate('/complaints')} className="btn btn-outline">
                        <FaArrowLeft /> Back
                    </button>
                    <Link to={`/complaints/edit/${complaint.id}`} className="btn btn-primary">
                        <FaEdit /> Edit Complaint
                    </Link>
                    {!complaint.isCompleted && complaint.status !== 'COMPLETED' && (
                        <Link to={`/complaints/complete/${complaint.id}`} className="btn btn-success">
                            <FaCheck /> Complete
                        </Link>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Complaint Information
                </h3>
                <div className="detail-grid">
                    <div>
                        <span className="label">Complaint Date</span>
                        <span className="value">{new Date(complaint.complaintDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="label">Location</span>
                        <span className="value">{complaint.location}</span>
                    </div>
                    <div>
                        <span className="label">Indenter</span>
                        <span className="value">{complaint.indenter}</span>
                    </div>
                    <div>
                        <span className="label">Procurement Type</span>
                        <span className="value">{complaint.procurementType}</span>
                    </div>
                    <div>
                        <span className="label">Attended By</span>
                        <span className="value">{complaint.attendedBy || '-'}</span>
                    </div>
                    <div>
                        <span className="label">Total Bill Amount</span>
                        <span className="value">${complaint.totalBillAmount || 0}</span>
                    </div>
                </div>

                {complaint.remarks && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{complaint.remarks}</p>
                    </div>
                )}
            </div>

            {/* Store Items Table */}
            {complaint.storeItems && complaint.storeItems.length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                        Store Items ({complaint.storeItems.length})
                    </h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item ID</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaint.storeItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.itemId}</td>
                                        <td>{item.itemName}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Market Items Table */}
            {complaint.marketItems && complaint.marketItems.length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                        Market Items ({complaint.marketItems.length})
                    </h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaint.marketItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.itemName}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit}</td>
                                        <td>PKR {item.unitPrice}</td>
                                        <td>PKR {item.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Linked Entries Section */}
            {linkedEntries && (
                <div className="card">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                        Linked Entries for Complaint {id}
                    </h3>

                    {/* Linked Issues */}
                    {linkedEntries.issues && linkedEntries.issues.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#2563EB' }}>
                                Issues ({linkedEntries.issues.length})
                            </h4>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>IR #</th>
                                            <th>Item</th>
                                            <th>Allocation</th>
                                            <th>Unit</th>
                                            <th>Issued To</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {linkedEntries.issues.map(issue => (
                                            <tr key={issue.irNo}>
                                                <td>{issue.irNo}</td>
                                                <td>{issue.itemName}</td>
                                                <td><strong>{issue.allocation}</strong></td>
                                                <td>{issue.unit}</td>
                                                <td>{issue.issuedTo}</td>
                                                <td>
                                                    <span className={`badge ${issue.status === 'COMPLETED' ? 'badge-success' : issue.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                        {issue.isLocked ? '🔒 Locked' : issue.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link to={`/issues/view/${issue.irNo}`} className="btn btn-outline btn-sm" title="View Issue">
                                                        <FaEye /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Linked Purchases */}
                    {linkedEntries.purchases && linkedEntries.purchases.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#2563EB' }}>
                                Purchases ({linkedEntries.purchases.length})
                            </h4>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>CP #</th>
                                            <th>Items</th>
                                            <th>Allocation</th>
                                            <th>Purchased By</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {linkedEntries.purchases.map(purchase => (
                                            <tr key={purchase.cpNo}>
                                                <td>{purchase.cpNo}</td>
                                                <td>{Array.isArray(purchase.items) ? purchase.items.join(', ') : purchase.items}</td>
                                                <td><strong>${purchase.allocation}</strong></td>
                                                <td>{purchase.purchasedBy}</td>
                                                <td>
                                                    <span className={`badge ${purchase.status === 'COMPLETED' ? 'badge-success' : purchase.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                        {purchase.isLocked ? '🔒 Locked' : purchase.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link to={`/purchases/view/${purchase.cpNo}`} className="btn btn-outline btn-sm" title="View Purchase">
                                                        <FaEye /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Linked Scraps */}
                    {linkedEntries.scraps && linkedEntries.scraps.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#2563EB' }}>
                                Scraps ({linkedEntries.scraps.length})
                            </h4>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>SR #</th>
                                            <th>Item</th>
                                            <th>Allocation</th>
                                            <th>Unit</th>
                                            <th>Returned By</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {linkedEntries.scraps.map(scrap => (
                                            <tr key={scrap.srNo}>
                                                <td>{scrap.srNo}</td>
                                                <td>{scrap.itemName}</td>
                                                <td><strong>{scrap.allocation}</strong></td>
                                                <td>{scrap.unit}</td>
                                                <td>{scrap.returnedBy}</td>
                                                <td>
                                                    <span className={`badge ${scrap.status === 'COMPLETED' ? 'badge-success' : scrap.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                        {scrap.isLocked ? '🔒 Locked' : scrap.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link to={`/scraps/view/${scrap.srNo}`} className="btn btn-outline btn-sm" title="View Scrap">
                                                        <FaEye /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(!linkedEntries.issues?.length && !linkedEntries.purchases?.length && !linkedEntries.scraps?.length) && (
                        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                            No linked issues, purchases, or scrap entries found for this complaint.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComplaintDetail;
