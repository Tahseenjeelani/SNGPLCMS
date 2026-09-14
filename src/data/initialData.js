// src/data/initialData.js
let dataInitialized = false;

export const initializeData = () => {
    if (dataInitialized) return;

    const existingData = localStorage.getItem('snglData');
    if (existingData) {
        try {
            const parsed = JSON.parse(existingData);
            // Check if data is in the NEW schema format (has complaints with description field)
            if (parsed && parsed.complaints && parsed.complaints.length > 0 && parsed.complaints[0].description !== undefined) {
                dataInitialized = true;
                return;
            }
        } catch (e) {
            console.error('Error parsing existing data, resetting...');
        }
    }

    // Initialize with new-schema sample data
    const initialData = {
        complaints: generateSampleComplaints(),
        issues: generateSampleIssues(),
        purchases: generateSamplePurchases(),
        scraps: generateSampleScraps(),
        // No stock array — stock is computed from issues + purchases
        counters: {
            complaint: 3,
            issue: 3,
            purchase: 3,
            scrap: 2
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
            description: 'Water leakage in Building A Room 101. Pipe burst causing damage to floor tiles.',
            complainant: 'John Smith',
            status: 'Open',
            remarks: 'Urgent repair required',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        },
        {
            id: '02/07/2026',
            complaintDate: '2026-07-05',
            description: 'Ceiling plaster falling in corridor B. Safety hazard for staff.',
            complainant: 'Sarah Ahmed',
            status: 'Open',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        },
        {
            id: '03/07/2026',
            complaintDate: '2026-07-10',
            description: 'Door carpentry repair needed in main conference room.',
            complainant: 'Ali Hassan',
            status: 'Completed',
            remarks: 'Completed on time',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        }
    ];
};

const generateSampleIssues = () => {
    const now = new Date().toISOString();
    return [
        {
            irNo: 'IR-001',
            issueDate: '2026-07-02',
            tradeSection: 'PLUMBING',
            itemId: 'pipe-fittings',
            itemName: 'PVC Pipe Fittings',
            quantity: 5,
            unit: 'Pieces',
            description: 'Required for leakage repair',
            issuedTo: 'Plumber Hassan',
            issuedBy: 'Store Keeper',
            sourceDocType: 'COMPLAINT',
            sourceReference: '01/07/2026',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            irNo: 'IR-002',
            issueDate: '2026-07-06',
            tradeSection: 'MASONRY',
            itemId: 'cement-bags',
            itemName: 'Cement',
            quantity: 10,
            unit: 'Bags',
            description: 'For ceiling repair work',
            issuedTo: 'Mason Team A',
            issuedBy: 'Store Keeper',
            sourceDocType: 'COMPLAINT',
            sourceReference: '02/07/2026',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            irNo: 'IR-003',
            issueDate: '2026-07-15',
            tradeSection: 'MASONRY',
            itemId: 'cement-bags',
            itemName: 'Cement',
            quantity: 4,
            unit: 'Bags',
            description: 'Routine maintenance work',
            issuedTo: 'Maintenance Team',
            issuedBy: 'Store Keeper',
            sourceDocType: 'ROUTINE_WORK',
            sourceReference: '',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        }
    ];
};

const generateSamplePurchases = () => {
    const now = new Date().toISOString();
    return [
        {
            cpNo: 'CP-001',
            purchaseDate: '2026-07-03',
            tradeSection: 'PLUMBING',
            billInvoiceNo: 'INV-2026-001',
            items: [
                { itemName: 'PVC Pipe Fittings', quantity: 20, unit: 'Pieces', unitPrice: 150, total: 3000, description: 'Extra fittings stock' },
                { itemName: 'Sealant', quantity: 5, unit: 'Tins', unitPrice: 500, total: 2500, description: 'Pipe sealing material' }
            ],
            totalAmount: 5500,
            purchasedBy: 'Procurement Officer',
            jobNo: '',
            expenseHead: 'Plumbing Materials',
            isStoreStockItem: true,
            sourceDocType: 'COMPLAINT',
            sourceReference: '01/07/2026',
            remarks: 'Purchased for store stock replenishment',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            cpNo: 'CP-002',
            purchaseDate: '2026-07-07',
            tradeSection: 'MASONRY',
            billInvoiceNo: 'INV-2026-002',
            items: [
                { itemName: 'Cement', quantity: 50, unit: 'Bags', unitPrice: 800, total: 40000, description: 'Bulk purchase for stock' }
            ],
            totalAmount: 40000,
            purchasedBy: 'Procurement Officer',
            jobNo: '',
            expenseHead: 'Masonry Materials',
            isStoreStockItem: true,
            sourceDocType: 'APPROVAL',
            sourceReference: 'APPR-2026-007',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            cpNo: 'CP-003',
            purchaseDate: '2026-07-11',
            tradeSection: 'CARPENTRY',
            billInvoiceNo: 'INV-2026-003',
            items: [
                { itemName: 'Door Hinges', quantity: 10, unit: 'Pieces', unitPrice: 200, total: 2000, description: '' },
                { itemName: 'Wood Polish', quantity: 3, unit: 'Tins', unitPrice: 750, total: 2250, description: '' }
            ],
            totalAmount: 4250,
            purchasedBy: 'Maintenance Supervisor',
            jobNo: '',
            expenseHead: 'Carpentry Materials',
            isStoreStockItem: false,
            sourceDocType: 'COMPLAINT',
            sourceReference: '03/07/2026',
            remarks: 'Direct use, not for stock',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
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
            tradeSection: 'PLUMBING',
            itemId: 'pipe-fittings',
            itemName: 'PVC Pipe Fittings',
            quantity: 2,
            unit: 'Pieces',
            description: 'Unused fittings returned after leak repair',
            returnedBy: 'Plumber Hassan',
            receivedBy: 'Store Keeper',
            sourceDocType: 'COMPLAINT',
            sourceReference: '01/07/2026',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        },
        {
            srNo: 'SR-002',
            date: '2026-07-08',
            tradeSection: 'MASONRY',
            itemId: 'cement-bags',
            itemName: 'Cement',
            quantity: 3,
            unit: 'Bags',
            description: 'Surplus cement from ceiling repair',
            returnedBy: 'Mason Team A',
            receivedBy: 'Store Keeper',
            sourceDocType: 'COMPLAINT',
            sourceReference: '02/07/2026',
            remarks: '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        }
    ];
};