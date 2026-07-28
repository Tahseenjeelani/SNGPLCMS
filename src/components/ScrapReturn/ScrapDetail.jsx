// src/components/ScrapReturn/ScrapDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaLock } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const ScrapDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [scrap, setScrap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScrap();
    }, [id]);

    const loadScrap = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.scraps) {
                const found = data.scraps.find(s => s.srNo === id);
                setScrap(found || null);
            }
        } catch (error) {
            console.error('Error loading scrap:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading scrap return details...</div>;
    }

    if (!scrap) {
        return (
            <div className="page-container">
                <div className="card text-center" style={{ padding: '40px' }}>
                    <h2>Scrap Record Not Found</h2>
                    <p style={{ margin: '16px 0', color: '#6b7280' }}>Scrap return number "{id}" could not be found.</p>
                    <button onClick={() => navigate('/scraps')} className="btn btn-primary">
                        <FaArrowLeft /> Back to Scrap Returns
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Scrap Return: {scrap.srNo}</h1>
                    <span className="badge badge-secondary" style={{ marginTop: '8px', color: getTradeSectionColor(scrap.tradeSection) }}>
                        {getTradeSectionLabel(scrap.tradeSection)}
                    </span>
                </div>
                <div className="page-actions">
                    <button onClick={() => navigate('/scraps')} className="btn btn-outline">
                        <FaArrowLeft /> Back
                    </button>
                    <Link to={`/scraps/edit/${scrap.srNo}`} className="btn btn-primary">
                        <FaEdit /> Edit Scrap
                    </Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Scrap Return Information
                </h3>
                <div className="detail-grid">
                    <div>
                        <span className="label">SR Number</span>
                        <span className="value">{scrap.srNo}</span>
                    </div>
                    <div>
                        <span className="label">Date</span>
                        <span className="value">{new Date(scrap.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="label">Item Name</span>
                        <span className="value">{scrap.itemName} ({scrap.itemId})</span>
                    </div>
                    <div>
                        <span className="label">Quantity</span>
                        <span className="value">{scrap.quantity} {scrap.unit}</span>
                    </div>
                    <div>
                        <span className="label">Returned By</span>
                        <span className="value">{scrap.returnedBy}</span>
                    </div>
                    <div>
                        <span className="label">Received By</span>
                        <span className="value">{scrap.receivedBy || '-'}</span>
                    </div>
                </div>

                {scrap.description && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Description
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{scrap.description}</p>
                    </div>
                )}

                {scrap.remarks && (
                    <div style={{ marginTop: '12px' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{scrap.remarks}</p>
                    </div>
                )}
            </div>

            {/* Source Documents */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Source Documents ({scrap.sourceDocuments ? scrap.sourceDocuments.length : 0})
                </h3>

                {scrap.sourceDocuments && scrap.sourceDocuments.length > 0 ? (
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
                                {scrap.sourceDocuments.map((doc, idx) => (
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
                                        <td><strong>{doc.allocation}</strong> {scrap.unit}</td>
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

export default ScrapDetail;
