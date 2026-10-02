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

    const loadIssue = async () => {
        setLoading(true);
        let found = null;
        try {
            found = await api.getIssue(id);
        } catch (_) {}

        if (!found || !found.irNo) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                if (data && data.issues) {
                    found = data.issues.find(i => i.irNo === id);
                }
            } catch (error) {
                console.error('Error loading issue:', error);
            }
        }
        setIssue(found || null);
        setLoading(false);
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

    const issuedQty = issue.issuedQuantity !== undefined ? issue.issuedQuantity : (issue.isSiteReturn ? 0 : issue.quantity);
    const returnQty = issue.returnQuantity !== undefined ? issue.returnQuantity : (issue.isSiteReturn ? issue.quantity : 0);

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
                        <span className="value">{issue.itemName}</span>
                    </div>
                    <div>
                        <span className="label">Issued Quantity</span>
                        <span className="value" style={{ color: '#dc2626', fontWeight: '600' }}>
                            {issuedQty > 0 ? `-${issuedQty} ${issue.unit || ''}` : '—'}
                        </span>
                    </div>
                    <div>
                        <span className="label">Return Quantity</span>
                        <span className="value" style={{ color: '#059669', fontWeight: '600' }}>
                            {returnQty > 0 ? `+${returnQty} ${issue.returnUnit || issue.unit || ''}` : '—'}
                        </span>
                    </div>
                    <div>
                        <span className="label">Vehicle No.</span>
                        <span className="value">{issue.vehicleNo || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Station</span>
                        <span className="value">{issue.station || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Location</span>
                        <span className="value">{issue.location || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Issued To / Handed To</span>
                        <span className="value">{issue.issuedTo}</span>
                    </div>
                    <div>
                        <span className="label">Store Keeper</span>
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

            {/* Source Document */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Source Document
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        {issue.sourceDocType}
                    </span>
                    {issue.sourceReference ? (
                        issue.sourceDocType === 'COMPLAINT' ? (
                            <Link
                                to={`/complaints/view/${encodeURIComponent(issue.sourceReference)}`}
                                style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', fontSize: '0.95rem' }}
                            >
                                {issue.sourceReference}
                            </Link>
                        ) : (
                            <strong style={{ fontSize: '0.95rem' }}>{issue.sourceReference}</strong>
                        )
                    ) : (
                        <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.85rem' }}>No reference required</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueDetail;
