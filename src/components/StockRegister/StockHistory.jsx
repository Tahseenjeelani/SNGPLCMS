// src/components/StockRegister/StockHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBoxes } from 'react-icons/fa';

const StockHistory = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [id]);

    const loadHistory = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const stockItem = data.stock.find(s => s.itemId === id);
            if (stockItem) {
                setItem(stockItem);
            }
        } catch (error) {
            console.error('Error loading stock history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionTypeBadge = (type) => {
        const classes = {
            'OPENING': 'badge-info',
            'ISSUE': 'badge-warning',
            'CASH_PURCHASE': 'badge-success'
        };
        return classes[type] || 'badge-secondary';
    };

    if (loading) {
        return <div className="loading">Loading history...</div>;
    }

    if (!item) {
        return <div className="empty-state">Stock item not found</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <button onClick={() => navigate('/stock')} className="btn btn-outline btn-sm">
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="page-title mt-2">Stock History - {item.itemName}</h1>
                </div>
                <div className="page-actions">
                    <div className="stock-info">
                        <span className="badge badge-info">
                            <FaBoxes /> Current: {item.currentStock} {item.unit}
                        </span>
                        <span className={`badge ${item.status === 'GOOD' ? 'badge-success' : item.status === 'LOW' ? 'badge-warning' : 'badge-danger'}`}>
                            Status: {item.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="stock-details">
                    <div className="detail-grid">
                        <div>
                            <span className="label">Item ID</span>
                            <span className="value">{item.itemId}</span>
                        </div>
                        <div>
                            <span className="label">Category</span>
                            <span className="value">{item.category || '-'}</span>
                        </div>
                        <div>
                            <span className="label">Unit</span>
                            <span className="value">{item.unit}</span>
                        </div>
                        <div>
                            <span className="label">Min Stock</span>
                            <span className="value">{item.minimumStock}</span>
                        </div>
                        <div>
                            <span className="label">Max Stock</span>
                            <span className="value">{item.maximumStock || '-'}</span>
                        </div>
                        <div>
                            <span className="label">Location</span>
                            <span className="value">{item.location || '-'}</span>
                        </div>
                        <div>
                            <span className="label">Unit Price</span>
                            <span className="value">PKR {item.unitPrice}</span>
                        </div>
                        <div>
                            <span className="label">Total Value</span>
                            <span className="value">PKR {item.totalValue}</span>
                        </div>
                    </div>
                </div>

                <h3>Transaction History</h3>
                <div className="table-responsive">
                    {item.transactions && item.transactions.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Document</th>
                                    <th>Quantity</th>
                                    <th>Balance</th>
                                    <th>Source</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {item.transactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td>{new Date(transaction.date).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${getTransactionTypeBadge(transaction.type)}`}>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td>{transaction.documentNo}</td>
                                        <td style={{
                                            color: transaction.quantity < 0 ? 'var(--danger)' : 'var(--success)',
                                            fontWeight: 'bold'
                                        }}>
                                            {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                                        </td>
                                        <td><strong>{transaction.balance}</strong></td>
                                        <td>{transaction.sourceDoc}</td>
                                        <td>{transaction.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        Current Balance:
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {item.currentStock} {item.unit}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>No transactions found for this item</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockHistory;