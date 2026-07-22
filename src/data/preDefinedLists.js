// src/data/preDefinedLists.js
export const TRADE_SECTIONS = [
    { value: 'MASONRY', label: 'Masonry', color: '#8B6914' },
    { value: 'PLUMBING', label: 'Plumbing', color: '#2563EB' },
    { value: 'CARPENTRY', label: 'Carpentry', color: '#D97706' },
    { value: 'PAINTING', label: 'Painting', color: '#059669' }
];

export const UNITS = [
    'Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'
];

export const SOURCE_TYPES = [
    'COMPLAINT', 'APPROVAL', 'EMAIL', 'HSE', 'OTHER'
];

export const EXPENSE_HEADS = [
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
];

export const COMPLAINT_STATUSES = [
    'NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'VERIFIED', 'CLOSED'
];

export const PROCUREMENT_TYPES = [
    'STORE', 'MARKET', 'BOTH'
];

export const getTradeSectionColor = (section) => {
    const found = TRADE_SECTIONS.find(s => s.value === section);
    return found ? found.color : '#6B7280';
};

export const getTradeSectionLabel = (section) => {
    const found = TRADE_SECTIONS.find(s => s.value === section);
    return found ? found.label : section;
};