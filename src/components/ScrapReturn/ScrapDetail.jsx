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

    const loadScrap = async () => {
        setLoading(true);
        let found = null;
        try {
            found = await api.getScrap(id);
        } catch (_) {}

        if (!found || !found.srNo) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                if (data && data.scraps) {
                    found = data.scraps.find(s => s.srNo === id);
                }
            } catch (error) {
                console.error('Error loading scrap:', error);
            }
        }
        setScrap(found || null);
        setLoading(false);
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

    const items = (scrap.items && scrap.items.length > 0) ? scrap.items : [{
        tradeSection: scrap.tradeSection || 'MASONRY',
        itemName: scrap.itemName || '',
        quantity: scrap.quantity || 1,
        unit: scrap.unit || 'Pieces',
        sourceDocType: scrap.sourceDocType || 'COMPLAINT',
        sourceReference: scrap.sourceReference || ''
    }];

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
                    Section 1: Header Information
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
                        <span className="label">Location</span>
                        <span className="value">{scrap.location || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Returned By</span>
                        <span className="value">{scrap.returnedBy}</span>
                    </div>
                    <div>
                        <span className="label">Source of Shifting</span>
                        <span className="value">{scrap.sourceOfShifting || '—'}</span>
                    </div>
                    <div>
                        <span className="label">Received By</span>
                        <span className="value">{scrap.receivedBy || 'Store Keeper'}</span>
                    </div>
                </div>

                {scrap.remarks && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks (Section 3)
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{scrap.remarks}</p>
                    </div>
                )}
            </div>

            {/* Section 2 Items */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Section 2: Scrap Items ({items.length})
                </h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Trade</th>
                                <th>Item Name</th>
                                <th>Quantity</th>
                                <th>Source Document</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{item.tradeSection || scrap.tradeSection}</span></td>
                                    <td><strong>{item.itemName}</strong></td>
                                    <td style={{ fontWeight: '700', color: '#d97706' }}>{item.quantity} {item.unit}</td>
                                    <td>
                                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                            {item.sourceDocType || scrap.sourceDocType}: {item.sourceReference || scrap.sourceReference || 'None'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScrapDetail;
