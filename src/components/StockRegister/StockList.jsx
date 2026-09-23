// src/components/StockRegister/StockList.jsx
import React, { useState, useEffect } from 'react';
import { FaSync, FaSearch, FaChevronDown, FaChevronRight, FaPlus, FaCalendarCheck, FaTimes, FaUndo, FaCheckCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const StockList = () => {
    const [stockItems, setStockItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTradeTab, setActiveTradeTab] = useState('ALL');
    const [expandedRow, setExpandedRow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        docType: 'MR/D.A.',
        tradeSection: 'MASONRY',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        docRef: '',
        remarks: ''
    });

    const [verifiedDates, setVerifiedDates] = useState({});
    const [auditItem, setAuditItem] = useState(null);
    const [auditDateInput, setAuditDateInput] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadStock();
    }, []);

    useEffect(() => {
        filterItems();
    }, [stockItems, searchTerm, activeTradeTab]);

    const loadStock = async () => {
        setLoading(true);
        setError('');

        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (data.issues || []).filter(i => i.isActive !== false);
            const purchases = (data.purchases || []).filter(p => p.isActive !== false);
            const scraps = (data.scraps || []).filter(s => s.isActive !== false);
            const manualStocks = (data.manualStocks || []);
            const savedVerifiedDates = data.verifiedDates || {};
            setVerifiedDates(savedVerifiedDates);

            const stockMap = {};

            const getOrCreateItem = (name, trade, unit) => {
                const cleanName = (name || '').trim();
                if (!cleanName) return null;
                const cleanTrade = trade || 'MASONRY';
                const key = `${cleanTrade}_${cleanName.toLowerCase()}`;
                if (!stockMap[key]) {
                    stockMap[key] = {
                        key,
                        itemName: cleanName,
                        tradeSection: cleanTrade,
                        unit: unit || 'Pieces',
                        totalIn: 0,
                        totalOut: 0,
                        totalReturn: 0,
                        transactions: []
                    };
                }
                return stockMap[key];
            };

            // 1. Cash Purchases
            purchases.forEach(p => {
                const trade = p.tradeSection || 'MASONRY';
                (p.items || []).forEach(item => {
                    const isStoreStock = item.isStoreStockItem !== undefined ? item.isStoreStockItem : p.isStoreStockItem;
                    if (isStoreStock) {
                        const sItem = getOrCreateItem(item.itemName, trade, item.unit);
                        if (sItem) {
                            const qty = Number(item.quantity) || 0;
                            sItem.totalIn += qty;
                            sItem.transactions.push({
                                type: 'CASH_PURCHASE',
                                label: 'Cash Purchase',
                                colorGroup: 'GREEN',
                                docNo: p.cpNo,
                                date: p.purchaseDate,
                                quantity: qty,
                                details: `Expense Head: ${p.expenseHead || '—'} / ${p.purchasedBy}`
                            });
                        }
                    }
                });
            });

            // 2. Manual Stock Additions (Cash Purchase / MR/D.A.)
            manualStocks.forEach(m => {
                const sItem = getOrCreateItem(m.itemName, m.tradeSection, m.unit);
                if (sItem) {
                    const qty = Number(m.quantity) || 0;
                    sItem.totalIn += qty;
                    sItem.transactions.push({
                        type: m.docType === 'Cash Purchase' ? 'CASH_PURCHASE' : 'MR_DA',
                        label: m.docType === 'Cash Purchase' ? 'Cash Purchase' : 'MR/D.A. Stock',
                        colorGroup: 'GREEN',
                        docNo: m.docRef || 'MANUAL',
                        date: m.date || m.createdAt,
                        quantity: qty,
                        details: m.remarks || 'Manual stock entry'
                    });
                }
            });

            // 3. Issues & Site Returns
            issues.forEach(iss => {
                const sItem = getOrCreateItem(iss.itemName, iss.tradeSection, iss.unit);
                if (sItem) {
                    const qty = Number(iss.quantity) || 0;
                    if (iss.isSiteReturn) {
                        sItem.totalReturn += qty;
                        sItem.transactions.push({
                            type: 'SITE_RETURN',
                            label: 'Site Return',
                            colorGroup: 'BLUE',
                            docNo: iss.irNo,
                            date: iss.issueDate,
                            quantity: qty,
                            details: `Issued To: ${iss.issuedTo} (${iss.station || ''})`
                        });
                    } else {
                        sItem.totalOut += qty;
                        sItem.transactions.push({
                            type: 'ISSUE',
                            label: 'Issue Out',
                            colorGroup: 'RED',
                            docNo: iss.irNo,
                            date: iss.issueDate,
                            quantity: -qty,
                            details: `Issued To: ${iss.issuedTo} (${iss.station || ''})`
                        });
                    }
                }
            });

            // 4. Scrap Returns
            scraps.forEach(sc => {
                const sItem = getOrCreateItem(sc.itemName, sc.tradeSection, sc.unit);
                if (sItem) {
                    const qty = Number(sc.quantity) || 0;
                    sItem.totalReturn += qty;
                    sItem.transactions.push({
                        type: 'SCRAP_RETURN',
                        label: 'Scrap Return',
                        colorGroup: 'YELLOW',
                        docNo: sc.srNo,
                        date: sc.date,
                        quantity: qty,
                        details: `Returned By: ${sc.returnedBy} (${sc.location || ''})`
                    });
                }
            });

            const result = Object.values(stockMap).map(item => ({
                ...item,
                currentBalance: (item.totalIn + item.totalReturn) - item.totalOut,
                lastVerifiedDate: savedVerifiedDates[item.key] || null,
                transactions: item.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            })).sort((a, b) => a.itemName.localeCompare(b.itemName));

            setStockItems(result);
        } catch (e) {
            console.error('Error computing stock:', e);
            setError('Failed to compute stock register.');
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        let items = [...stockItems];

        if (activeTradeTab !== 'ALL') {
            items = items.filter(i => i.tradeSection === activeTradeTab);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            items = items.filter(i =>
                i.itemName.toLowerCase().includes(term) ||
                i.tradeSection.toLowerCase().includes(term)
            );
        }

        setFilteredItems(items);
    };

    const handleSaveManualStock = (e) => {
        e.preventDefault();
        if (!manualForm.itemName.trim()) {
            alert('Item name is required');
            return;
        }
        if (!manualForm.quantity || Number(manualForm.quantity) <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            data.manualStocks = data.manualStocks || [];
            data.manualStocks.push({
                id: `MSTK-${Date.now()}`,
                ...manualForm,
                quantity: Number(manualForm.quantity),
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('snglData', JSON.stringify(data));
            setShowManualModal(false);
            setManualForm({
                docType: 'MR/D.A.',
                tradeSection: 'MASONRY',
                itemName: '',
                quantity: 1,
                unit: 'Pieces',
                docRef: '',
                remarks: ''
            });
            loadStock();
        } catch (err) {
            console.error(err);
            alert('Failed to save manual stock');
        }
    };

    const handleSaveAuditDate = (itemKey) => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            data.verifiedDates = data.verifiedDates || {};
            data.verifiedDates[itemKey] = auditDateInput;
            localStorage.setItem('snglData', JSON.stringify(data));
            setAuditItem(null);
            loadStock();
        } catch (err) {
            console.error(err);
            alert('Failed to save verification date');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const getTxBadge = (tx) => {
        if (tx.colorGroup === 'GREEN') {
            return { bg: '#dcfce7', color: '#166534', icon: '▲', text: tx.label };
        }
        if (tx.colorGroup === 'RED') {
            return { bg: '#fef2f2', color: '#991b1b', icon: '▼', text: tx.label };
        }
        if (tx.colorGroup === 'BLUE') {
            return { bg: '#dbeafe', color: '#1e40af', icon: '↩', text: tx.label };
        }
        // YELLOW / Return
        return { bg: '#fef3c7', color: '#92400e', icon: '♻', text: tx.label };
    };

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
                        Physical Stock Balances · Auto-computed from Cash Purchases, Issues, Returns & Manual Entries
                    </p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowManualModal(true)} className="btn btn-primary">
                        <FaPlus /> Manual Stock / MR/D.A.
                    </button>
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

            {/* Trade Section Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTradeTab('ALL')}
                    className={`btn ${activeTradeTab === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.875rem' }}
                >
                    All Trades ({stockItems.length})
                </button>
                {TRADE_SECTIONS.map(ts => {
                    const count = stockItems.filter(i => i.tradeSection === ts.value).length;
                    return (
                        <button
                            key={ts.value}
                            onClick={() => setActiveTradeTab(ts.value)}
                            className={`btn ${activeTradeTab === ts.value ? 'btn-primary' : 'btn-outline'}`}
                            style={{
                                borderRadius: '20px', padding: '8px 18px', fontSize: '0.875rem',
                                borderColor: activeTradeTab === ts.value ? ts.color : undefined,
                                background: activeTradeTab === ts.value ? ts.color : undefined,
                                color: activeTradeTab === ts.value ? '#ffffff' : undefined
                            }}
                        >
                            {ts.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Summary Row (No monetary values as requested) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '18px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Filtered Line Items</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>{filteredItems.length}</div>
                </div>
                <div style={{ padding: '18px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #059669', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>In-Stock Items</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                        {filteredItems.filter(i => i.currentBalance > 0).length}
                    </div>
                </div>
                <div style={{ padding: '18px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #dc2626', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Out of Stock (Zero)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#dc2626', marginTop: '4px' }}>
                        {filteredItems.filter(i => i.currentBalance <= 0).length}
                    </div>
                </div>
            </div>

            <div className="card">
                {/* Search */}
                <div className="search-bar" style={{ marginBottom: '16px' }}>
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by item name or trade..."
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
                                <th>Trade</th>
                                <th>Unit</th>
                                <th style={{ textAlign: 'right', color: '#059669' }}>Total In</th>
                                <th style={{ textAlign: 'right', color: '#dc2626' }}>Total Out</th>
                                <th style={{ textAlign: 'right', color: '#2563eb' }}>Returns</th>
                                <th style={{ textAlign: 'right' }}>Current Balance</th>
                                <th style={{ textAlign: 'center' }}>Last Verified Date</th>
                                <th style={{ textAlign: 'center' }}>Audit Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="empty-state">
                                        No stock items found for the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <React.Fragment key={item.key}>
                                        <tr style={{ background: expandedRow === idx ? '#f0f9ff' : undefined }}>
                                            <td
                                                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                                style={{ cursor: 'pointer', color: '#9ca3af' }}
                                            >
                                                {expandedRow === idx ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                            </td>
                                            <td onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} style={{ cursor: 'pointer' }}>
                                                <strong>{item.itemName}</strong>
                                            </td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                                    {item.tradeSection}
                                                </span>
                                            </td>
                                            <td>{item.unit}</td>
                                            <td style={{ textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                                                +{item.totalIn}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>
                                                -{item.totalOut}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: '600' }}>
                                                +{item.totalReturn}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <strong style={{
                                                    fontSize: '1.05rem',
                                                    color: item.currentBalance > 0 ? '#059669' : (item.currentBalance === 0 ? '#f59e0b' : '#dc2626')
                                                }}>
                                                    {item.currentBalance}
                                                </strong>
                                            </td>
                                            <td style={{ textAlign: 'center', fontSize: '0.85rem', color: item.lastVerifiedDate ? '#166534' : '#9ca3af' }}>
                                                {item.lastVerifiedDate ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                                        <FaCheckCircle size={11} /> {formatDate(item.lastVerifiedDate)}
                                                    </span>
                                                ) : (
                                                    'Unverified'
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => {
                                                        setAuditItem(item);
                                                        setAuditDateInput(item.lastVerifiedDate || new Date().toISOString().split('T')[0]);
                                                    }}
                                                    className="btn btn-outline btn-sm"
                                                    title="Log Manual Verified Date"
                                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                                >
                                                    <FaCalendarCheck /> Audit
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable color-coded transaction history */}
                                        {expandedRow === idx && (
                                            <tr>
                                                <td colSpan="10" style={{ padding: 0, background: '#f8fafc' }}>
                                                    <div style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                                                Transaction Ledger: {item.itemName} ({item.tradeSection})
                                                            </span>
                                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                                Green = Stock In &nbsp;|&nbsp; Red = Issue Out &nbsp;|&nbsp; Blue/Yellow = Site & Scrap Returns
                                                            </span>
                                                        </div>
                                                        <table style={{ width: '100%', fontSize: '0.82rem', background: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                                                            <thead>
                                                                <tr style={{ background: '#e2e8f0', color: '#475569' }}>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Transaction Type</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Doc / Ref #</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Details</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty Change</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item.transactions.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>No transactions recorded yet</td>
                                                                    </tr>
                                                                ) : (
                                                                    item.transactions.map((tx, ti) => {
                                                                        const badge = getTxBadge(tx);
                                                                        return (
                                                                            <tr key={ti} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                <td style={{ padding: '8px 12px' }}>
                                                                                    <span style={{
                                                                                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                                                                                        background: badge.bg, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                                                    }}>
                                                                                        <span>{badge.icon}</span> {badge.text}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '600' }}>{tx.docNo}</td>
                                                                                <td style={{ padding: '8px 12px' }}>{formatDate(tx.date)}</td>
                                                                                <td style={{ padding: '8px 12px', color: '#64748b' }}>{tx.details}</td>
                                                                                <td style={{
                                                                                    padding: '8px 12px', textAlign: 'right', fontWeight: '700', fontSize: '0.9rem',
                                                                                    color: badge.color
                                                                                }}>
                                                                                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                )}
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
                    <span>Showing {filteredItems.length} of {stockItems.length} items</span>
                </div>
            </div>

            {/* Manual Stock Entry Modal */}
            {showManualModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Add Manual Stock / Initial Stock</h3>
                            <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6b7280' }}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSaveManualStock}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Document Type *</label>
                                <select
                                    value={manualForm.docType}
                                    onChange={e => setManualForm(prev => ({ ...prev, docType: e.target.value }))}
                                    className="form-control"
                                    required
                                >
                                    <option value="MR/D.A.">MR / D.A. (Material Receipt / Store Addition)</option>
                                    <option value="Cash Purchase">Cash Purchase (Direct Addition)</option>
                                </select>
                            </div>

                            <div className="form-row" style={{ marginBottom: '14px' }}>
                                <div className="form-group">
                                    <label className="form-label">Trade Section *</label>
                                    <select
                                        value={manualForm.tradeSection}
                                        onChange={e => setManualForm(prev => ({ ...prev, tradeSection: e.target.value }))}
                                        className="form-control"
                                        required
                                    >
                                        {TRADE_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Doc / MR/D.A. Reference</label>
                                    <input
                                        type="text"
                                        value={manualForm.docRef}
                                        onChange={e => setManualForm(prev => ({ ...prev, docRef: e.target.value }))}
                                        className="form-control"
                                        placeholder="e.g. MR-2026-088"
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Item Name *</label>
                                <input
                                    type="text"
                                    value={manualForm.itemName}
                                    onChange={e => setManualForm(prev => ({ ...prev, itemName: e.target.value }))}
                                    className="form-control"
                                    placeholder="e.g. Cement (Maple Leaf)"
                                    required
                                />
                            </div>

                            <div className="form-row" style={{ marginBottom: '14px' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualForm.quantity}
                                        onChange={e => setManualForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit *</label>
                                    <select
                                        value={manualForm.unit}
                                        onChange={e => setManualForm(prev => ({ ...prev, unit: e.target.value }))}
                                        className="form-control"
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">Remarks / Audit Note</label>
                                <textarea
                                    value={manualForm.remarks}
                                    onChange={e => setManualForm(prev => ({ ...prev, remarks: e.target.value }))}
                                    className="form-control"
                                    rows="2"
                                    placeholder="Reason for manual entry..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowManualModal(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary"><FaPlus /> Add Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit Verification Date Modal */}
            {auditItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Log Audit Verification Date</h3>
                            <button onClick={() => setAuditItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6b7280' }}>
                                <FaTimes />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '16px' }}>
                            Update manual physical count verification date for: <strong>{auditItem.itemName}</strong> ({auditItem.tradeSection})
                        </p>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">Verified Date *</label>
                            <input
                                type="date"
                                value={auditDateInput}
                                onChange={e => setAuditDateInput(e.target.value)}
                                className="form-control"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setAuditItem(null)} className="btn btn-outline">Cancel</button>
                            <button onClick={() => handleSaveAuditDate(auditItem.key)} className="btn btn-primary">
                                <FaCalendarCheck /> Save Verified Date
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockList;