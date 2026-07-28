// src/components/CashPurchase/PurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes, FaBoxes } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_TYPES, EXPENSE_HEADS } from '../../data/preDefinedLists';

const PurchaseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        purchaseDate: new Date().toISOString().split('T')[0],
        tradeSection: 'MASONRY',
        billInvoiceNo: '',
        items: [],
        purchasedBy: '',
        jobNo: '',
        expenseHead: 'Maintenance Materials',
        sourceDocuments: [],
        remarks: '',
        isActive: true
    });

    const [stockItems, setStockItems] = useState([]);
    const [jobNumbers, setJobNumbers] = useState([]);
    const [newJob, setNewJob] = useState('');
    const [showNewJob, setShowNewJob] = useState(false);
    const [newItem, setNewItem] = useState({
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        unitPrice: 0,
        description: '',
        isStoreItem: false,
        isNewItem: true
    });
    const [newSourceDoc, setNewSourceDoc] = useState({
        sourceType: 'COMPLAINT',
        reference: '',
        allocation: 0
    });

    useEffect(() => {
        loadData();
        if (isEdit) {
            loadPurchase();
        }
    }, [id]);

    const loadData = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data) {
                setStockItems(data.stock || []);
                setJobNumbers(data.jobNumbers || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadPurchase = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const purchase = data.purchases.find(p => p.cpNo === id);
            if (purchase) {
                setFormData({
                    ...purchase,
                    purchaseDate: purchase.purchaseDate || new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error('Error loading purchase:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        if (!newItem.itemName || !newItem.quantity || !newItem.unitPrice) {
            alert('Please fill all item fields');
            return;
        }

        const total = newItem.quantity * newItem.unitPrice;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                ...newItem,
                quantity: Number(newItem.quantity),
                unitPrice: Number(newItem.unitPrice),
                total: total,
                itemId: null
            }]
        }));
        setNewItem({
            itemName: '',
            quantity: 1,
            unit: 'Pieces',
            unitPrice: 0,
            description: '',
            isStoreItem: false,
            isNewItem: true
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleAddSourceDoc = () => {
        if (!newSourceDoc.reference || !newSourceDoc.reference.trim()) {
            alert('Source document reference is required');
            return;
        }

        const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
        const expectedTotal = calculateTotal();
        if (totalAllocated + Number(newSourceDoc.allocation) > expectedTotal) {
            alert('Total allocation exceeds total amount');
            return;
        }

        setFormData(prev => ({
            ...prev,
            sourceDocuments: [...prev.sourceDocuments, {
                ...newSourceDoc,
                reference: newSourceDoc.reference.trim(),
                allocation: Number(newSourceDoc.allocation),
                allocatedItems: formData.items.map(item => item.itemName),
                status: 'PENDING',
                isLocked: false,
                lockedAt: null,
                lockedBy: null
            }]
        }));
        setNewSourceDoc({ sourceType: 'COMPLAINT', reference: '', allocation: 0 });
    };

    const handleRemoveSourceDoc = (index) => {
        setFormData(prev => ({
            ...prev,
            sourceDocuments: prev.sourceDocuments.filter((_, i) => i !== index)
        }));
    };

    const handleAddJob = () => {
        if (newJob.trim()) {
            setJobNumbers(prev => [...prev, newJob.trim()]);
            setFormData(prev => ({ ...prev, jobNo: newJob.trim() }));
            setNewJob('');
            setShowNewJob(false);
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.purchasedBy || formData.items.length === 0) {
            alert('Please fill in all required fields and add at least one item');
            return;
        }

        if (formData.sourceDocuments.length === 0) {
            alert('Please add at least one source document');
            return;
        }

        const total = calculateTotal();
        if (total === 0) {
            alert('Total amount must be greater than 0');
            return;
        }

        // Check allocation
        const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
        if (totalAllocated !== total) {
            alert(`Total allocation (${totalAllocated}) must equal ${total}`);
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const now = new Date().toISOString();
            const hasStoreItems = formData.items.some(item => item.isStoreItem);

            if (isEdit) {
                const index = data.purchases.findIndex(p => p.cpNo === id);
                if (index !== -1) {
                    data.purchases[index] = {
                        ...data.purchases[index],
                        ...formData,
                        totalAmount: total,
                        addedToStock: hasStoreItems,
                        modifiedBy: 'Admin',
                        modifiedAt: now
                    };
                }
            } else {
                const purchaseCount = data.purchases.length + 1;
                const cpNo = `CP-${String(purchaseCount).padStart(3, '0')}`;

                const newPurchase = {
                    cpNo,
                    ...formData,
                    totalAmount: total,
                    addedToStock: hasStoreItems,
                    stockUpdateDate: hasStoreItems ? now : null,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now,
                    modificationReason: ''
                };

                data.purchases.push(newPurchase);
                data.counters.purchase = purchaseCount;

                // Update stock for store items
                if (hasStoreItems) {
                    formData.items.forEach(item => {
                        if (item.isStoreItem) {
                            // Check if item exists in stock
                            let stockItem = data.stock.find(s => s.itemName.toLowerCase() === item.itemName.toLowerCase());

                            if (stockItem) {
                                // Update existing stock
                                stockItem.currentStock += item.quantity;
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
                                    type: 'CASH_PURCHASE',
                                    documentNo: cpNo,
                                    quantity: item.quantity,
                                    balance: stockItem.currentStock,
                                    sourceDoc: formData.sourceDocuments[0]?.reference || '',
                                    remarks: `Purchased from market - ${item.description || ''}`
                                });
                            } else {
                                // Create new stock item
                                const itemCount = data.stock.length + 1;
                                const itemId = `MAT-${String(itemCount).padStart(3, '0')}`;

                                const newStockItem = {
                                    itemId,
                                    itemName: item.itemName,
                                    tradeSection: formData.tradeSection,
                                    category: formData.expenseHead,
                                    unit: item.unit,
                                    currentStock: item.quantity,
                                    minimumStock: 5,
                                    maximumStock: 100,
                                    openingStock: 0,
                                    unitPrice: item.unitPrice,
                                    totalValue: item.quantity * item.unitPrice,
                                    location: 'New Item',
                                    status: 'GOOD',
                                    transactions: [{
                                        date: now,
                                        type: 'CASH_PURCHASE',
                                        documentNo: cpNo,
                                        quantity: item.quantity,
                                        balance: item.quantity,
                                        sourceDoc: formData.sourceDocuments[0]?.reference || '',
                                        remarks: `New item purchased from market - ${item.description || ''}`
                                    }],
                                    lastUpdated: now,
                                    createdBy: 'Admin',
                                    createdAt: now,
                                    modifiedBy: 'Admin',
                                    modifiedAt: now,
                                    isActive: true
                                };

                                data.stock.push(newStockItem);
                            }
                        }
                    });
                }
            }

            // Save job numbers
            if (formData.jobNo && !data.jobNumbers.includes(formData.jobNo)) {
                data.jobNumbers.push(formData.jobNo);
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/purchases');
        } catch (error) {
            console.error('Error saving purchase:', error);
            alert('Error saving purchase');
        }
    };

    const totalAllocated = formData.sourceDocuments.reduce((sum, doc) => sum + (Number(doc.allocation) || 0), 0);
    const expectedTotal = calculateTotal();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Purchase' : 'New Cash Purchase'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/purchases')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Purchase Date *</label>
                        <input
                            type="date"
                            name="purchaseDate"
                            value={formData.purchaseDate}
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
                        <label className="form-label">Bill/Invoice No.</label>
                        <input
                            type="text"
                            name="billInvoiceNo"
                            value={formData.billInvoiceNo}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Invoice number"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Purchased By *</label>
                        <input
                            type="text"
                            name="purchasedBy"
                            value={formData.purchasedBy}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Purchaser name"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Job No.</label>
                        <div className="job-selector">
                            <select
                                name="jobNo"
                                value={formData.jobNo}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="">Select Job</option>
                                {jobNumbers.map(job => (
                                    <option key={job} value={job}>{job}</option>
                                ))}
                            </select>
                            {!showNewJob ? (
                                <button type="button" className="btn btn-outline" onClick={() => setShowNewJob(true)}>
                                    <FaPlus /> New
                                </button>
                            ) : (
                                <div className="new-job-input">
                                    <input
                                        type="text"
                                        value={newJob}
                                        onChange={(e) => setNewJob(e.target.value)}
                                        placeholder="Enter new job"
                                        className="form-control"
                                    />
                                    <button type="button" className="btn btn-success" onClick={handleAddJob}>
                                        Add
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => setShowNewJob(false)}>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Expense Head</label>
                        <select
                            name="expenseHead"
                            value={formData.expenseHead}
                            onChange={handleChange}
                            className="form-control"
                        >
                            {EXPENSE_HEADS.map(head => (
                                <option key={head} value={head}>{head}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Items Section */}
                <div className="items-section">
                    <h3>Purchase Items</h3>
                    <div className="items-grid">
                        <input
                            type="text"
                            placeholder="Item Name *"
                            value={newItem.itemName}
                            onChange={(e) => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                            className="form-control"
                        />
                        <input
                            type="number"
                            placeholder="Quantity *"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            className="form-control"
                            min="1"
                        />
                        <select
                            value={newItem.unit}
                            onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                            className="form-control"
                        >
                            {UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Unit Price *"
                            value={newItem.unitPrice}
                            onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                            className="form-control"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="items-grid">
                        <input
                            type="text"
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                            className="form-control"
                        />
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={newItem.isStoreItem}
                                onChange={(e) => setNewItem(prev => ({ ...prev, isStoreItem: e.target.checked }))}
                            />
                            <FaBoxes /> Add to Stock
                        </label>
                        <button type="button" className="btn btn-primary" onClick={handleAddItem}>
                            <FaPlus /> Add Item
                        </button>
                    </div>

                    {formData.items.length > 0 && (
                        <div className="items-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                        <th>Stock</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.itemName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>${item.unitPrice}</td>
                                            <td>${item.total}</td>
                                            <td>
                                                {item.isStoreItem ? (
                                                    <span className="badge badge-success">
                                                        <FaBoxes /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-secondary">No</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveItem(index)}
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
                                            Total Amount:
                                        </td>
                                        <td colSpan="3" style={{ fontWeight: 'bold' }}>
                                            ${calculateTotal()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
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
                            min="0"
                            step="0.01"
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
                                            <td>${doc.allocation}</td>
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
                        <FaSave /> {isEdit ? 'Update' : 'Create'} Purchase
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseForm;