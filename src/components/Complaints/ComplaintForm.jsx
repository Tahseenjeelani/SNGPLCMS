// src/components/Complaints/ComplaintForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { COMPLAINT_STATUSES } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const ComplaintForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        complaintDate: new Date().toISOString().split('T')[0],
        description: '',
        complainant: '',
        status: 'Open',
        remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit) {
            loadComplaint();
        }
    }, [id]);

    const loadComplaint = async () => {
        // Try API first
        try {
            const complaint = await api.getComplaint(id);
            if (complaint && complaint.id) {
                setFormData({
                    complaintDate: complaint.complaintDate
                        ? new Date(complaint.complaintDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    description: complaint.description || '',
                    complainant: complaint.complainant || '',
                    status: complaint.status || 'Open',
                    remarks: complaint.remarks || ''
                });
                return;
            }
        } catch (_) {}

        // Fallback to localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const complaint = (data?.complaints || []).find(c => c.id === id);
            if (complaint) {
                setFormData({
                    complaintDate: complaint.complaintDate
                        ? new Date(complaint.complaintDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    description: complaint.description || '',
                    complainant: complaint.complainant || '',
                    status: complaint.status || 'Open',
                    remarks: complaint.remarks || ''
                });
            }
        } catch (e) {
            console.error('Error loading complaint:', e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.description.trim()) {
            setError('Description is required.');
            return;
        }
        if (!formData.complainant.trim()) {
            setError('Complainant is required.');
            return;
        }

        setLoading(true);

        // Try API
        try {
            if (isEdit) {
                await api.updateComplaint(id, formData);
            } else {
                await api.createComplaint(formData);
            }
            navigate('/complaints');
            return;
        } catch (apiErr) {
            console.warn('API call failed, using localStorage fallback:', apiErr);
        }

        // Fallback: localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { complaints: [], counters: { complaint: 0 } };
            const now = new Date().toISOString();

            if (isEdit) {
                const index = data.complaints.findIndex(c => c.id === id);
                if (index !== -1) {
                    data.complaints[index] = {
                        ...data.complaints[index],
                        ...formData,
                        modifiedBy: 'Admin',
                        modifiedAt: now
                    };
                }
            } else {
                const d = new Date();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const thisMonthCount = data.complaints.filter(c => c.id && c.id.endsWith(`/${month}/${year}`)).length + 1;
                const newId = `${String(thisMonthCount).padStart(2, '0')}/${month}/${year}`;

                data.complaints.push({
                    id: newId,
                    ...formData,
                    status: 'Open',
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now
                });
                data.counters = data.counters || {};
                data.counters.complaint = (data.counters.complaint || 0) + 1;
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/complaints');
        } catch (localErr) {
            console.error('localStorage save error:', localErr);
            setError('Failed to save complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Complaint' : 'New Complaint'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/complaints')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Complaint Date *</label>
                        <input
                            type="date"
                            name="complaintDate"
                            value={formData.complaintDate}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Complainant *</label>
                        <input
                            type="text"
                            name="complainant"
                            value={formData.complainant}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Name of person / department"
                            required
                        />
                    </div>
                    {isEdit && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-control"
                            >
                                {COMPLAINT_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-control"
                        rows="4"
                        placeholder="Describe the complaint in detail..."
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        className="form-control"
                        rows="2"
                        placeholder="Optional additional notes..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Complaint' : 'Create Complaint')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComplaintForm;