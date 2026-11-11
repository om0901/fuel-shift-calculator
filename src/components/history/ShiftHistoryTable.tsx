import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Badge } from '../common/Badge';
import { formatINR, formatLiters, formatVarianceLabel } from '../../utils/currency';
import { exportToCSV, exportToJSON, printShiftLedger } from '../../services/exportService';
import { Trash2, ClipboardList, Search, Download, Printer, Database } from 'lucide-react';
import { TallyStatus } from '../../types';

export const ShiftHistoryTable: FC = () => {
  const records = useShiftStore((state) => state.records);
  const filters = useShiftStore((state) => state.filters);
  const setFilter = useShiftStore((state) => state.setFilter);
  const setDeleteRecordTarget = useShiftStore((state) => state.setDeleteRecordTarget);
  const isLoading = useShiftStore((state) => state.isLoading);
  const showToast = useShiftStore((state) => state.showToast);

  // Apply filtering
  const filteredRecords = records.filter((rec) => {
    // 1. Status Filter
    if (filters.statusFilter === 'SHORTAGE' && rec.tallyStatus !== 'SHORTAGE') {
      return false;
    }
    if (
      (filters.statusFilter === 'MATCH' || filters.statusFilter === 'TALLY') &&
      rec.tallyStatus !== 'MATCH' &&
      rec.tallyStatus !== 'TALLY'
    ) {
      return false;
    }

    // 2. Search Term Filter
    if (filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.toLowerCase();
      const matchFuel = rec.fuelType.toLowerCase().includes(term);
      const matchNotes = (rec.notes || '').toLowerCase().includes(term);
      const matchDate = new Date(rec.timestamp).toLocaleString().toLowerCase().includes(term);
      const matchStatus = rec.tallyStatus.toLowerCase().includes(term);
      if (!matchFuel && !matchNotes && !matchDate && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No shift records available to export.', 'info');
      return;
    }
    const success = exportToCSV(records);
    if (success) {
      showToast('CSV export downloaded successfully!');
    }
  };

  const handleExportJSON = () => {
    if (records.length === 0) {
      showToast('No shift records available to backup.', 'info');
      return;
    }
    const success = exportToJSON(records);
    if (success) {
      showToast('JSON ledger backup downloaded successfully!');
    }
  };

  const handlePrint = () => {
    if (records.length === 0) {
      showToast('No shift records available to print.', 'info');
      return;
    }
    printShiftLedger();
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
      {/* Print-Only Formal Statement Header */}
      <div className="print-only mb-6 text-black border-b-2 border-black pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">
              FuelShift Tally - Pump Shift Audit Ledger
            </h1>
            <p className="text-xs text-gray-700">
              Nozzle Meter Readings &amp; Cash Reconciliation Statement
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold">Generated Timestamp:</p>
            <p>{new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Screen Table Header Strip */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Recent Shift Logs</h2>
          <p className="text-xs text-slate-400">
            Immutable audit record of verified shift reconciliations ({records.length} records)
          </p>
        </div>

        {/* Action Buttons: Export CSV, JSON Backup, & Print */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-700 hover:text-slate-100 text-xs font-medium text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Print Shift Statement / PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 hover:text-slate-100 text-xs font-medium text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-700 hover:text-slate-100 text-xs font-medium text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Download complete JSON data backup"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            JSON Backup
          </button>
        </div>
      </div>

      {/* Filter Ribbon (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by date, notes, fuel..."
            value={filters.searchTerm}
            onChange={(e) => setFilter('searchTerm', e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-700/80 shrink-0 select-none">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'TALLY', label: 'Tally OK' },
            { key: 'SHORTAGE', label: 'Shortages' },
          ].map((tab) => {
            const isActive =
              filters.statusFilter === tab.key ||
              (tab.key === 'TALLY' && filters.statusFilter === 'MATCH');

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter('statusFilter', tab.key as 'ALL' | TallyStatus)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/80 print:border-none">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-700/80">
            <tr>
              <th scope="col" className="px-4 py-3">Date &amp; Time</th>
              <th scope="col" className="px-4 py-3">Fuel Type</th>
              <th scope="col" className="px-4 py-3 text-right">Meter Liters</th>
              <th scope="col" className="px-4 py-3 text-right">Expected (₹)</th>
              <th scope="col" className="px-4 py-3 text-right">Collected (₹)</th>
              <th scope="col" className="px-4 py-3 text-center">Variance / Status</th>
              <th scope="col" className="px-4 py-3 text-right no-print">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 bg-slate-800/60 font-mono text-xs text-slate-200 print:text-black print:bg-white">
            {isLoading && records.length === 0 ? (
              // Loading Skeleton
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-28"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 bg-slate-700 rounded w-20 ml-auto"></div></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 bg-slate-700 rounded w-24 ml-auto"></div></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 bg-slate-700 rounded w-24 ml-auto"></div></td>
                  <td className="px-4 py-4 text-center"><div className="h-5 bg-slate-700 rounded-full w-24 mx-auto"></div></td>
                  <td className="px-4 py-4 text-right no-print"><div className="h-4 bg-slate-700 rounded w-6 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-sans print:text-black">
                    <div className="font-medium text-slate-100 print:text-black">{formatDate(record.timestamp)}</div>
                    {record.notes && (
                      <div className="text-[11px] text-slate-400 print:text-gray-600 max-w-xs truncate font-sans">
                        {record.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-700 text-slate-200 print:bg-gray-100 print:text-black print:border-gray-300">
                      {record.fuelType === 'PETROL' ? 'Petrol (MS)' : 'Diesel (HSD)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-100 print:text-black">
                    <div>{formatLiters(record.totalLiters)}</div>
                    <div className="text-[10px] text-slate-500 print:text-gray-600 font-normal">
                      {record.closingReading.toFixed(2)} - {record.openingReading.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 print:text-black">
                    {formatINR(record.expectedSale)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold print:text-black">
                    {formatINR(record.totalCollected)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge status={record.tallyStatus} className="text-[11px] px-2.5 py-0.5">
                      {formatVarianceLabel(record.variance, record.tallyStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-sans no-print">
                    <button
                      type="button"
                      onClick={() => setDeleteRecordTarget(record)}
                      disabled={isLoading}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
                      title="Delete shift record"
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-600">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      No shifts logged yet.
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Complete the calculation above and click "Save &amp; Commit Shift Record".
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
