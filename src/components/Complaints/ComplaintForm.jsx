import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes, FaEye } from 'react-icons/fa';
import { UNITS, PROCUREMENT_TYPES } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const ComplaintForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        complaintDate: new Date().toISOString().split('T')[0],
        location: '',
        indenter: '',
        procurementType: 'STORE',
        storeItems: [],
        marketItems: [],
        attendedBy: '',
        status: 'NEW',
        remarks: ''
    });

    const [stockItems, setStockItems] = useState([]);
    const [newStoreItem, setNewStoreItem] = useState({ itemId: '', quantity: 1, unit: 'Pieces' });
    const [newMarketItem, setNewMarketItem] = useState({ itemName: '', quantity: 1, unit: 'Pieces', unitPrice: 0 });
    const [linkedEntries, setLinkedEntries] = useState(null);
    const [loadingLinks, setLoadingLinks] = useState(false);

    useEffect(() => {
        loadStockItems();
        if (isEdit) {
            loadComplaint();
            loadLinkedEntries(id);
        }
    }, [id]);

    const loadLinkedEntries = async (complaintId) => {
        setLoadingLinks(true);
        try {
            const data = await api.getComplaintLinks(complaintId);
            if (data && (data.issues || data.purchases || data.scraps)) {
                setLinkedEntries(data);
                setLoadingLinks(false);
                return;
            }
        } catch (error) {
            console.warn('API getComplaintLinks failed, using localStorage fallback:', error);
        }

        // Fallback to localStorage
        try {
            const localData = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (localData.issues || []).reduce((acc, issue) => {
                const doc = (issue.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        irNo: issue.irNo,
                        itemName: issue.itemName,
                        allocation: doc.allocation,
                        unit: issue.unit,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        issueDate: issue.issueDate,
                        issuedTo: issue.issuedTo
                    });
                }
                return acc;
            }, []);

            const purchases = (localData.purchases || []).reduce((acc, purchase) => {
                const doc = (purchase.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        cpNo: purchase.cpNo,
                        items: (purchase.items || []).map(i => i.itemName || i),
                        allocation: doc.allocation,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        purchaseDate: purchase.purchaseDate,
                        purchasedBy: purchase.purchasedBy
                    });
                }
                return acc;
            }, []);

            const scraps = (localData.scraps || []).reduce((acc, scrap) => {
                const doc = (scrap.sourceDocuments || []).find(d => d.reference === complaintId);
                if (doc) {
                    acc.push({
                        srNo: scrap.srNo,
                        itemName: scrap.itemName,
                        allocation: doc.allocation,
                        unit: scrap.unit,
                        status: doc.status || 'PENDING',
                        isLocked: doc.isLocked || false,
                        date: scrap.date,
                        returnedBy: scrap.returnedBy
                    });
                }
                return acc;
            }, []);

            setLinkedEntries({
                complaintId,
                issues,
                purchases,
                scraps
            });
        } catch (err) {
            console.error('Error loading linked entries from localStorage:', err);
        } finally {
            setLoadingLinks(false);
        }
    };

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.stock) {
                setStockItems(data.stock);
            }
        } catch (error) {
            console.error('Error loading stock items:', error);
        }
    };

    const loadComplaint = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const complaint = data.complaints.find(c => c.id === id);
            if (complaint) {
                setFormData({
                    ...complaint,
                    complaintDate: complaint.complaintDate || new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error('Error loading complaint:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStoreItem = () => {
        if (!newStoreItem.itemId || !newStoreItem.quantity) {
            alert('Please select an item and enter quantity');
            return;
        }

        const item = stockItems.find(s => s.itemId === newStoreItem.itemId);
        setFormData(prev => ({
            ...prev,
            storeItems: [...prev.storeItems, {
                itemId: newStoreItem.itemId,
                itemName: item ? item.itemName : '',
                quantity: Number(newStoreItem.quantity),
                unit: newStoreItem.unit
            }]
        }));
        setNewStoreItem({ itemId: '', quantity: 1, unit: 'Pieces' });
    };

    const handleRemoveStoreItem = (index) => {
        setFormData(prev => ({
            ...prev,
            storeItems: prev.storeItems.filter((_, i) => i !== index)
        }));
    };

    const handleAddMarketItem = () => {
        if (!newMarketItem.itemName || !newMarketItem.quantity || !newMarketItem.unitPrice) {
            alert('Please fill all fields');
            return;
        }

        const total = newMarketItem.quantity * newMarketItem.unitPrice;
        setFormData(prev => ({
            ...prev,
            marketItems: [...prev.marketItems, {
                ...newMarketItem,
                quantity: Number(newMarketItem.quantity),
                unitPrice: Number(newMarketItem.unitPrice),
                total: total
            }]
        }));
        setNewMarketItem({ itemName: '', quantity: 1, unit: 'Pieces', unitPrice: 0 });
    };

    const handleRemoveMarketItem = (index) => {
        setFormData(prev => ({
            ...prev,
            marketItems: prev.marketItems.filter((_, i) => i !== index)
        }));
    };

    const calculateTotalBill = () => {
        const marketTotal = formData.marketItems.reduce((sum, item) => sum + (item.total || 0), 0);
        return marketTotal;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.location || !formData.indenter || !formData.procurementType) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.procurementType === 'STORE' && formData.storeItems.length === 0) {
            alert('Please add at least one store item');
            return;
        }

        if (formData.procurementType === 'MARKET' && formData.marketItems.length === 0) {
            alert('Please add at least one market item');
            return;
        }

        if (formData.procurementType === 'BOTH' && (formData.storeItems.length === 0 || formData.marketItems.length === 0)) {
            alert('Please add both store and market items');
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const now = new Date().toISOString();
            const totalBill = calculateTotalBill();

            if (isEdit) {
                // Update existing complaint
                const index = data.complaints.findIndex(c => c.id === id);
                if (index !== -1) {
                    data.complaints[index] = {
                        ...data.complaints[index],
                        ...formData,
                        totalBillAmount: totalBill,
                        modifiedBy: 'Admin',
                        modifiedAt: now
                    };
                }
            } else {
                // Generate new complaint number
                const now = new Date();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const complaintCount = data.complaints.filter(c => c.id.endsWith(`/${month}/${year}`)).length + 1;
                const complaintId = `${String(complaintCount).padStart(2, '0')}/${month}/${year}`;

                const newComplaint = {
                    id: complaintId,
                    ...formData,
                    totalBillAmount: totalBill,
                    voucherNumber: '',
                    completedDate: null,
                    isCompleted: false,
                    sourceDocType: 'COMPLAINT',
                    sourceReference: complaintId,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now
                };

                data.complaints.push(newComplaint);
                data.counters.complaint += 1;
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/complaints');
        } catch (error) {
            console.error('Error saving complaint:', error);
            alert('Error saving complaint');
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
                        <label className="form-label">Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Building/Area/Room"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Indenter *</label>
                        <input
                            type="text"
                            name="indenter"
                            value={formData.indenter}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Person/Department"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Procurement Type *</label>
                    <select
                        name="procurementType"
                        value={formData.procurementType}
                        onChange={handleChange}
                        className="form-control"
                        required
                    >
                        {PROCUREMENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Store Items Section */}
                {(formData.procurementType === 'STORE' || formData.procurementType === 'BOTH') && (
                    <div className="items-section">
                        <h3>Store Items</h3>
                        <div className="items-grid">
                            <select
                                value={newStoreItem.itemId}
                                onChange={(e) => setNewStoreItem(prev => ({ ...prev, itemId: e.target.value }))}
                                className="form-control"
                            >
                                <option value="">Select Item</option>
                                {stockItems.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                        {item.itemName} ({item.currentStock} {item.unit} available)
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={newStoreItem.quantity}
                                onChange={(e) => setNewStoreItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                className="form-control"
                                min="1"
                            />
                            <select
                                value={newStoreItem.unit}
                                onChange={(e) => setNewStoreItem(prev => ({ ...prev, unit: e.target.value }))}
                                className="form-control"
                            >
                                {UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                            <button type="button" className="btn btn-primary" onClick={handleAddStoreItem}>
                                <FaPlus /> Add
                            </button>
                        </div>

                        {formData.storeItems.length > 0 && (
                            <div className="items-list">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Quantity</th>
                                            <th>Unit</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.storeItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.itemName}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.unit}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleRemoveStoreItem(index)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Market Items Section */}
                {(formData.procurementType === 'MARKET' || formData.procurementType === 'BOTH') && (
                    <div className="items-section">
                        <h3>Market Items</h3>
                        <div className="items-grid">
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={newMarketItem.itemName}
                                onChange={(e) => setNewMarketItem(prev => ({ ...prev, itemName: e.target.value }))}
                                className="form-control"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={newMarketItem.quantity}
                                onChange={(e) => setNewMarketItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                className="form-control"
                                min="1"
                            />
                            <select
                                value={newMarketItem.unit}
                                onChange={(e) => setNewMarketItem(prev => ({ ...prev, unit: e.target.value }))}
                                className="form-control"
                            >
                                {UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Unit Price"
                                value={newMarketItem.unitPrice}
                                onChange={(e) => setNewMarketItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                                className="form-control"
                                min="0"
                                step="0.01"
                            />
                            <button type="button" className="btn btn-primary" onClick={handleAddMarketItem}>
                                <FaPlus /> Add
                            </button>
                        </div>

                        {formData.marketItems.length > 0 && (
                            <div className="items-list">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Quantity</th>
                                            <th>Unit</th>
                                            <th>Unit Price</th>
                                            <th>Total</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.marketItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.itemName}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.unit}</td>
                                                <td>PKR {item.unitPrice}</td>
                                                <td>PKR {item.total}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleRemoveMarketItem(index)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                Total Bill:
                                            </td>
                                            <td colSpan="2" style={{ fontWeight: 'bold' }}>
                                                PKR {calculateTotalBill()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Attended By</label>
                        <input
                            type="text"
                            name="attendedBy"
                            value={formData.attendedBy}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Worker/Supervisor name"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="NEW">New</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        className="form-control"
                        rows="3"
                        placeholder="Additional notes..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        <FaSave /> {isEdit ? 'Update' : 'Create'} Complaint
                    </button>
                </div>

                {/* Linked Entries Section */}
                {id && (
                    <div className="linked-entries-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                            Linked Entries for Complaint {id}
                        </h3>

                        {loadingLinks ? (
                            <p style={{ color: '#6b7280' }}>Loading linked entries...</p>
                        ) : linkedEntries ? (
                            <>
                                {/* Issues Tab / Table */}
                                {linkedEntries.issues && linkedEntries.issues.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '12px', color: '#2563EB' }}>
                                            Issues ({linkedEntries.issues.length})
                                        </h4>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>IR #</th>
                                                    <th>Item</th>
                                                    <th>Allocation</th>
                                                    <th>Unit</th>
                                                    <th>Issued To</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {linkedEntries.issues.map(issue => (
                                                    <tr key={issue.irNo}>
                                                        <td>{issue.irNo}</td>
                                                        <td>{issue.itemName}</td>
                                                        <td><strong>{issue.allocation}</strong></td>
                                                        <td>{issue.unit}</td>
                                                        <td>{issue.issuedTo}</td>
                                                        <td>
                                                            <span className={`badge ${issue.status === 'COMPLETED' ? 'badge-success' : issue.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                                {issue.isLocked ? '🔒 Locked' : issue.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link to={`/issues/view/${issue.irNo}`} className="btn btn-outline btn-sm" title="View Issue">
                                                                <FaEye /> View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Purchases Tab / Table */}
                                {linkedEntries.purchases && linkedEntries.purchases.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '12px', color: '#2563EB' }}>
                                            Purchases ({linkedEntries.purchases.length})
                                        </h4>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>CP #</th>
                                                    <th>Items</th>
                                                    <th>Allocation</th>
                                                    <th>Purchased By</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {linkedEntries.purchases.map(purchase => (
                                                    <tr key={purchase.cpNo}>
                                                        <td>{purchase.cpNo}</td>
                                                        <td>{Array.isArray(purchase.items) ? purchase.items.join(', ') : purchase.items}</td>
                                                        <td><strong>${purchase.allocation}</strong></td>
                                                        <td>{purchase.purchasedBy}</td>
                                                        <td>
                                                            <span className={`badge ${purchase.status === 'COMPLETED' ? 'badge-success' : purchase.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                                {purchase.isLocked ? '🔒 Locked' : purchase.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link to={`/purchases/view/${purchase.cpNo}`} className="btn btn-outline btn-sm" title="View Purchase">
                                                                <FaEye /> View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Scraps Tab / Table */}
                                {linkedEntries.scraps && linkedEntries.scraps.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '12px', color: '#2563EB' }}>
                                            Scraps ({linkedEntries.scraps.length})
                                        </h4>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>SR #</th>
                                                    <th>Item</th>
                                                    <th>Allocation</th>
                                                    <th>Unit</th>
                                                    <th>Returned By</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {linkedEntries.scraps.map(scrap => (
                                                    <tr key={scrap.srNo}>
                                                        <td>{scrap.srNo}</td>
                                                        <td>{scrap.itemName}</td>
                                                        <td><strong>{scrap.allocation}</strong></td>
                                                        <td>{scrap.unit}</td>
                                                        <td>{scrap.returnedBy}</td>
                                                        <td>
                                                            <span className={`badge ${scrap.status === 'COMPLETED' ? 'badge-success' : scrap.isLocked ? 'badge-info' : 'badge-warning'}`}>
                                                                {scrap.isLocked ? '🔒 Locked' : scrap.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link to={`/scraps/view/${scrap.srNo}`} className="btn btn-outline btn-sm" title="View Scrap">
                                                                <FaEye /> View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {(!linkedEntries.issues?.length && !linkedEntries.purchases?.length && !linkedEntries.scraps?.length) && (
                                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                                        No linked issues, purchases, or scrap entries found for this complaint.
                                    </p>
                                )}
                            </>
                        ) : null}
                    </div>
                )}
            </form>
        </div>
    );
};

export default ComplaintForm;