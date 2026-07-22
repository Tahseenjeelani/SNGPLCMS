// src/components/ScrapReturn/ScrapList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaLock, FaSearch } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const ScrapList = () => {
    const [scraps, setScraps] = useState([]);
    const [filteredScraps, setFilteredScraps] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectionFilter, setSectionFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScraps();
    }, []);

    useEffect(() => {
        filterScraps();
    }, [scraps, searchTerm, sectionFilter]);

    const loadScraps = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.scraps) {
                setScraps(data.scraps);
                setFilteredScraps(data.scraps);
            }
        } catch (error) {
            console.error('Error loading scraps:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterScraps = () => {
        let filtered = [...scraps];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.srNo.toLowerCase().includes(term) ||
                s.itemName.toLowerCase().includes(term) ||
                s.returnedBy.toLowerCase().includes(term) ||
                s.sourceDocuments.some(d => d.reference.toLowerCase().includes(term))
            );
        }

        if (sectionFilter !== 'ALL') {
            filtered = filtered.filter(s => s.tradeSection === sectionFilter);
        }

        setFilteredScraps(filtered);
    };

    const handleDelete = (srNo) => {
        if (window.confirm('Are you sure you want to delete this scrap record?')) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                data.scraps = data.scraps.filter(s => s.srNo !== srNo);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadScraps();
            } catch (error) {
                console.error('Error deleting scrap:', error);
                alert('Error deleting scrap');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading scraps...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Scrap Returns</h1>
                <div className="page-actions">
                    <Link to="/scraps/new" className="btn btn-primary">
                        <FaPlus /> New Scrap
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by SR#, item, returned by, source doc..."
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
                    <button className="btn btn-outline" onClick={loadScraps}>
                        Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>SR #</th>
                                <th>Date</th>
                                <th>Section</th>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Returned By</th>
                                <th>Source Docs</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredScraps.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="empty-state">
                                        No scrap records found
                                    </td>
                                </tr>
                            ) : (
                                filteredScraps.map((scrap) => (
                                    <tr key={scrap.srNo}>
                                        <td>
                                            <strong>{scrap.srNo}</strong>
                                            {!scrap.isActive && (
                                                <span className="badge badge-secondary ml-2">Inactive</span>
                                            )}
                                        </td>
                                        <td>{new Date(scrap.date).toLocaleDateString()}</td>
                                        <td>
                                            <span style={{ color: getTradeSectionColor(scrap.tradeSection) }}>
                                                {getTradeSectionLabel(scrap.tradeSection)}
                                            </span>
                                        </td>
                                        <td>{scrap.itemName}</td>
                                        <td>{scrap.quantity} {scrap.unit}</td>
                                        <td>{scrap.returnedBy}</td>
                                        <td>
                                            {scrap.sourceDocuments.map((doc, idx) => (
                                                <div key={idx} className="source-doc-tag">
                                                    <span className="badge badge-info">{doc.sourceType}</span>
                                                    <span className="badge badge-secondary">{doc.reference}</span>
                                                    {doc.isLocked && <FaLock className="lock-icon" size={10} />}
                                                </div>
                                            ))}
                                        </td>
                                        <td>
                                            {scrap.sourceDocuments.some(s => s.isLocked) ? (
                                                <span className="badge badge-success">
                                                    <FaLock /> Locked
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning">Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/scraps/edit/${scrap.srNo}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(scrap.srNo)}
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
                    <span>Total: {filteredScraps.length} scrap records</span>
                </div>
            </div>
        </div>
    );
};

export default ScrapList;