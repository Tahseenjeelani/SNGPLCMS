// src/components/StockRegister/StockList.jsx
import React, { useState, useEffect } from 'react';
import { FaSync, FaSearch, FaChevronDown, FaChevronRight, FaBoxOpen, FaShoppingCart } from 'react-icons/fa';
import { api } from '../../services/api';

const StockList = () => {
    const [stockItems, setStockItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStock();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredItems(stockItems);
            return;
        }
        const term = searchTerm.toLowerCase();
        setFilteredItems(stockItems.filter(i => i.itemName.toLowerCase().includes(term)));
    }, [stockItems, searchTerm]);

    const loadStock = async () => {
        setLoading(true);
        setError('');

        // Try API aggregate endpoint
        try {
            const data = await api.getStock();
            if (Array.isArray(data)) {
                setStockItems(data);
                setLoading(false);
                return;
            }
        } catch (_) {}

        // Fallback: compute locally from localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (data.issues || []).filter(i => i.isActive !== false);
            const purchases = (data.purchases || []).filter(p => p.isActive !== false && p.isStoreStockItem === true);

            const stockMap = {};

            // Inflows from store-marked purchases
            for (const purchase of purchases) {
                for (const item of (purchase.items || [])) {
                    const key = (item.itemName || '').trim().toLowerCase();
                    if (!key) continue;
                    if (!stockMap[key]) {
                        stockMap[key] = {
                            itemName: item.itemName.trim(),
                            unit: item.unit || '',
                            totalPurchased: 0,
                            totalIssued: 0,
                            lastUnitPrice: 0,
                            transactions: []
                        };
                    }
                    stockMap[key].totalPurchased += Number(item.quantity) || 0;
                    stockMap[key].lastUnitPrice = item.unitPrice || stockMap[key].lastUnitPrice;
                    stockMap[key].transactions.push({
                        type: 'PURCHASE',
                        docNo: purchase.cpNo,
                        date: purchase.purchaseDate,
                        quantity: Number(item.quantity) || 0,
                        sourceDocType: purchase.sourceDocType,
                        sourceReference: purchase.sourceReference
                    });
                }
            }

            // Outflows from issues
            for (const issue of issues) {
                const key = (issue.itemName || '').trim().toLowerCase();
                if (!key) continue;
                if (!stockMap[key]) {
                    stockMap[key] = {
                        itemName: issue.itemName.trim(),
                        unit: issue.unit || '',
                        totalPurchased: 0,
                        totalIssued: 0,
                        lastUnitPrice: 0,
                        transactions: []
                    };
                }
                stockMap[key].totalIssued += Number(issue.quantity) || 0;
                if (issue.unit && !stockMap[key].unit) stockMap[key].unit = issue.unit;
                stockMap[key].transactions.push({
                    type: 'ISSUE',
                    docNo: issue.irNo,
                    date: issue.issueDate,
                    quantity: -(Number(issue.quantity) || 0),
                    sourceDocType: issue.sourceDocType,
                    sourceReference: issue.sourceReference
                });
            }

            const result = Object.values(stockMap).map(item => ({
                itemName: item.itemName,
                unit: item.unit,
                totalPurchased: item.totalPurchased,
                totalIssued: item.totalIssued,
                currentBalance: item.totalPurchased - item.totalIssued,
                lastUnitPrice: item.lastUnitPrice,
                estimatedValue: (item.totalPurchased - item.totalIssued) * item.lastUnitPrice,
                transactions: item.transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
            })).sort((a, b) => a.itemName.localeCompare(b.itemName));

            setStockItems(result);
        } catch (e) {
            console.error('Error computing stock:', e);
            setError('Failed to load Stock Register. Please ensure Issues and Cash Purchases are configured.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const getBalanceColor = (balance) => {
        if (balance < 0) return '#dc2626';
        if (balance === 0) return '#f59e0b';
        return '#059669';
    };

    const totalItems = stockItems.length;
    const totalValue = stockItems.reduce((sum, i) => sum + (i.estimatedValue || 0), 0);
    const lowStockItems = stockItems.filter(i => i.currentBalance <= 0);

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                    <p>Computing Stock Register...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Stock Register</h1>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                        Read-only · Auto-computed from Issue Register + Store-marked Cash Purchases
                    </p>
                </div>
                <div className="page-actions">
                    <button onClick={loadStock} className="btn btn-outline">
                        <FaSync /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <SummaryCard label="Total Line Items" value={totalItems} color="#2563eb" />
                <SummaryCard label="Estimated Stock Value" value={`PKR ${totalValue.toLocaleString()}`} color="#059669" />
                <SummaryCard label="Zero / Negative Stock" value={lowStockItems.length} color={lowStockItems.length > 0 ? '#dc2626' : '#059669'} />
            </div>

            {/* Info Banner */}
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.85rem', color: '#1d4ed8', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <div>
                    <strong>How stock is calculated:</strong> Inflows come from Cash Purchase entries marked as "Store Stock Items".
                    Outflows come from all Issue Register entries. Balance = Total Purchased − Total Issued.
                    <br />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <FaShoppingCart size={11} /> Purchase entries → add to stock &nbsp;|&nbsp;
                        <FaBoxOpen size={11} /> Issue entries → deduct from stock
                    </span>
                </div>
            </div>

            <div className="card">
                {/* Search */}
                <div className="search-bar" style={{ marginBottom: '16px' }}>
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '32px' }}></th>
                                <th>Item Name</th>
                                <th>Unit</th>
                                <th style={{ textAlign: 'right' }}>Total Purchased</th>
                                <th style={{ textAlign: 'right' }}>Total Issued</th>
                                <th style={{ textAlign: 'right' }}>Current Balance</th>
                                <th style={{ textAlign: 'right' }}>Last Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Est. Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        {stockItems.length === 0
                                            ? 'No stock data yet. Add Cash Purchases marked as "Store Stock Items" or Issue Register entries.'
                                            : 'No items match your search.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <React.Fragment key={item.itemName}>
                                        <tr
                                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                            style={{ cursor: 'pointer', background: expandedRow === idx ? '#f0f9ff' : undefined }}
                                        >
                                            <td style={{ color: '#9ca3af' }}>
                                                {expandedRow === idx ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                            </td>
                                            <td><strong>{item.itemName}</strong></td>
                                            <td>{item.unit}</td>
                                            <td style={{ textAlign: 'right', color: '#059669' }}>
                                                +{item.totalPurchased}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#dc2626' }}>
                                                -{item.totalIssued}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <strong style={{ color: getBalanceColor(item.currentBalance), fontSize: '1rem' }}>
                                                    {item.currentBalance}
                                                </strong>
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#6b7280' }}>
                                                {item.lastUnitPrice ? `PKR ${item.lastUnitPrice.toLocaleString()}` : '—'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                                {item.estimatedValue > 0 ? `PKR ${item.estimatedValue.toLocaleString()}` : '—'}
                                            </td>
                                        </tr>

                                        {/* Expandable transaction history */}
                                        {expandedRow === idx && (
                                            <tr>
                                                <td colSpan="8" style={{ padding: 0, background: '#f8fafc' }}>
                                                    <div style={{ padding: '12px 16px' }}>
                                                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                                            Transaction History for {item.itemName}
                                                        </p>
                                                        <table style={{ width: '100%', fontSize: '0.82rem' }}>
                                                            <thead>
                                                                <tr style={{ background: '#e2e8f0' }}>
                                                                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Type</th>
                                                                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Document</th>
                                                                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Date</th>
                                                                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Source</th>
                                                                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Qty Change</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(item.transactions || []).map((tx, ti) => (
                                                                    <tr key={ti} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                        <td style={{ padding: '6px 10px' }}>
                                                                            <span style={{
                                                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                                                                                background: tx.type === 'PURCHASE' ? '#dcfce7' : '#fef2f2',
                                                                                color: tx.type === 'PURCHASE' ? '#166534' : '#991b1b'
                                                                            }}>
                                                                                {tx.type === 'PURCHASE' ? '▲ Purchase' : '▼ Issue'}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{tx.docNo}</td>
                                                                        <td style={{ padding: '6px 10px' }}>{formatDate(tx.date)}</td>
                                                                        <td style={{ padding: '6px 10px', color: '#64748b' }}>
                                                                            {tx.sourceDocType}{tx.sourceReference ? ` / ${tx.sourceReference}` : ''}
                                                                        </td>
                                                                        <td style={{
                                                                            padding: '6px 10px', textAlign: 'right', fontWeight: '700',
                                                                            color: tx.quantity > 0 ? '#059669' : '#dc2626'
                                                                        }}>
                                                                            {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} · Stock Register is read-only</span>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, color }) => (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${color}` }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: '700', color }}>{value}</p>
    </div>
);

export default StockList;