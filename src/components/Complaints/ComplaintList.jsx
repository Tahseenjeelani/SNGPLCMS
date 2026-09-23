// src/components/Complaints/ComplaintList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch, FaCheckCircle, FaClock } from 'react-icons/fa';
import './Complaints.css';

const ComplaintList = () => {
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadComplaints();
    }, []);

    useEffect(() => {
        filterComplaints();
    }, [complaints, searchTerm, statusFilter]);

    const loadComplaints = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const list = data?.complaints || [];
            setComplaints(list);
        } catch (error) {
            console.error('Error loading complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterComplaints = () => {
        let filtered = [...complaints];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.id || '').toLowerCase().includes(term) ||
                (c.complainant || '').toLowerCase().includes(term) ||
                (c.station || '').toLowerCase().includes(term) ||
                (c.location || '').toLowerCase().includes(term) ||
                (c.description || '').toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        setFilteredComplaints(filtered);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            data.complaints = data.complaints.filter(c => c.id !== id);
            localStorage.setItem('snglData', JSON.stringify(data));
            loadComplaints();
        } catch (error) {
            console.error('Error deleting complaint:', error);
            alert('Error deleting complaint');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const openCount = complaints.filter(c => c.status === 'Open').length;
    const completedCount = complaints.filter(c => c.status === 'Completed').length;

    if (loading) return <div className="loading">Loading complaints...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Complaints</h1>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '600' }}>
                            <FaClock style={{ marginRight: '4px' }} />
                            {openCount} Open
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                            <FaCheckCircle style={{ marginRight: '4px' }} />
                            {completedCount} Completed
                        </span>
                    </div>
                </div>
                <div className="page-actions">
                    <Link to="/complaints/new" className="btn btn-primary">
                        <FaPlus /> New Complaint
                    </Link>
                </div>
            </div>

            <div className="card">
                {/* Search & Filter Bar */}
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID, station, location, complainant, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <button className="btn btn-outline" onClick={loadComplaints}>
                        Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Complaint #</th>
                                <th>Date</th>
                                <th>Station / Location</th>
                                <th>Complainant</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">No complaints found</td>
                                </tr>
                            ) : (
                                filteredComplaints.map((complaint) => (
                                    <tr key={complaint.id}>
                                        <td><strong>{complaint.id}</strong></td>
                                        <td>{formatDate(complaint.complaintDate)}</td>
                                        <td>
                                            <div style={{ fontWeight: '500', color: '#1f2937' }}>{complaint.station || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{complaint.location || ''}</div>
                                        </td>
                                        <td>{complaint.complainant || '—'}</td>
                                        <td style={{ maxWidth: '260px' }}>
                                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {complaint.description || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${complaint.status === 'Open' ? 'badge-warning' : 'badge-success'}`}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                {complaint.status === 'Open' ? <FaClock size={10} /> : <FaCheckCircle size={10} />}
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/complaints/view/${encodeURIComponent(complaint.id)}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="View dashboard"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    to={`/complaints/edit/${encodeURIComponent(complaint.id)}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(complaint.id)}
                                                    className="btn btn-danger btn-sm"
                                                    title="Delete"
                                                >
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
                    <span>Showing {filteredComplaints.length} of {complaints.length} complaints</span>
                </div>
            </div>
        </div>
    );
};

export default ComplaintList;