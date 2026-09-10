// src/components/ScrapReturn/ScrapForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_TYPES } from '../../data/preDefinedLists';

const ScrapForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        tradeSection: 'MASONRY',
        itemId: '',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        description: '',
        returnedBy: '',
        receivedBy: 'Store Keeper',
        sourceDocuments: [],
        remarks: '',
        isActive: true
    });

    const [stockItems, setStockItems] = useState([]);
    const [newSourceDoc, setNewSourceDoc] = useState({
        sourceType: 'COMPLAINT',
        reference: '',
        allocation: 1
    });

    useEffect(() => {
        loadStockItems();
        if (isEdit) {
            loadScrap();
        }
    }, [id]);

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.stock) {
                setStockItems(data.stock.filter(s => s.isActive !== false));
            }
        } catch (error) {
            console.error('Error loading stock items:', error);
        }
    };

    const loadScrap = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const scrap = data.scraps.find(s => s.srNo === id);
            if (scrap) {
                setFormData({
                    ...scrap,
                    date: scrap.date || new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error('Error loading scrap:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'itemId') {
            const item = stockItems.find(s => s.itemId === value);
            if (item) {
                setFormData(prev => ({
                    ...prev,
                    itemId: value,
                    itemName: item.itemName,
                    unit: item.unit
                }));
            }
        }
    };

    const handleAddSourceDoc = () => {
        if (!newSourceDoc.reference || !newSourceDoc.reference.trim()) {
            alert('Source document reference is required');
            return;
        }

        if (newSourceDoc.sourceType === 'COMPLAINT') {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const complaintExists = data && data.complaints && data.complaints.some(c => c.id === newSourceDoc.reference.trim());
            if (!complaintExists) {
                alert(`Complaint with ID '${newSourceDoc.reference.trim()}' does not exist.`);
                return;
            }
        }

        if (!newSourceDoc.allocation || Number(newSourceDoc.allocation) <= 0) {
            alert('Allocation must be greater than 0');
            return;
        }

        const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
        const expectedTotal = Number(formData.quantity) || 0;
        if (totalAllocated + Number(newSourceDoc.allocation) > expectedTotal) {
            alert(`Total allocation (${totalAllocated + Number(newSourceDoc.allocation)}) exceeds quantity (${expectedTotal})`);
            return;
        }

        setFormData(prev => ({
            ...prev,
            sourceDocuments: [...prev.sourceDocuments, {
                ...newSourceDoc,
                reference: newSourceDoc.reference.trim(),
                allocation: Number(newSourceDoc.allocation),
                status: 'PENDING',
                isLocked: false,
                lockedAt: null,
                lockedBy: null
            }]
        }));
        setNewSourceDoc({ sourceType: 'COMPLAINT', reference: '', allocation: 1 });
    };

    const handleRemoveSourceDoc = (index) => {
        setFormData(prev => ({
            ...prev,
            sourceDocuments: prev.sourceDocuments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.itemId || !formData.quantity || !formData.returnedBy) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.sourceDocuments.length === 0) {
            alert('Please add at least one source document');
            return;
        }

        const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
        const expectedTotal = Number(formData.quantity) || 0;
        if (totalAllocated !== expectedTotal) {
            alert(`Total allocation (${totalAllocated}) must equal ${expectedTotal}`);
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const now = new Date().toISOString();

            if (isEdit) {
                const index = data.scraps.findIndex(s => s.srNo === id);
                if (index !== -1) {
                    data.scraps[index] = {
                        ...data.scraps[index],
                        ...formData,
                        modifiedBy: 'Admin',
                        modifiedAt: now
                    };
                }
            } else {
                const scrapCount = data.scraps.length + 1;
                const srNo = `SR-${String(scrapCount).padStart(3, '0')}`;

                const newScrap = {
                    srNo,
                    ...formData,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now,
                    modificationReason: ''
                };

                data.scraps.push(newScrap);
                data.counters.scrap = scrapCount;

                // Update stock (increase)
                const stockIndex = data.stock.findIndex(s => s.itemId === formData.itemId);
                if (stockIndex !== -1) {
                    const stockItem = data.stock[stockIndex];
                    stockItem.currentStock += Number(formData.quantity);
                    stockItem.totalValue = stockItem.currentStock * stockItem.unitPrice;
                    stockItem.lastUpdated = now;
                    stockItem.modifiedBy = 'Admin';
                    stockItem.modifiedAt = now;

                    // Update status
                    if (stockItem.currentStock < stockItem.minimumStock * 0.5) {
                        stockItem.status = 'CRITICAL';
                    } else if (stockItem.currentStock < stockItem.minimumStock) {
                        stockItem.status = 'LOW';
                    } else {
                        stockItem.status = 'GOOD';
                    }

                    // Add transaction
                    if (!stockItem.transactions) stockItem.transactions = [];
                    stockItem.transactions.push({
                        date: now,
                        type: 'SCRAP_RETURN',
                        documentNo: srNo,
                        quantity: Number(formData.quantity),
                        balance: stockItem.currentStock,
                        sourceDoc: formData.sourceDocuments[0]?.reference || '',
                        remarks: formData.description || 'Returned scrap material'
                    });
                }
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/scraps');
        } catch (error) {
            console.error('Error saving scrap:', error);
            alert('Error saving scrap');
        }
    };

    const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
    const expectedTotal = Number(formData.quantity) || 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Scrap' : 'New Scrap Return'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/scraps')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Date *</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Trade Section *</label>
                        <select
                            name="tradeSection"
                            value={formData.tradeSection}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            {TRADE_SECTIONS.map(section => (
                                <option key={section.value} value={section.value}>
                                    {section.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Item *</label>
                        <select
                            name="itemId"
                            value={formData.itemId}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            <option value="">Select Item</option>
                            {stockItems.map(item => (
                                <option key={item.itemId} value={item.itemId}>
                                    {item.itemName} (Current: {item.currentStock} {item.unit})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Quantity *</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="form-control"
                            min="1"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Unit</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="form-control"
                            disabled={!!formData.itemId}
                        >
                            {UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Returned By *</label>
                        <input
                            type="text"
                            name="returnedBy"
                            value={formData.returnedBy}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Worker/Supervisor name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Received By</label>
                        <input
                            type="text"
                            name="receivedBy"
                            value={formData.receivedBy}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Store Keeper name"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-control"
                        rows="2"
                        placeholder="Optional description..."
                    />
                </div>

                {/* Source Documents Section */}
                <div className="items-section">
                    <h3>Source Documents</h3>
                    <div className="allocation-summary" style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: '500' }}>
                        <span>Total Allocated: </span>
                        <strong style={{ color: totalAllocated === expectedTotal ? '#059669' : '#dc2626' }}>
                            {totalAllocated} / {expectedTotal}
                        </strong>
                        {totalAllocated !== expectedTotal && (
                            <span style={{ color: '#dc2626', marginLeft: '8px' }}>
                                ⚠️ Must equal {expectedTotal}
                            </span>
                        )}
                    </div>
                    <div className="items-grid">
                        <select
                            value={newSourceDoc.sourceType}
                            onChange={(e) => setNewSourceDoc(prev => ({ ...prev, sourceType: e.target.value }))}
                            className="form-control"
                        >
                            {SOURCE_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Reference *"
                            value={newSourceDoc.reference}
                            onChange={(e) => setNewSourceDoc(prev => ({ ...prev, reference: e.target.value }))}
                            className="form-control"
                        />
                        <input
                            type="number"
                            placeholder="Allocation *"
                            value={newSourceDoc.allocation}
                            onChange={(e) => setNewSourceDoc(prev => ({ ...prev, allocation: Number(e.target.value) }))}
                            className="form-control"
                            min="1"
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddSourceDoc}
                            disabled={!newSourceDoc.reference || !newSourceDoc.reference.trim()}
                        >
                            <FaPlus /> Add
                        </button>
                    </div>

                    {formData.sourceDocuments.length > 0 && (
                        <div className="items-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Source Type</th>
                                        <th>Reference</th>
                                        <th>Allocation</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.sourceDocuments.map((doc, index) => (
                                        <tr key={index}>
                                            <td>{doc.sourceType}</td>
                                            <td>{doc.reference}</td>
                                            <td>{doc.allocation}</td>
                                            <td>
                                                <span className={`badge ${doc.isLocked ? 'badge-success' : 'badge-warning'}`}>
                                                    {doc.isLocked ? 'Locked' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                {!doc.isLocked && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleRemoveSourceDoc(index)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        className="form-control"
                        rows="2"
                        placeholder="Additional notes..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        <FaSave /> {isEdit ? 'Update' : 'Create'} Scrap Record
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScrapForm;