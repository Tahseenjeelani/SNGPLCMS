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
    { value: 'COMPLAINT', label: 'Complaint', requiresRef: true, refIsDropdown: true },
    { value: 'APPROVAL', label: 'Approval', requiresRef: true, refIsDropdown: false },
    { value: 'HSE_ANOMALY', label: 'HSE Anomaly', requiresRef: true, refIsDropdown: false },
    { value: 'EMAIL', label: 'Email', requiresRef: true, refIsDropdown: false },
    { value: 'ROUTINE_WORK', label: 'Routine Work', requiresRef: false, refIsDropdown: false }
];

/** Status options for Complaints — exactly two */
export const COMPLAINT_STATUSES = [
    { value: 'Open', label: 'Open' },
    { value: 'Completed', label: 'Completed' }
];

export const STATIONS = [
    'Wah Terminal',
    'Transmission Office Kohat',
    'Executive Transit/Mess I-9 Islamabad',
    'Main Stores (Wah)',
    'Repeater / Compressor Station C-3 / CC-1 (Haranpur)',
    'Repeater Station C-4 (Choa Saiden Shah)',
    'Repeater Station C-4A (Choa Saiden Shah Hilltop)',
    'Repeater Station C-5 (Chakwal)',
    'Repeater / Compressor Station C-6/CC-3 (Gali Jagir)',
    'Repeater Station C-7 (Fatehjang)',
    'Repeater Station C-8 (Wah)',
    'Repeater Station C-9 (Kamra)',
    'Repeater Station C-9A (Hattian)',
    'Repeater Station C-10 (Nowshera)',
    'Repeater Station F-3 (Daudkhel)',
    'Compressor Station FC-1 (Dhullian)',
    'Telecom Radion Repeater Station (Thandiyani)',
    'Telecom Radio Repeater Station SMS Dandot',
    'SMS Ranial',
    'SMS Naugazi',
    'SMS Abbottabad',
    'SMS Peshawar',
    'SMS D.I Khan',
    'End Point SMS Murree',
    'Attock Crossing',
    'Kabul River Crossing',
    'Jehlum River Crossing',
    'Indus River Crossing (Khushal Garh)',
    'Adhi Zero Point Valve Assembly',
    'Shahpur Zero Valve Assembly',


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