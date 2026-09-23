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

/**
 * Source Document Types
 * - COMPLAINT       : Internal. Reference is selected from a dropdown of Open Complaints only.
 * - APPROVAL        : External. User manually types the reference number.
 * - HSE_ANOMALY     : External. User manually types the reference number.
 * - EMAIL           : External. User manually types the reference number.
 * - ROUTINE_WORK    : No reference number required.
 */
export const SOURCE_DOC_TYPES = [
    { value: 'COMPLAINT',    label: 'Complaint',    requiresRef: true,  refIsDropdown: true  },
    { value: 'APPROVAL',     label: 'Approval',     requiresRef: true,  refIsDropdown: false },
    { value: 'HSE_ANOMALY',  label: 'HSE Anomaly',  requiresRef: true,  refIsDropdown: false },
    { value: 'EMAIL',        label: 'Email',        requiresRef: true,  refIsDropdown: false },
    { value: 'ROUTINE_WORK', label: 'Routine Work', requiresRef: false, refIsDropdown: false }
];

/** Status options for Complaints — exactly two */
export const COMPLAINT_STATUSES = [
    { value: 'Open',      label: 'Open' },
    { value: 'Completed', label: 'Completed' }
];

export const STATIONS = [
    'Head Office Lahore',
    'Lahore Region',
    'Faisalabad Region',
    'Multan Region',
    'Gujranwala Region',
    'Sahiwal Region',
    'Sheikhupura Region',
    'Islamabad Region',
    'Sargodha Region',
    'Bahawalpur Region',
    'Rawalpindi Region',
    'Peshawar Region',
    'Gujrat Region'
];

export const EXPENSE_HEADS = [
    '561',
    '562',
    '563',
    '565',
    '571',
    '581',
    '582',
    '575',
    '598',
    '930'
];

// Helpers
export const getTradeSectionColor = (section) => {
    const found = TRADE_SECTIONS.find(s => s.value === section);
    return found ? found.color : '#6B7280';
};

export const getTradeSectionLabel = (section) => {
    const found = TRADE_SECTIONS.find(s => s.value === section);
    return found ? found.label : section;
};

export const getSourceDocConfig = (value) => {
    return SOURCE_DOC_TYPES.find(s => s.value === value) || SOURCE_DOC_TYPES[0];
};