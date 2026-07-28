// src/components/IssueRegister/IssueDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaLock } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const IssueDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIssue();
    }, [id]);

    const loadIssue = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.issues) {
                const found = data.issues.find(i => i.irNo === id);
                setIssue(found || null);
            }
        } catch (error) {
            console.error('Error loading issue:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading issue details...</div>;
    }

    if (!issue) {
        return (
            <div className="page-container">
                <div className="card text-center" style={{ padding: '40px' }}>
                    <h2>Issue Record Not Found</h2>
                    <p style={{ margin: '16px 0', color: '#6b7280' }}>Issue number "{id}" could not be found.</p>
                    <button onClick={() => navigate('/issues')} className="btn btn-primary">
                        <FaArrowLeft /> Back to Issue Register
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Issue: {issue.irNo}</h1>
                    <span className="badge badge-secondary" style={{ marginTop: '8px', color: getTradeSectionColor(issue.tradeSection) }}>
                        {getTradeSectionLabel(issue.tradeSection)}
                    </span>
                </div>
                <div className="page-actions">
                    <button onClick={() => navigate('/issues')} className="btn btn-outline">
                        <FaArrowLeft /> Back
                    </button>
                    <Link to={`/issues/edit/${issue.irNo}`} className="btn btn-primary">
                        <FaEdit /> Edit Issue
                    </Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Issue Information
                </h3>
                <div className="detail-grid">
                    <div>
                        <span className="label">IR Number</span>
                        <span className="value">{issue.irNo}</span>
                    </div>
                    <div>
                        <span className="label">Issue Date</span>
                        <span className="value">{new Date(issue.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="label">Item Name</span>
                        <span className="value">{issue.itemName} ({issue.itemId})</span>
                    </div>
                    <div>
                        <span className="label">Quantity</span>
                        <span className="value">{issue.quantity} {issue.unit}</span>
                    </div>
                    <div>
                        <span className="label">Issued To</span>
                        <span className="value">{issue.issuedTo}</span>
                    </div>
                    <div>
                        <span className="label">Issued By</span>
                        <span className="value">{issue.issuedBy || '-'}</span>
                    </div>
                </div>

                {issue.description && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Description
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{issue.description}</p>
                    </div>
                )}

                {issue.remarks && (
                    <div style={{ marginTop: '12px' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{issue.remarks}</p>
                    </div>
                )}
            </div>

            {/* Source Documents */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Source Documents ({issue.sourceDocuments ? issue.sourceDocuments.length : 0})
                </h3>

                {issue.sourceDocuments && issue.sourceDocuments.length > 0 ? (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Source Type</th>
                                    <th>Reference</th>
                                    <th>Allocation</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issue.sourceDocuments.map((doc, idx) => (
                                    <tr key={idx}>
                                        <td><span className="badge badge-info">{doc.sourceType}</span></td>
                                        <td>
                                            {doc.sourceType === 'COMPLAINT' ? (
                                                <Link to={`/complaints/view/${encodeURIComponent(doc.reference)}`} style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}>
                                                    {doc.reference}
                                                </Link>
                                            ) : (
                                                <strong>{doc.reference}</strong>
                                            )}
                                        </td>
                                        <td><strong>{doc.allocation}</strong> {issue.unit}</td>
                                        <td>
                                            <span className={`badge ${doc.isLocked ? 'badge-success' : 'badge-warning'}`}>
                                                {doc.isLocked ? <><FaLock /> Locked</> : (doc.status || 'Pending')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No source documents attached.</p>
                )}
            </div>
        </div>
    );
};

export default IssueDetail;
