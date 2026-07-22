// src/components/Complaints/ComplaintComplete.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheck, FaTimes, FaLock, FaClipboardList } from 'react-icons/fa';

const ComplaintComplete = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [linkedIssues, setLinkedIssues] = useState([]);
    const [linkedPurchases, setLinkedPurchases] = useState([]);
    const [linkedScraps, setLinkedScraps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const complaint = data.complaints.find(c => c.id === id);

            if (!complaint) {
                alert('Complaint not found');
                navigate('/complaints');
                return;
            }

            setComplaint(complaint);

            // Find linked entries
            const issues = data.issues.filter(i =>
                i.sourceDocuments.some(s => s.reference === id && s.status !== 'COMPLETED')
            );
            setLinkedIssues(issues);

            const purchases = data.purchases.filter(p =>
                p.sourceDocuments.some(s => s.reference === id && s.status !== 'COMPLETED')
            );
            setLinkedPurchases(purchases);

            const scraps = data.scraps.filter(s =>
                s.sourceDocuments.some(sd => sd.reference === id && sd.status !== 'COMPLETED')
            );
            setLinkedScraps(scraps);

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data');
            navigate('/complaints');
        }
    };

    const handleComplete = () => {
        if (!window.confirm('Are you sure you want to complete this complaint? This will lock all linked entries.')) {
            return;
        }

        setProcessing(true);

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const now = new Date().toISOString();

            // Update complaint
            const complaintIndex = data.complaints.findIndex(c => c.id === id);
            if (complaintIndex !== -1) {
                data.complaints[complaintIndex] = {
                    ...data.complaints[complaintIndex],
                    status: 'COMPLETED',
                    isCompleted: true,
                    completedDate: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now
                };
            }

            // Lock linked issues
            linkedIssues.forEach(issue => {
                const issueIndex = data.issues.findIndex(i => i.irNo === issue.irNo);
                if (issueIndex !== -1) {
                    const sourceDocIndex = data.issues[issueIndex].sourceDocuments.findIndex(
                        s => s.reference === id
                    );
                    if (sourceDocIndex !== -1) {
                        data.issues[issueIndex].sourceDocuments[sourceDocIndex] = {
                            ...data.issues[issueIndex].sourceDocuments[sourceDocIndex],
                            status: 'COMPLETED',
                            isLocked: true,
                            lockedAt: now,
                            lockedBy: 'Admin'
                        };
                    }
                }
            });

            // Lock linked purchases
            linkedPurchases.forEach(purchase => {
                const purchaseIndex = data.purchases.findIndex(p => p.cpNo === purchase.cpNo);
                if (purchaseIndex !== -1) {
                    const sourceDocIndex = data.purchases[purchaseIndex].sourceDocuments.findIndex(
                        s => s.reference === id
                    );
                    if (sourceDocIndex !== -1) {
                        data.purchases[purchaseIndex].sourceDocuments[sourceDocIndex] = {
                            ...data.purchases[purchaseIndex].sourceDocuments[sourceDocIndex],
                            status: 'COMPLETED',
                            isLocked: true,
                            lockedAt: now,
                            lockedBy: 'Admin'
                        };
                    }
                }
            });

            // Lock linked scraps
            linkedScraps.forEach(scrap => {
                const scrapIndex = data.scraps.findIndex(s => s.srNo === scrap.srNo);
                if (scrapIndex !== -1) {
                    const sourceDocIndex = data.scraps[scrapIndex].sourceDocuments.findIndex(
                        sd => sd.reference === id
                    );
                    if (sourceDocIndex !== -1) {
                        data.scraps[scrapIndex].sourceDocuments[sourceDocIndex] = {
                            ...data.scraps[scrapIndex].sourceDocuments[sourceDocIndex],
                            status: 'COMPLETED',
                            isLocked: true,
                            lockedAt: now,
                            lockedBy: 'Admin'
                        };
                    }
                }
            });

            localStorage.setItem('snglData', JSON.stringify(data));
            alert('Complaint completed successfully!');
            navigate('/complaints');
        } catch (error) {
            console.error('Error completing complaint:', error);
            alert('Error completing complaint');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!complaint) {
        return <div className="empty-state">Complaint not found</div>;
    }

    const hasLinks = linkedIssues.length > 0 || linkedPurchases.length > 0 || linkedScraps.length > 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Complete Complaint</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/complaints')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="complaint-summary">
                    <h3>Complaint Details</h3>
                    <div className="summary-grid">
                        <div>
                            <span className="label">Complaint #</span>
                            <span className="value">{complaint.id}</span>
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
                            <span className="label">Attended By</span>
                            <span className="value">{complaint.attendedBy || 'Not assigned'}</span>
                        </div>
                    </div>
                </div>

                {!hasLinks ? (
                    <div className="alert alert-warning">
                        <FaClipboardList />
                        <div>
                            <strong>No linked entries found!</strong>
                            <p>This complaint has no linked issues, purchases, or scraps. You can still complete it.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {linkedIssues.length > 0 && (
                            <div className="linked-section">
                                <h4>Linked Issues ({linkedIssues.length})</h4>
                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Issue #</th>
                                                <th>Item</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedIssues.map(issue => (
                                                <tr key={issue.irNo}>
                                                    <td>{issue.irNo}</td>
                                                    <td>{issue.itemName}</td>
                                                    <td>{issue.quantity} {issue.unit}</td>
                                                    <td>
                                                        <span className="badge badge-warning">Pending</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {linkedPurchases.length > 0 && (
                            <div className="linked-section">
                                <h4>Linked Purchases ({linkedPurchases.length})</h4>
                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Purchase #</th>
                                                <th>Total Amount</th>
                                                <th>Trade Section</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedPurchases.map(purchase => (
                                                <tr key={purchase.cpNo}>
                                                    <td>{purchase.cpNo}</td>
                                                    <td>${purchase.totalAmount}</td>
                                                    <td>{purchase.tradeSection}</td>
                                                    <td>
                                                        <span className="badge badge-warning">Pending</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {linkedScraps.length > 0 && (
                            <div className="linked-section">
                                <h4>Linked Scraps ({linkedScraps.length})</h4>
                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Scrap #</th>
                                                <th>Item</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedScraps.map(scrap => (
                                                <tr key={scrap.srNo}>
                                                    <td>{scrap.srNo}</td>
                                                    <td>{scrap.itemName}</td>
                                                    <td>{scrap.quantity} {scrap.unit}</td>
                                                    <td>
                                                        <span className="badge badge-warning">Pending</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="alert alert-info">
                    <FaLock />
                    <div>
                        <strong>Confirm Completion</strong>
                        <p>
                            Completing this complaint will lock all linked entries.
                            {hasLinks ? ' This action cannot be undone.' : ' This will mark the complaint as completed.'}
                        </p>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        onClick={handleComplete}
                        className="btn btn-success"
                        disabled={processing}
                    >
                        <FaCheck /> {processing ? 'Processing...' : 'Complete Complaint'}
                    </button>
                    <button
                        onClick={() => navigate('/complaints')}
                        className="btn btn-outline"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintComplete;