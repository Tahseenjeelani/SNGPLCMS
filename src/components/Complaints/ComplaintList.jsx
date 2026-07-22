// src/components/Complaints/ComplaintList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaPlus,
    FaEdit,
    FaEye,
    FaCheck,
    FaTrash,
    FaSearch,
    FaFilter,
    FaLock,
    FaUnlock
} from 'react-icons/fa';
import { getTradeSectionLabel } from '../../data/preDefinedLists';
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
            if (data && data.complaints) {
                setComplaints(data.complaints);
                setFilteredComplaints(data.complaints);
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterComplaints = () => {
        let filtered = [...complaints];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.id.toLowerCase().includes(term) ||
                c.location.toLowerCase().includes(term) ||
                c.indenter.toLowerCase().includes(term) ||
                c.attendedBy?.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        setFilteredComplaints(filtered);
    };

    const getStatusBadge = (status) => {
        const classes = {
            'NEW': 'badge-secondary',
            'ASSIGNED': 'badge-info',
            'IN_PROGRESS': 'badge-warning',
            'ON_HOLD': 'badge-secondary',
            'COMPLETED': 'badge-success',
            'VERIFIED': 'badge-info',
            'CLOSED': 'badge-secondary'
        };
        return classes[status] || 'badge-secondary';
    };

    const getStatusDot = (status) => {
        const colors = {
            'NEW': 'gray',
            'ASSIGNED': 'blue',
            'IN_PROGRESS': 'yellow',
            'ON_HOLD': 'gray',
            'COMPLETED': 'green',
            'VERIFIED': 'blue',
            'CLOSED': 'gray'
        };
        return colors[status] || 'gray';
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this complaint?')) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                data.complaints = data.complaints.filter(c => c.id !== id);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadComplaints();
            } catch (error) {
                console.error('Error deleting complaint:', error);
                alert('Error deleting complaint');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading complaints...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Complaints</h1>
                <div className="page-actions">
                    <Link to="/complaints/new" className="btn btn-primary">
                        <FaPlus /> New Complaint
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search complaints by ID, location, indenter..."
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
                        <option value="NEW">New</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <button className="btn btn-outline" onClick={loadComplaints}>
                        <FaFilter /> Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Complaint #</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Indenter</th>
                                <th>Status</th>
                                <th>Attended By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        No complaints found
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((complaint) => (
                                    <tr key={complaint.id}>
                                        <td>
                                            <strong>{complaint.id}</strong>
                                            {complaint.isCompleted && (
                                                <span className="badge badge-success ml-2">
                                                    <FaCheck size={10} /> Done
                                                </span>
                                            )}
                                        </td>
                                        <td>{new Date(complaint.complaintDate).toLocaleDateString()}</td>
                                        <td>{complaint.location}</td>
                                        <td>{complaint.indenter}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(complaint.status)} status-badge`}>
                                                <span className={`status-dot ${getStatusDot(complaint.status)}`}></span>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td>{complaint.attendedBy || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/complaints/edit/${complaint.id}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                {!complaint.isCompleted && complaint.status !== 'COMPLETED' && (
                                                    <Link
                                                        to={`/complaints/complete/${complaint.id}`}
                                                        className="btn btn-success btn-sm"
                                                        title="Complete"
                                                    >
                                                        <FaCheck />
                                                    </Link>
                                                )}
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
                    <span>Total: {filteredComplaints.length} complaints</span>
                </div>
            </div>
        </div>
    );
};

export default ComplaintList;