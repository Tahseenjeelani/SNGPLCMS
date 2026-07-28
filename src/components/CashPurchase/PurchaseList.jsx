import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash, FaLock, FaBoxes, FaSearch } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectionFilter, setSectionFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchases();
    }, []);

    useEffect(() => {
        filterPurchases();
    }, [purchases, searchTerm, sectionFilter]);

    const loadPurchases = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.purchases) {
                setPurchases(data.purchases);
                setFilteredPurchases(data.purchases);
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPurchases = () => {
        let filtered = [...purchases];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.cpNo.toLowerCase().includes(term) ||
                p.billInvoiceNo?.toLowerCase().includes(term) ||
                p.purchasedBy.toLowerCase().includes(term) ||
                p.items.some(item => item.itemName.toLowerCase().includes(term)) ||
                p.sourceDocuments.some(s => s.reference.toLowerCase().includes(term))
            );
        }

        if (sectionFilter !== 'ALL') {
            filtered = filtered.filter(p => p.tradeSection === sectionFilter);
        }

        setFilteredPurchases(filtered);
    };

    const handleDelete = (cpNo) => {
        if (window.confirm('Are you sure you want to delete this purchase?')) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                data.purchases = data.purchases.filter(p => p.cpNo !== cpNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadPurchases();
            } catch (error) {
                console.error('Error deleting purchase:', error);
                alert('Error deleting purchase');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading purchases...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Cash Purchases</h1>
                <div className="page-actions">
                    <Link to="/purchases/new" className="btn btn-primary">
                        <FaPlus /> New Purchase
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by CP#, invoice, item, source doc..."
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
                    <button className="btn btn-outline" onClick={loadPurchases}>
                        Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>CP #</th>
                                <th>Date</th>
                                <th>Section</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Stock</th>
                                <th>Source Docs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        No purchases found
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map((purchase) => (
                                    <tr key={purchase.cpNo}>
                                        <td>
                                            <strong>{purchase.cpNo}</strong>
                                            {!purchase.isActive && (
                                                <span className="badge badge-secondary ml-2">Inactive</span>
                                            )}
                                        </td>
                                        <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                                        <td>
                                            <span style={{ color: getTradeSectionColor(purchase.tradeSection) }}>
                                                {getTradeSectionLabel(purchase.tradeSection)}
                                            </span>
                                        </td>
                                        <td>
                                            {purchase.items.map((item, idx) => (
                                                <div key={idx} className="item-tag">
                                                    {item.itemName} ({item.quantity})
                                                </div>
                                            ))}
                                        </td>
                                        <td>${purchase.totalAmount}</td>
                                        <td>
                                            {purchase.addedToStock ? (
                                                <span className="badge badge-success">
                                                    <FaBoxes /> Added
                                                </span>
                                            ) : (
                                                <span className="badge badge-secondary">Consumable</span>
                                            )}
                                        </td>
                                        <td>
                                            {purchase.sourceDocuments.map((doc, idx) => (
                                                <div key={idx} className="source-doc-tag">
                                                    <span className="badge badge-info">{doc.sourceType}</span>
                                                    <span className="badge badge-secondary">{doc.reference}</span>
                                                    {doc.isLocked && <FaLock className="lock-icon" size={10} />}
                                                </div>
                                            ))}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/purchases/view/${purchase.cpNo}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="View"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    to={`/purchases/edit/${purchase.cpNo}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(purchase.cpNo)}
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
                    <span>Total: {filteredPurchases.length} purchases</span>
                </div>
            </div>
        </div>
    );
};

export default PurchaseList;