import { ShiftRecord } from '../types';

/**
 * Cleanly formats shift records into CSV format and triggers browser download.
 */
export function exportToCSV(records: ShiftRecord[], filenamePrefix = 'fuel_shift_records'): boolean {
  if (!records || records.length === 0) {
    alert('No shift records available to export.');
    return false;
  }

  const headers = [
    'Shift ID',
    'Shift Date',
    'Timestamp',
    'Date & Time',
    'Fuel Type',
    'Fuel Price (INR)',
    'Opening Reading',
    'Closing Reading',
    'Total Liters Sold',
    'Expected Revenue (INR)',
    'Cash Collected (INR)',
    'UPI Collected (INR)',
    'Credit Slips (INR)',
    'Total Handover (INR)',
    'Variance (INR)',
    'Tally Status',
    'Notes',
  ];

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '""';
    const stringVal = String(value);
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const rows = records.map((r) => [
    escapeCSV(r.id),
    escapeCSV(r.shiftDate || r.timestamp.split('T')[0]),
    escapeCSV(r.timestamp),
    escapeCSV(new Date(r.timestamp).toLocaleString('en-IN')),
    escapeCSV(r.fuelType === 'PETROL' ? 'Petrol (MS)' : 'Diesel (HSD)'),
    escapeCSV(r.fuelPrice.toFixed(2)),
    escapeCSV(r.openingReading.toFixed(2)),
    escapeCSV(r.closingReading.toFixed(2)),
    escapeCSV(r.totalLiters.toFixed(2)),
    escapeCSV(r.expectedSale.toFixed(2)),
    escapeCSV(r.cashAmount.toFixed(2)),
    escapeCSV(r.upiAmount.toFixed(2)),
    escapeCSV(r.creditAmount.toFixed(2)),
    escapeCSV(r.totalCollected.toFixed(2)),
    escapeCSV(r.variance.toFixed(2)),
    escapeCSV(r.tallyStatus),
    escapeCSV(r.notes || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export CSV:', err);
    return false;
  }
}

/**
 * Exports shift records as a structured JSON backup file.
 */
export function exportToJSON(records: ShiftRecord[], filenamePrefix = 'fuel_shift_backup'): boolean {
  if (!records || records.length === 0) {
    alert('No shift records available to export.');
    return false;
  }

  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'FuelShift Tally',
      version: '1.0.0',
      recordCount: records.length,
      records,
    };

    const jsonContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${today}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export JSON backup:', err);
    return false;
  }
}

/**
 * Triggers standard browser print dialog for audit ledger.
 */
export function printShiftLedger(): void {
  if (typeof window !== 'undefined' && window.print) {
    window.print();
  }
}
