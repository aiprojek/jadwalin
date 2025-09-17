
import type { Day, PrintSettings, InstitutionInfoItem } from './types';

export const DAYS_OF_WEEK: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ACCENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#6366f1'];

// --- DEFAULT SETTINGS FUNCTIONS (Guarantees fresh copies) ---
export const getDefaultPrintSettings = (): PrintSettings => ({
    paperSize: 'A4',
    orientation: 'landscape',
    margin: { top: 15, right: 10, bottom: 15, left: 10 },
    showHeader: true,
});

export const getDefaultInstitutionInfo = (): InstitutionInfoItem[] => ([
    { id: 'inst-default-1', label: 'Nama Lembaga Pendidikan', value: '', showInHeader: true },
    { id: 'inst-default-2', label: 'Nama Yayasan', value: '', showInHeader: true },
    { id: 'inst-default-3', label: 'Alamat & Kontak', value: '', showInHeader: true },
]);

export const getDefaultAcademicYear = () => ({ masehi: '', hijri: '' });

export const getDefaultGlobalDaysOff = (): Day[] => ['Saturday', 'Sunday'];

export const getDefaultWorkloadWarningThreshold = (): number => 40;
