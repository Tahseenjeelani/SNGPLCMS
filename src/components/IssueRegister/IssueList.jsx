import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const IssueList = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectionFilter, setSectionFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIssues();
    }, []);

    useEffect(() => {
        filterIssues();
    }, [issues, searchTerm, sectionFilter]);

    const loadIssues = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.issues) {
                setIssues(data.issues);
                setFilteredIssues(data.issues);
            }
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
                (i.sourceDocType || '').toLowerCase().includes(term) ||
                (i.sourceReference || '').toLowerCase().includes(term)
            );
        }

        if (sectionFilter !== 'ALL') {
            filtered = filtered.filter(i => i.tradeSection === sectionFilter);
        }

        setFilteredIssues(filtered);
    };

    const handleDelete = (irNo) => {
        if (window.confirm('Are you sure you want to delete this issue?')) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                data.issues = data.issues.filter(i => i.irNo !== irNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadIssues();
            } catch (error) {
                console.error('Error deleting issue:', error);
                alert('Error deleting issue');
            }
        }
    };

    const handleToggleActive = (irNo) => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const issue = data.issues.find(i => i.irNo === irNo);
            if (issue) {
                issue.isActive = !issue.isActive;
                issue.modifiedBy = 'Admin';
                issue.modifiedAt = new Date().toISOString();
                localStorage.setItem('snglData', JSON.stringify(data));
                loadIssues();
            }
        } catch (error) {
            console.error('Error toggling issue:', error);
            alert('Error updating issue');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    if (loading) {
        return <div className="loading">Loading issues...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Issue Register</h1>
                <div className="page-actions">
                    <Link to="/issues/new" className="btn btn-primary">
                        <FaPlus /> New Issue
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by IR#, item, station, location, issued to..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Sections</option>
                        <option value="MASONRY">Masonry</option>
                        <option value="PLUMBING">Plumbing</option>
                        <option value="CARPENTRY">Carpentry</option>
                        <option value="PAINTING">Painting</option>
                    </select>
                    <button className="btn btn-outline" onClick={loadIssues}>
                        Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>IR #</th>
                                <th>Date</th>
                                <th>Section</th>
                                <th>Item</th>
                                <th>Station / Location</th>
                                <th>Quantity</th>
                                <th>Issued To</th>
                                <th>Type</th>
                                <th>Source Document</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="empty-state">No issues found</td>
                                </tr>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <tr key={issue.irNo}>
                                        <td><strong>{issue.irNo}</strong></td>
                                        <td>{formatDate(issue.issueDate)}</td>
                                        <td>
                                            <span style={{ color: getTradeSectionColor(issue.tradeSection) }}>
                                                {getTradeSectionLabel(issue.tradeSection)}
                                            </span>
                                        </td>
                                        <td>{issue.itemName}</td>
                                        <td>
                                            <div style={{ fontWeight: '500', color: '#1f2937' }}>{issue.station || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{issue.location || ''}</div>
                                        </td>
                                        <td>{issue.quantity} {issue.unit}</td>
                                        <td>{issue.issuedTo}</td>
                                        <td>
                                            <span className={`badge ${issue.isSiteReturn ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                                                {issue.isSiteReturn ? '↩ Site Return (+Stock)' : 'Issue (-Stock)'}
                                            </span>
                                        </td>
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
                                        <td>
                                            <div className="action-buttons">
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>Showing {filteredIssues.length} of {issues.length} issues</span>
                </div>
            </div>
        </div>
    );
};

export default IssueList;