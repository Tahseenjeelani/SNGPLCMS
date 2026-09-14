// src/components/CashPurchase/PurchaseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaLock, FaBoxes } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const PurchaseDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchase();
    }, [id]);

    const loadPurchase = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.purchases) {
                const found = data.purchases.find(p => p.cpNo === id);
                setPurchase(found || null);
            }
        } catch (error) {
            console.error('Error loading purchase:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading cash purchase details...</div>;
    }

    if (!purchase) {
        return (
            <div className="page-container">
                <div className="card text-center" style={{ padding: '40px' }}>
                    <h2>Cash Purchase Not Found</h2>
                    <p style={{ margin: '16px 0', color: '#6b7280' }}>Purchase number "{id}" could not be found.</p>
                    <button onClick={() => navigate('/purchases')} className="btn btn-primary">
                        <FaArrowLeft /> Back to Cash Purchases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Cash Purchase: {purchase.cpNo}</h1>
                    <span className="badge badge-secondary" style={{ marginTop: '8px', color: getTradeSectionColor(purchase.tradeSection) }}>
                        {getTradeSectionLabel(purchase.tradeSection)}
                    </span>
                </div>
                <div className="page-actions">
                    <button onClick={() => navigate('/purchases')} className="btn btn-outline">
                        <FaArrowLeft /> Back
                    </button>
                    <Link to={`/purchases/edit/${purchase.cpNo}`} className="btn btn-primary">
                        <FaEdit /> Edit Purchase
                    </Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Purchase Details
                </h3>
                <div className="detail-grid">
                    <div>
                        <span className="label">CP Number</span>
                        <span className="value">{purchase.cpNo}</span>
                    </div>
                    <div>
                        <span className="label">Purchase Date</span>
                        <span className="value">{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="label">Bill / Invoice No</span>
                        <span className="value">{purchase.billInvoiceNo || '-'}</span>
                    </div>
                    <div>
                        <span className="label">Purchased By</span>
                        <span className="value">{purchase.purchasedBy}</span>
                    </div>
                    <div>
                        <span className="label">Job No</span>
                        <span className="value">{purchase.jobNo || '-'}</span>
                    </div>
                    <div>
                        <span className="label">Expense Head</span>
                        <span className="value">{purchase.expenseHead || '-'}</span>
                    </div>
                    <div>
                        <span className="label">Total Amount</span>
                        <span className="value" style={{ color: '#059669', fontWeight: '700' }}>PKR {purchase.totalAmount}</span>
                    </div>
                    <div>
                        <span className="label">Stock Update</span>
                        <span className="value">
                            {purchase.addedToStock ? (
                                <span className="badge badge-success"><FaBoxes /> Added to Stock</span>
                            ) : (
                                <span className="badge badge-secondary">Consumable</span>
                            )}
                        </span>
                    </div>
                </div>

                {purchase.remarks && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                            Remarks
                        </span>
                        <p style={{ margin: 0, color: '#374151' }}>{purchase.remarks}</p>
                    </div>
                )}
            </div>

            {/* Purchase Items */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Purchased Items ({purchase.items ? purchase.items.length : 0})
                </h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                <th>Stock Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.items && purchase.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td><strong>{item.itemName}</strong></td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unit}</td>
                                    <td>PKR {item.unitPrice}</td>
                                    <td>PKR {item.total}</td>
                                    <td>
                                        {item.isStoreItem ? (
                                            <span className="badge badge-success">Store Item</span>
                                        ) : (
                                            <span className="badge badge-secondary">Direct Expense</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Source Document */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                    Source Document
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        {purchase.sourceDocType}
                    </span>
                    {purchase.sourceReference ? (
                        purchase.sourceDocType === 'COMPLAINT' ? (
                            <Link
                                to={`/complaints/view/${encodeURIComponent(purchase.sourceReference)}`}
                                style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', fontSize: '0.95rem' }}
                            >
                                {purchase.sourceReference}
                            </Link>
                        ) : (
                            <strong style={{ fontSize: '0.95rem' }}>{purchase.sourceReference}</strong>
                        )
                    ) : (
                        <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.85rem' }}>No reference required</span>
                    )}
                </div>
                {purchase.isStoreStockItem && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '600', fontSize: '0.85rem' }}>
                        ✓ Marked as Store Stock Item — appears in Stock Register
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseDetail;
