// src/components/ScrapReturn/ScrapList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch, FaSync, FaListAlt, FaTable, FaTimes } from 'react-icons/fa';
import { api } from '../../services/api';

const ScrapList = () => {
    const [scraps, setScraps] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // View state: 'SUMMARY' (Item Summary Table) vs 'ALL_ENTRIES' (Full Register List)
    const [viewMode, setViewMode] = useState('SUMMARY');

    // Selected item modal state
    const [selectedItemDetail, setSelectedItemDetail] = useState(null);

    useEffect(() => {
        loadScraps();
    }, []);

    const loadScraps = async () => {
        setLoading(true);
        try {
            const data = await api.getScraps();
            if (Array.isArray(data)) {
                setScraps(data);
                setLoading(false);
                return;
            }
        } catch (_) {}

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.scraps) {
                setScraps(data.scraps);
            }
        } catch (error) {
            console.error('Error loading scraps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (srNo) => {
        if (window.confirm('Are you sure you want to delete this scrap return record?')) {
            try {
                await api.deleteScrap(srNo);
            } catch (_) {}

            try {
                const data = JSON.parse(localStorage.getItem('snglData')) || {};
                data.scraps = (data.scraps || []).filter(s => s.srNo !== srNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadScraps();
            } catch (error) {
                console.error('Error deleting scrap:', error);
                alert('Error deleting scrap');
            }
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    // Filter raw scrap entries by date range & search
    const getFilteredScraps = () => {
        let list = [...scraps];

        if (startDate) {
            list = list.filter(s => new Date(s.date) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            list = list.filter(s => new Date(s.date) <= end);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(s =>
                (s.srNo || '').toLowerCase().includes(term) ||
                (s.itemName || '').toLowerCase().includes(term) ||
                (s.returnedBy || '').toLowerCase().includes(term) ||
                (s.sourceOfShifting || '').toLowerCase().includes(term) ||
                (s.location || '').toLowerCase().includes(term)
            );
        }
        return list;
    };

    const filteredScrapEntries = getFilteredScraps();

    // Compute Summary Table items: Sr. No., Item Name, Scrap Quantity Till Date
    const computeItemSummary = () => {
        const itemMap = {};

        filteredScrapEntries.forEach(scrap => {
            const items = (scrap.items && scrap.items.length > 0) ? scrap.items : [scrap];
            items.forEach(item => {
                const name = (item.itemName || '').trim();
                if (!name) return;
                const key = name.toLowerCase();
                if (!itemMap[key]) {
                    itemMap[key] = {
                        itemName: name,
                        totalQuantity: 0,
                        unit: item.unit || 'Pieces',
                        tradeSection: item.tradeSection || scrap.tradeSection || 'MASONRY',
                        entries: []
                    };
                }
                const qty = Number(item.quantity) || 0;
                itemMap[key].totalQuantity += qty;
                itemMap[key].entries.push({
                    srNo: scrap.srNo,
                    date: scrap.date,
                    location: scrap.location,
                    returnedBy: scrap.returnedBy,
                    sourceOfShifting: scrap.sourceOfShifting,
                    quantity: qty,
                    unit: item.unit || scrap.unit || 'Pieces',
                    sourceDocType: item.sourceDocType || scrap.sourceDocType,
                    sourceReference: item.sourceReference || scrap.sourceReference
                });
            });
        });

        return Object.values(itemMap).sort((a, b) => a.itemName.localeCompare(b.itemName));
    };

    const itemSummaryList = computeItemSummary();

    if (loading) {
        return <div className="loading">Loading scrap register...</div>;
    }

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Scrap Register</h1>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                        {viewMode === 'SUMMARY' ? 'Aggregated Scrap Summary by Item Name' : 'Full Register of All Scrap Return Entries'}
                    </p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setViewMode(viewMode === 'SUMMARY' ? 'ALL_ENTRIES' : 'SUMMARY')}
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        {viewMode === 'SUMMARY' ? <FaTable /> : <FaListAlt />}
                        {viewMode === 'SUMMARY' ? 'View Entire Scrap Register Entries' : 'View Item Scrap Summary Table'}
                    </button>
                    <Link to="/scraps/new" className="btn btn-primary">
                        <FaPlus /> New Scrap
                    </Link>
                    <button onClick={loadScraps} className="btn btn-outline">
                        <FaSync />
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Search Item / Location / Return By
                        </label>
                        <div className="search-input-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search scrap records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div style={{ flex: '0 1 180px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div style={{ flex: '0 1 180px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    {(startDate || endDate || searchTerm) && (
                        <div>
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                                className="btn btn-outline btn-sm"
                            >
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── SUMMARY TABLE VIEW (ONLY: Sr. No., Item Name, Scrap Quantity Till Date) ─── */}
            {viewMode === 'SUMMARY' ? (
                <div className="card">
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Sr. No.</th>
                                    <th>Item Name</th>
                                    <th style={{ textAlign: 'right', color: '#d97706', fontWeight: '700' }}>
                                        Scrap Quantity Till Date
                                    </th>
                                    <th style={{ width: '140px', textAlign: 'center' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemSummaryList.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="empty-state">
                                            No scrap items found for the selected date range.
                                        </td>
                                    </tr>
                                ) : (
                                    itemSummaryList.map((item, idx) => (
                                        <tr
                                            key={item.itemName}
                                            onClick={() => setSelectedItemDetail(item)}
                                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                                        >
                                            <td style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280' }}>
                                                {idx + 1}
                                            </td>
                                            <td>
                                                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                                                    {item.itemName}
                                                </strong>
                                                <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>
                                                    {item.tradeSection}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: '700', color: '#d97706', fontSize: '1.05rem' }}>
                                                {item.totalQuantity} {item.unit}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedItemDetail(item); }}
                                                    className="btn btn-outline btn-sm"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                >
                                                    <FaEye /> View ({item.entries.length})
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <span>Total Items: {itemSummaryList.length} line items</span>
                    </div>
                </div>
            ) : (
                /* ─── FULL REGISTER ENTRIES VIEW ─── */
                <div className="card">
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>SR #</th>
                                    <th>Date</th>
                                    <th>Section</th>
                                    <th>Item Name</th>
                                    <th>Location</th>
                                    <th>Quantity</th>
                                    <th>Returned By</th>
                                    <th>Source of Shifting</th>
                                    <th>Source Document</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredScrapEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="empty-state">No scrap records found</td>
                                    </tr>
                                ) : (
                                    filteredScrapEntries.map((scrap) => (
                                        <tr key={scrap.srNo}>
                                            <td><strong>{scrap.srNo}</strong></td>
                                            <td>{formatDate(scrap.date)}</td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                                    {scrap.tradeSection || 'MASONRY'}
                                                </span>
                                            </td>
                                            <td><strong>{scrap.itemName || (scrap.items ? scrap.items.map(i => i.itemName).join(', ') : '—')}</strong></td>
                                            <td>{scrap.location || '—'}</td>
                                            <td style={{ fontWeight: '600', color: '#d97706' }}>
                                                {scrap.quantity} {scrap.unit}
                                            </td>
                                            <td>{scrap.returnedBy}</td>
                                            <td>{scrap.sourceOfShifting || '—'}</td>
                                            <td>
                                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                                    {scrap.sourceDocType}: {scrap.sourceReference || 'None'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                                    <Link to={`/scraps/view/${scrap.srNo}`} className="btn btn-outline btn-sm" title="View">
                                                        <FaEye />
                                                    </Link>
                                                    <Link to={`/scraps/edit/${scrap.srNo}`} className="btn btn-outline btn-sm" title="Edit">
                                                        <FaEdit />
                                                    </Link>
                                                    <button onClick={() => handleDelete(scrap.srNo)} className="btn btn-danger btn-sm" title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── MODAL: Item Detailed Entries (Opened when clicking item row in Summary) ─── */}
            {selectedItemDetail && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
                }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                                    Scrap Entries for: {selectedItemDetail.itemName}
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                    Total Accumulated Scrap: <strong style={{ color: '#d97706' }}>{selectedItemDetail.totalQuantity} {selectedItemDetail.unit}</strong>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItemDetail(null)} className="btn btn-outline btn-sm" style={{ border: 'none', fontSize: '1.2rem' }}>
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>SR #</th>
                                            <th>Date</th>
                                            <th>Returned By</th>
                                            <th>Source of Shifting</th>
                                            <th>Location</th>
                                            <th style={{ textAlign: 'right' }}>Qty</th>
                                            <th>Source Doc</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItemDetail.entries.map((entry, i) => (
                                            <tr key={i}>
                                                <td><strong>{entry.srNo}</strong></td>
                                                <td>{formatDate(entry.date)}</td>
                                                <td>{entry.returnedBy}</td>
                                                <td>{entry.sourceOfShifting || '—'}</td>
                                                <td>{entry.location || '—'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#d97706' }}>
                                                    {entry.quantity} {entry.unit}
                                                </td>
                                                <td>
                                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                                        {entry.sourceDocType}: {entry.sourceReference || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'right', background: '#f8fafc' }}>
                            <button onClick={() => setSelectedItemDetail(null)} className="btn btn-primary btn-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScrapList;