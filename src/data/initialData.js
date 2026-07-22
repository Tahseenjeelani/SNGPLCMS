// src/data/initialData.js
import { v4 as uuidv4 } from 'uuid';

let dataInitialized = false;

export const initializeData = () => {
    if (dataInitialized) return;

    // Check if data exists in localStorage
    const existingData = localStorage.getItem('snglData');
    if (existingData) {
        try {
            const parsed = JSON.parse(existingData);
            if (parsed && parsed.complaints) {
                dataInitialized = true;
                return;
            }
        } catch (e) {
            console.error('Error parsing existing data');
        }
    }

    // Initialize with sample data
    const initialData = {
        complaints: generateSampleComplaints(),
        issues: generateSampleIssues(),
        purchases: generateSamplePurchases(),
        scraps: generateSampleScraps(),
        stock: generateSampleStock(),
        jobNumbers: ['JOB-001', 'JOB-002', 'JOB-003'],
        expenseHeads: [
            'Maintenance Materials',
            'Spare Parts',
            'Consumables',
            'Tools & Equipment',
            'Safety Equipment',
            'Plumbing Materials',
            'Electrical Materials',
            'Painting Materials',
            'Carpentry Materials',
            'Masonry Materials',
            'HSE Supplies',
            'Office Maintenance',
            'Other'
        ],
        counters: {
            complaint: 5,
            issue: 5,
            purchase: 5,
            scrap: 5,
            stock: 6
        }
    };

    localStorage.setItem('snglData', JSON.stringify(initialData));
    dataInitialized = true;
};

const generateSampleComplaints = () => {
    const now = new Date().toISOString();
    return [
        {
            id: '01/07/2026',
            complaintDate: '2026-07-01',
            location: 'Building A - Room 101',
            indenter: 'John Smith',
            procurementType: 'STORE',
            storeItems: [
                { itemId: 'MAT-001', itemName: 'Cement', quantity: 10, unit: 'Bags' },
                { itemId: 'MAT-002', itemName: 'Steel Bars', quantity: 20, unit: 'Pieces' }
            ],
            marketItems: [],
            voucherNumber: '',
            totalBillAmount: 0,
            attendedBy: 'Mike Johnson',
            completedDate: null,
            status: 'IN_PROGRESS',
            sourceDocType: 'COMPLAINT',
            sourceReference: '01/07/2026',
            isCompleted: false,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            remarks: 'Water leakage in bathroom'
        },
        {
            id: '02/07/2026',
            complaintDate: '2026-07-02',
            location: 'Building B - Floor 2',
            indenter: 'Sarah Ahmed',
            procurementType: 'MARKET',
            storeItems: [],
            marketItems: [
                { itemName: 'PVC Pipes', quantity: 5, unit: 'Pieces', unitPrice: 25, total: 125 },
                { itemName: 'Fittings', quantity: 10, unit: 'Pieces', unitPrice: 10, total: 100 }
            ],
            voucherNumber: 'CP-001',
            totalBillAmount: 225,
            attendedBy: 'Mike Johnson',
            completedDate: null,
            status: 'ASSIGNED',
            sourceDocType: 'COMPLAINT',
            sourceReference: '02/07/2026',
            isCompleted: false,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            remarks: 'Plumbing issue in kitchen'
        },
        {
            id: '03/07/2026',
            complaintDate: '2026-07-03',
            location: 'Building C - Store Room',
            indenter: 'David Brown',
            procurementType: 'BOTH',
            storeItems: [
                { itemId: 'MAT-003', itemName: 'Paint', quantity: 15, unit: 'Tins' }
            ],
            marketItems: [
                { itemName: 'Brushes', quantity: 5, unit: 'Pieces', unitPrice: 8, total: 40 }
            ],
            voucherNumber: 'CP-002',
            totalBillAmount: 40,
            attendedBy: 'Tom Wilson',
            completedDate: '2026-07-05',
            status: 'COMPLETED',
            sourceDocType: 'COMPLAINT',
            sourceReference: '03/07/2026',
            isCompleted: true,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            remarks: 'Painting required for warehouse'
        },
        {
            id: '04/07/2026',
            complaintDate: '2026-07-04',
            location: 'Building D - Workshop',
            indenter: 'Robert Taylor',
            procurementType: 'STORE',
            storeItems: [
                { itemId: 'MAT-004', itemName: 'Wood Planks', quantity: 30, unit: 'Pieces' },
                { itemId: 'MAT-005', itemName: 'Nails', quantity: 2, unit: 'Kg' }
            ],
            marketItems: [],
            voucherNumber: '',
            totalBillAmount: 0,
            attendedBy: 'Tom Wilson',
            completedDate: null,
            status: 'NEW',
            sourceDocType: 'COMPLAINT',
            sourceReference: '04/07/2026',
            isCompleted: false,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            remarks: 'Need new workbench'
        },
        {
            id: '05/07/2026',
            complaintDate: '2026-07-05',
            location: 'Building E - Office',
            indenter: 'Emily Clark',
            procurementType: 'MARKET',
            storeItems: [],
            marketItems: [
                { itemName: 'LED Lights', quantity: 20, unit: 'Pieces', unitPrice: 15, total: 300 },
                { itemName: 'Wires', quantity: 3, unit: 'Rolls', unitPrice: 45, total: 135 }
            ],
            voucherNumber: 'CP-003',
            totalBillAmount: 435,
            attendedBy: 'Mike Johnson',
            completedDate: null,
            status: 'ON_HOLD',
            sourceDocType: 'COMPLAINT',
            sourceReference: '05/07/2026',
            isCompleted: false,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            remarks: 'Electrical fault in main office'
        }
    ];
};

const generateSampleIssues = () => {
    const now = new Date().toISOString();
    return [
        {
            irNo: 'IR-001',
            issueDate: '2026-07-01',
            tradeSection: 'MASONRY',
            itemId: 'MAT-001',
            itemName: 'Cement',
            quantity: 5,
            unit: 'Bags',
            description: 'For wall repair',
            issuedTo: 'Mike Johnson',
            issuedBy: 'Store Keeper',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '01/07/2026',
                    allocation: 5,
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        },
        {
            irNo: 'IR-002',
            issueDate: '2026-07-02',
            tradeSection: 'PLUMBING',
            itemId: 'MAT-002',
            itemName: 'Steel Bars',
            quantity: 10,
            unit: 'Pieces',
            description: 'For reinforcement',
            issuedTo: 'Mike Johnson',
            issuedBy: 'Store Keeper',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '02/07/2026',
                    allocation: 10,
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        },
        {
            irNo: 'IR-003',
            issueDate: '2026-07-03',
            tradeSection: 'CARPENTRY',
            itemId: 'MAT-004',
            itemName: 'Wood Planks',
            quantity: 15,
            unit: 'Pieces',
            description: 'For workbench',
            issuedTo: 'Tom Wilson',
            issuedBy: 'Store Keeper',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '04/07/2026',
                    allocation: 15,
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        }
    ];
};

const generateSamplePurchases = () => {
    const now = new Date().toISOString();
    return [
        {
            cpNo: 'CP-001',
            purchaseDate: '2026-07-01',
            tradeSection: 'PLUMBING',
            billInvoiceNo: 'INV-001',
            items: [
                {
                    itemId: null,
                    itemName: 'PVC Pipes',
                    quantity: 5,
                    unit: 'Pieces',
                    unitPrice: 25,
                    total: 125,
                    description: 'For plumbing repair',
                    isStoreItem: false,
                    isNewItem: true
                },
                {
                    itemId: null,
                    itemName: 'Fittings',
                    quantity: 10,
                    unit: 'Pieces',
                    unitPrice: 10,
                    total: 100,
                    description: 'Pipe fittings',
                    isStoreItem: false,
                    isNewItem: true
                }
            ],
            totalAmount: 225,
            purchasedBy: 'Mike Johnson',
            jobNo: 'JOB-001',
            expenseHead: 'Plumbing Materials',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '02/07/2026',
                    allocation: 225,
                    allocatedItems: ['PVC Pipes', 'Fittings'],
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            addedToStock: false,
            stockUpdateDate: null,
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        },
        {
            cpNo: 'CP-002',
            purchaseDate: '2026-07-03',
            tradeSection: 'PAINTING',
            billInvoiceNo: 'INV-002',
            items: [
                {
                    itemId: null,
                    itemName: 'Brushes',
                    quantity: 5,
                    unit: 'Pieces',
                    unitPrice: 8,
                    total: 40,
                    description: 'Paint brushes',
                    isStoreItem: false,
                    isNewItem: true
                }
            ],
            totalAmount: 40,
            purchasedBy: 'Tom Wilson',
            jobNo: 'JOB-002',
            expenseHead: 'Painting Materials',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '03/07/2026',
                    allocation: 40,
                    allocatedItems: ['Brushes'],
                    status: 'COMPLETED',
                    isLocked: true,
                    lockedAt: '2026-07-05T10:00:00.000Z',
                    lockedBy: 'Admin'
                }
            ],
            addedToStock: false,
            stockUpdateDate: null,
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        },
        {
            cpNo: 'CP-003',
            purchaseDate: '2026-07-05',
            tradeSection: 'MASONRY',
            billInvoiceNo: 'INV-003',
            items: [
                {
                    itemId: null,
                    itemName: 'LED Lights',
                    quantity: 20,
                    unit: 'Pieces',
                    unitPrice: 15,
                    total: 300,
                    description: 'Office lights',
                    isStoreItem: true,
                    isNewItem: true
                },
                {
                    itemId: null,
                    itemName: 'Wires',
                    quantity: 3,
                    unit: 'Rolls',
                    unitPrice: 45,
                    total: 135,
                    description: 'Electrical wires',
                    isStoreItem: true,
                    isNewItem: true
                }
            ],
            totalAmount: 435,
            purchasedBy: 'Mike Johnson',
            jobNo: 'JOB-003',
            expenseHead: 'Electrical Materials',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '05/07/2026',
                    allocation: 435,
                    allocatedItems: ['LED Lights', 'Wires'],
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            addedToStock: true,
            stockUpdateDate: '2026-07-05T14:30:00.000Z',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        }
    ];
};

const generateSampleScraps = () => {
    const now = new Date().toISOString();
    return [
        {
            srNo: 'SR-001',
            date: '2026-07-04',
            tradeSection: 'MASONRY',
            itemId: 'MAT-002',
            itemName: 'Steel Bars',
            quantity: 2,
            unit: 'Pieces',
            description: 'Damaged bars returned',
            returnedBy: 'Mike Johnson',
            receivedBy: 'Store Keeper',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '01/07/2026',
                    allocation: 2,
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        },
        {
            srNo: 'SR-002',
            date: '2026-07-05',
            tradeSection: 'CARPENTRY',
            itemId: 'MAT-004',
            itemName: 'Wood Planks',
            quantity: 3,
            unit: 'Pieces',
            description: 'Warped planks returned',
            returnedBy: 'Tom Wilson',
            receivedBy: 'Store Keeper',
            sourceDocuments: [
                {
                    sourceType: 'COMPLAINT',
                    reference: '04/07/2026',
                    allocation: 3,
                    status: 'PENDING',
                    isLocked: false,
                    lockedAt: null,
                    lockedBy: null
                }
            ],
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            modificationReason: '',
            isActive: true
        }
    ];
};

const generateSampleStock = () => {
    const now = new Date().toISOString();
    return [
        {
            itemId: 'MAT-001',
            itemName: 'Cement',
            tradeSection: 'MASONRY',
            category: 'Building Materials',
            unit: 'Bags',
            currentStock: 85,
            minimumStock: 20,
            maximumStock: 200,
            openingStock: 100,
            unitPrice: 12.50,
            totalValue: 1062.50,
            location: 'A-01',
            status: 'GOOD',
            transactions: [
                {
                    date: '2026-07-01T00:00:00.000Z',
                    type: 'OPENING',
                    documentNo: 'OPEN-001',
                    quantity: 100,
                    balance: 100,
                    sourceDoc: 'Initial Stock',
                    remarks: 'Opening stock'
                },
                {
                    date: '2026-07-01T10:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-001',
                    quantity: -5,
                    balance: 95,
                    sourceDoc: '01/07/2026',
                    remarks: 'Issued for complaint'
                },
                {
                    date: '2026-07-02T14:00:00.000Z',
                    type: 'CASH_PURCHASE',
                    documentNo: 'CP-003',
                    quantity: 10,
                    balance: 85,
                    sourceDoc: '05/07/2026',
                    remarks: 'Purchased for office'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            itemId: 'MAT-002',
            itemName: 'Steel Bars',
            tradeSection: 'MASONRY',
            category: 'Construction Materials',
            unit: 'Pieces',
            currentStock: 38,
            minimumStock: 15,
            maximumStock: 100,
            openingStock: 50,
            unitPrice: 18.00,
            totalValue: 684.00,
            location: 'B-03',
            status: 'GOOD',
            transactions: [
                {
                    date: '2026-07-01T00:00:00.000Z',
                    type: 'OPENING',
                    documentNo: 'OPEN-002',
                    quantity: 50,
                    balance: 50,
                    sourceDoc: 'Initial Stock',
                    remarks: 'Opening stock'
                },
                {
                    date: '2026-07-02T09:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-002',
                    quantity: -10,
                    balance: 40,
                    sourceDoc: '02/07/2026',
                    remarks: 'Issued for plumbing'
                },
                {
                    date: '2026-07-04T16:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-005',
                    quantity: -2,
                    balance: 38,
                    sourceDoc: '04/07/2026',
                    remarks: 'Scrap returned'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            itemId: 'MAT-003',
            itemName: 'Paint',
            tradeSection: 'PAINTING',
            category: 'Finishing Materials',
            unit: 'Tins',
            currentStock: 5,
            minimumStock: 10,
            maximumStock: 50,
            openingStock: 20,
            unitPrice: 25.00,
            totalValue: 125.00,
            location: 'C-02',
            status: 'LOW',
            transactions: [
                {
                    date: '2026-07-01T00:00:00.000Z',
                    type: 'OPENING',
                    documentNo: 'OPEN-003',
                    quantity: 20,
                    balance: 20,
                    sourceDoc: 'Initial Stock',
                    remarks: 'Opening stock'
                },
                {
                    date: '2026-07-03T11:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-003',
                    quantity: -15,
                    balance: 5,
                    sourceDoc: '03/07/2026',
                    remarks: 'Issued for painting'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            itemId: 'MAT-004',
            itemName: 'Wood Planks',
            tradeSection: 'CARPENTRY',
            category: 'Wood Products',
            unit: 'Pieces',
            currentStock: 12,
            minimumStock: 10,
            maximumStock: 60,
            openingStock: 30,
            unitPrice: 22.00,
            totalValue: 264.00,
            location: 'D-01',
            status: 'GOOD',
            transactions: [
                {
                    date: '2026-07-01T00:00:00.000Z',
                    type: 'OPENING',
                    documentNo: 'OPEN-004',
                    quantity: 30,
                    balance: 30,
                    sourceDoc: 'Initial Stock',
                    remarks: 'Opening stock'
                },
                {
                    date: '2026-07-03T13:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-004',
                    quantity: -15,
                    balance: 15,
                    sourceDoc: '04/07/2026',
                    remarks: 'Issued for workbench'
                },
                {
                    date: '2026-07-05T15:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-006',
                    quantity: -3,
                    balance: 12,
                    sourceDoc: '05/07/2026',
                    remarks: 'Scrap returned'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            itemId: 'MAT-005',
            itemName: 'Nails',
            tradeSection: 'CARPENTRY',
            category: 'Hardware',
            unit: 'Kg',
            currentStock: 8,
            minimumStock: 5,
            maximumStock: 25,
            openingStock: 10,
            unitPrice: 6.00,
            totalValue: 48.00,
            location: 'D-03',
            status: 'GOOD',
            transactions: [
                {
                    date: '2026-07-01T00:00:00.000Z',
                    type: 'OPENING',
                    documentNo: 'OPEN-005',
                    quantity: 10,
                    balance: 10,
                    sourceDoc: 'Initial Stock',
                    remarks: 'Opening stock'
                },
                {
                    date: '2026-07-04T10:00:00.000Z',
                    type: 'ISSUE',
                    documentNo: 'IR-004',
                    quantity: -2,
                    balance: 8,
                    sourceDoc: '04/07/2026',
                    remarks: 'Issued for workbench'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            itemId: 'MAT-006',
            itemName: 'LED Lights',
            tradeSection: 'MASONRY',
            category: 'Electrical',
            unit: 'Pieces',
            currentStock: 20,
            minimumStock: 10,
            maximumStock: 50,
            openingStock: 0,
            unitPrice: 15.00,
            totalValue: 300.00,
            location: 'E-02',
            status: 'GOOD',
            transactions: [
                {
                    date: '2026-07-05T14:30:00.000Z',
                    type: 'CASH_PURCHASE',
                    documentNo: 'CP-003',
                    quantity: 20,
                    balance: 20,
                    sourceDoc: '05/07/2026',
                    remarks: 'Purchased for office'
                }
            ],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        }
    ];
};