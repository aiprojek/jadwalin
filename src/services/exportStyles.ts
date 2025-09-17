
import type { PrintSettings } from '../types';

// This file provides a static, pre-generated CSS string that includes all necessary styles
// for the exported schedule view. It now dynamically adds @page rules based on user settings.

export const getExportStyles = (settings?: PrintSettings): string => {
  const staticStyles = `
/* --- Base & Typography --- */
body { font-family: sans-serif; }
.p-8 { padding: 2rem; }
.p-4 { padding: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.text-center { text-align: center; }
.border-b-2 { border-bottom-width: 2px; }
.border-black { border-color: #000; }
.pb-4 { padding-bottom: 1rem; }
.text-lg { font-size: 1.125rem; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.text-gray-800 { color: #1f2937; }
.text-2xl { font-size: 1.5rem; }
.text-gray-900 { color: #111827; }
.text-sm { font-size: 0.875rem; }
.text-gray-600 { color: #4b5563; }
.mt-4 { margin-top: 1rem; }
.text-md { font-size: 1rem; }
.font-semibold { font-weight: 600; }
.space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
.p-6 { padding: 1.5rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); }
.text-xl { font-size: 1.25rem; }
.mb-4 { margin-bottom: 1rem; }
.text-blue-700 { color: #1d4ed8; }
.overflow-x-auto { overflow-x: auto; }
.w-full { width: 100%; }
.min-w-\\[600px\\] { min-width: 600px; }
.border-collapse { border-collapse: collapse; }
.text-white { color: #fff; }
.border-gray-200 { border-color: #e5e7eb; }
.p-2 { padding: 0.5rem; }
.font-mono { font-family: monospace; }
.text-xs { font-size: 0.75rem; }
.text-gray-500 { color: #6b7280; }
.border { border-width: 1px; }
.text-gray-100 { color: #f3f4f6; }
.text-gray-300 { color: #d1d5db; }
.text-blue-500 { color: #3b82f6; }

/* --- Table Rows --- */
tr.bg-gray-100 { background-color: #f3f4f6; }
tr.odd\\:bg-gray-50:nth-child(odd) { background-color: #f9fafb; }

/* --- Dark Mode (for context, but usually disabled for print) --- */
.dark .dark\\:bg-gray-900 { background-color: #111827; }
.dark .dark\\:border-gray-400 { border-color: #9ca3af; }
.dark .dark\\:text-gray-200 { color: #e5e7eb; }
.dark .dark\\:text-gray-100 { color: #f3f4f6; }
.dark .dark\\:text-gray-400 { color: #9ca3af; }
.dark .dark\\:bg-gray-800 { background-color: #1f2937; }
.dark .dark\\:text-blue-300 { color: #93c5fd; }
.dark .dark\\:text-gray-900 { color: #111827; }
.dark .dark\\:border-gray-600 { border-color: #4b5563; }
.dark .dark\\:border-gray-700 { border-color: #374151; }
.dark .dark\\:bg-gray-700\\/50 { background-color: rgba(55, 65, 81, 0.5); }
.dark .dark\\:odd\\:bg-gray-800\\/50:nth-child(odd) { background-color: rgba(31, 41, 55, 0.5); }
.dark .dark\\:text-gray-300 { color: #d1d5db; }
.dark .dark\\:text-gray-600 { color: #4b5563; }
.dark .dark\\:text-blue-400 { color: #60a5fa; }
`;

  let pageStyles = `
/* --- Print Overrides --- */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  .shadow { box-shadow: none; }
  .p-8, .p-6, .p-4 { padding: 0 !important; }
}
`;

  if (settings) {
    const { paperSize, orientation, margin } = settings;
    let sizeValue;

    if (paperSize === 'F4') {
        // F4 is not a standard CSS size, so we define it manually.
        sizeValue = orientation === 'landscape' ? '330mm 210mm' : '210mm 330mm';
    } else {
        // For standard sizes, we can just use the name and orientation.
        sizeValue = `${paperSize} ${orientation}`;
    }

    pageStyles += `
@page {
  size: ${sizeValue};
  margin: ${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm;
}
`;
  } else {
    // Default fallback if no settings are provided
    pageStyles += `
@page {
  size: A4 landscape;
  margin: 15mm 10mm 15mm 10mm;
}
`;
  }
  
  return staticStyles + pageStyles;
};
