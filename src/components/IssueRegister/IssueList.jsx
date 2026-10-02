// src/components/IssueRegister/IssueList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch, FaSync } from 'react-icons/fa';
import { TRADE_SECTIONS, getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const IssueList = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTradeTab, setActiveTradeTab] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIssues();
    }, []);

    useEffect(() => {
        filterIssues();
    }, [issues, searchTerm, activeTradeTab]);

    const loadIssues = async () => {
        setLoading(true);
        try {
            const data = await api.getIssues();
            if (Array.isArray(data)) {
                setIssues(data);
                setFilteredIssues(data);
                setLoading(false);
                return;
            }
        } catch (_) {}

        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const list = data.issues || [];
            setIssues(list);
            setFilteredIssues(list);
        } catch (error) {
            console.error('Error loading issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterIssues = () => {
        let filtered = [...issues];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(i =>
                (i.irNo || '').toLowerCase().includes(term) ||
                (i.itemName || '').toLowerCase().includes(term) ||
                (i.issuedTo || '').toLowerCase().includes(term) ||
                (i.station || '').toLowerCase().includes(term) ||
                (i.location || '').toLowerCase().includes(term) ||
                (i.vehicleNo || '').toLowerCase().includes(term) ||
                (i.sourceDocType || '').toLowerCase().includes(term) ||
                (i.sourceReference || '').toLowerCase().includes(term)
            );
        }

        if (activeTradeTab !== 'ALL') {
            filtered = filtered.filter(i => i.tradeSection === activeTradeTab);
        }

        setFilteredIssues(filtered);
    };

    const handleDelete = async (irNo) => {
        if (window.confirm('Are you sure you want to delete this issue entry?')) {
            try {
                await api.deleteIssue(irNo);
            } catch (_) {}

            try {
                const data = JSON.parse(localStorage.getItem('snglData')) || {};
                data.issues = (data.issues || []).filter(i => i.irNo !== irNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadIssues();
            } catch (error) {
                console.error('Error deleting issue:', error);
                alert('Error deleting issue');
            }
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const renderIssueTable = (items, tradeLabel, tradeColor) => (
        <div style={{ marginBottom: '28px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '12px 18px', background: tradeColor || '#3b82f6', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                    {tradeLabel} Section ({items.length} Entries)
                </h3>
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>IR #</th>
                            <th>Date</th>
                            <th>Item Name</th>
                            <th>Station / Location</th>
                            <th>Vehicle No.</th>
                            <th style={{ textAlign: 'right', color: '#dc2626' }}>Issued Qty (-Stock)</th>
                            <th style={{ textAlign: 'right', color: '#059669' }}>Return Qty (+Stock)</th>
                            <th>Issued To</th>
                            <th>Source Document</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="empty-state">No issues recorded in this section</td>
                            </tr>
                        ) : (
                            items.map((issue) => {
                                const issuedQty = issue.issuedQuantity !== undefined ? issue.issuedQuantity : (issue.isSiteReturn ? 0 : issue.quantity);
                                const returnQty = issue.returnQuantity !== undefined ? issue.returnQuantity : (issue.isSiteReturn ? issue.quantity : 0);
                                return (
                                    <tr key={issue.irNo}>
                                        <td><strong>{issue.irNo}</strong></td>
                                        <td>{formatDate(issue.issueDate)}</td>
                                        <td><strong>{issue.itemName}</strong></td>
                                        <td>
                                            <div style={{ fontWeight: '500', color: '#1f2937' }}>{issue.station || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{issue.location || ''}</div>
                                        </td>
                                        <td>
                                            {issue.vehicleNo ? (
                                                <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                                    🚚 {issue.vehicleNo}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: issuedQty > 0 ? '#dc2626' : '#9ca3af', fontWeight: '600' }}>
                                            {issuedQty > 0 ? `-${issuedQty} ${issue.unit || ''}` : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: returnQty > 0 ? '#059669' : '#9ca3af', fontWeight: '600' }}>
                                            {returnQty > 0 ? `+${returnQty} ${issue.returnUnit || issue.unit || ''}` : '—'}
                                        </td>
                                        <td>{issue.issuedTo}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    {issue.sourceDocType}
                                                </span>
                                                {issue.sourceReference && (
                                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                                        {issue.sourceReference}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                                <Link to={`/issues/view/${issue.irNo}`} className="btn btn-outline btn-sm" title="View">
                                                    <FaEye />
                                                </Link>
                                                <Link to={`/issues/edit/${issue.irNo}`} className="btn btn-outline btn-sm" title="Edit">
                                                    <FaEdit />
                                                </Link>
                                                <button onClick={() => handleDelete(issue.irNo)} className="btn btn-danger btn-sm" title="Delete">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) {
        return <div className="loading">Loading issues...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Issue Register</h1>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                        Store Material Issues & Site Returns by Trade Section
                    </p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/issues/new" className="btn btn-primary">
                        <FaPlus /> New Issue
                    </Link>
                    <button onClick={loadIssues} className="btn btn-outline">
                        <FaSync /> Refresh
                    </button>
                </div>
            </div>

            {/* Trade Section Tabs (Store Stock Register Style) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTradeTab('ALL')}
                    className={`btn ${activeTradeTab === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.875rem' }}
                >
                    All Trades ({issues.length})
                </button>
                {TRADE_SECTIONS.map(ts => {
                    const count = issues.filter(i => i.tradeSection === ts.value).length;
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

            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by IR#, item, station, location, vehicle#, issued to..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Split summary table into 4 sections by Trade Section */}
            {activeTradeTab === 'ALL' ? (
                TRADE_SECTIONS.map(ts => {
                    const sectionItems = filteredIssues.filter(i => (i.tradeSection || 'MASONRY') === ts.value);
                    return (
                        <React.Fragment key={ts.value}>
                            {renderIssueTable(sectionItems, ts.label, ts.color)}
                        </React.Fragment>
                    );
                })
            ) : (
                (() => {
                    const ts = TRADE_SECTIONS.find(t => t.value === activeTradeTab);
                    return renderIssueTable(filteredIssues, ts ? ts.label : activeTradeTab, ts ? ts.color : '#2563eb');
                })()
            )}
        </div>
    );
};

export default IssueList;