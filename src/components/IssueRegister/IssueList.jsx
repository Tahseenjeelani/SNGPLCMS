import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaLock, FaUnlock, FaSearch } from 'react-icons/fa';
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

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(i =>
                i.irNo.toLowerCase().includes(term) ||
                i.itemName.toLowerCase().includes(term) ||
                i.issuedTo.toLowerCase().includes(term) ||
                i.sourceDocuments.some(s => s.reference.toLowerCase().includes(term))
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

    const getSourceDocStatus = (sourceDocs) => {
        const hasLocked = sourceDocs.some(s => s.isLocked);
        const allCompleted = sourceDocs.every(s => s.status === 'COMPLETED');
        if (hasLocked) return 'locked';
        if (allCompleted) return 'completed';
        return 'pending';
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
                            placeholder="Search by IR#, item, issued to, source doc..."
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
                                <th>Quantity</th>
                                <th>Issued To</th>
                                <th>Source Docs</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="empty-state">
                                        No issues found
                                    </td>
                                </tr>
                            ) : (
                                filteredIssues.map((issue) => {
                                    const status = getSourceDocStatus(issue.sourceDocuments);
                                    return (
                                        <tr key={issue.irNo}>
                                            <td>
                                                <strong>{issue.irNo}</strong>
                                                {!issue.isActive && (
                                                    <span className="badge badge-secondary ml-2">Inactive</span>
                                                )}
                                            </td>
                                            <td>{new Date(issue.issueDate).toLocaleDateString()}</td>
                                            <td>
                                                <span style={{ color: getTradeSectionColor(issue.tradeSection) }}>
                                                    {getTradeSectionLabel(issue.tradeSection)}
                                                </span>
                                            </td>
                                            <td>{issue.itemName}</td>
                                            <td>{issue.quantity} {issue.unit}</td>
                                            <td>{issue.issuedTo}</td>
                                            <td>
                                                {issue.sourceDocuments.map((doc, idx) => (
                                                    <div key={idx} className="source-doc-tag">
                                                        <span className="badge badge-info">{doc.sourceType}</span>
                                                        <span className="badge badge-secondary">{doc.reference}</span>
                                                        {doc.isLocked && <FaLock className="lock-icon" size={10} />}
                                                    </div>
                                                ))}
                                            </td>
                                            <td>
                                                {status === 'locked' && (
                                                    <span className="badge badge-success">
                                                        <FaLock /> Locked
                                                    </span>
                                                )}
                                                {status === 'completed' && (
                                                    <span className="badge badge-success">Completed</span>
                                                )}
                                                {status === 'pending' && (
                                                    <span className="badge badge-warning">Pending</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Link
                                                        to={`/issues/view/${issue.irNo}`}
                                                        className="btn btn-outline btn-sm"
                                                        title="View"
                                                    >
                                                        <FaEye />
                                                    </Link>
                                                    <Link
                                                        to={`/issues/edit/${issue.irNo}`}
                                                        className="btn btn-outline btn-sm"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleActive(issue.irNo)}
                                                        className={`btn ${issue.isActive ? 'btn-warning' : 'btn-success'} btn-sm`}
                                                        title={issue.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {issue.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(issue.irNo)}
                                                        className="btn btn-danger btn-sm"
                                                        title="Delete"
                                                    >
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

                <div className="table-footer">
                    <span>Total: {filteredIssues.length} issues</span>
                </div>
            </div>
        </div>
    );
};

export default IssueList;