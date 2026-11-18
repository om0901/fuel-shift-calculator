import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Badge } from '../common/Badge';
import { formatINR, formatLiters, formatVarianceLabel } from '../../utils/currency';
import { roundToTwo } from '../../utils/calculations';
import { exportToCSV, exportToJSON, printShiftLedger } from '../../services/exportService';
import {
  Trash2,
  ClipboardList,
  Search,
  Download,
  Printer,
  Database,
  Calendar,
  X,
  CalendarX,
} from 'lucide-react';
import { TallyStatus } from '../../types';

export const ShiftHistoryTable: FC = () => {
  const records = useShiftStore((state) => state.records);
  const filters = useShiftStore((state) => state.filters);
  const setFilter = useShiftStore((state) => state.setFilter);
  const setDeleteRecordTarget = useShiftStore((state) => state.setDeleteRecordTarget);
  const isLoading = useShiftStore((state) => state.isLoading);
  const showToast = useShiftStore((state) => state.showToast);

  // Apply filtering: 1. Date Filter, 2. Status Filter, 3. Search Term Filter
  const filteredRecords = records.filter((rec) => {
    // 1. Date Filter
    if (filters.dateFilter && filters.dateFilter.trim() !== '') {
      const recordDate = rec.shiftDate || rec.timestamp.split('T')[0];
      if (recordDate !== filters.dateFilter.trim()) {
        return false;
      }
    }

    // 2. Status Filter
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

    // 3. Search Term Filter
    if (filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.toLowerCase();
      const matchFuel = rec.fuelType.toLowerCase().includes(term);
      const matchNotes = (rec.notes || '').toLowerCase().includes(term);
      const matchDate = new Date(rec.timestamp).toLocaleString().toLowerCase().includes(term);
      const matchShiftDate = (rec.shiftDate || '').toLowerCase().includes(term);
      const matchStatus = rec.tallyStatus.toLowerCase().includes(term);
      if (!matchFuel && !matchNotes && !matchDate && !matchShiftDate && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  // Calculate Date-Wise Summary metrics if a date filter is selected
  const isDateFiltered = Boolean(filters.dateFilter && filters.dateFilter.trim() !== '');
  const dateTotalLiters = roundToTwo(filteredRecords.reduce((acc, r) => acc + r.totalLiters, 0));
  const dateTotalExpected = roundToTwo(filteredRecords.reduce((acc, r) => acc + r.expectedSale, 0));
  const dateTotalCollected = roundToTwo(filteredRecords.reduce((acc, r) => acc + r.totalCollected, 0));
  const dateNetVariance = roundToTwo(dateTotalCollected - dateTotalExpected);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No shift records available to export.', 'info');
      return;
    }
    const success = exportToCSV(filteredRecords.length > 0 ? filteredRecords : records);
    if (success) {
      showToast('CSV export downloaded successfully!');
    }
  };

  const handleExportJSON = () => {
    if (records.length === 0) {
      showToast('No shift records available to backup.', 'info');
      return;
    }
    const success = exportToJSON(filteredRecords.length > 0 ? filteredRecords : records);
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

  const formatTimestamp = (isoString: string, shiftDate?: string) => {
    try {
      const d = new Date(isoString);
      const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dateFormatted = shiftDate ? formatDateDisplay(shiftDate) : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return { dateFormatted, timeStr };
    } catch {
      return { dateFormatted: shiftDate || isoString, timeStr: '' };
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
            Immutable audit record of verified shift reconciliations ({records.length} records total)
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

      {/* Filter Ribbon: Search, Date Filter & Status Tabs */}
      <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Left Side: Search + Date Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search date, notes, fuel..."
              value={filters.searchTerm}
              onChange={(e) => setFilter('searchTerm', e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="date"
              value={filters.dateFilter || ''}
              onChange={(e) => setFilter('dateFilter', e.target.value)}
              className="bg-transparent border-none text-xs text-slate-100 font-mono focus:outline-none [color-scheme:dark] cursor-pointer"
              title="Filter records by Shift Date"
            />
            {filters.dateFilter && (
              <button
                type="button"
                onClick={() => setFilter('dateFilter', '')}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors ml-1"
                title="Clear Date / Show All"
                aria-label="Clear Date Filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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

      {/* Date-Wise Summary Strip (Shown when date filter is active and has matching records) */}
      {isDateFiltered && filteredRecords.length > 0 && (
        <div className="bg-slate-900/90 rounded-lg p-3.5 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-200 font-sans font-semibold">
              Daily Summary ({formatDateDisplay(filters.dateFilter!)}):
            </span>
            <span className="text-slate-400 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {filteredRecords.length} shift{filteredRecords.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <div>
              <span className="text-slate-400 mr-1">Total Sold:</span>
              <span className="text-slate-100 font-bold">{formatLiters(dateTotalLiters)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Expected:</span>
              <span className="text-blue-400 font-bold">{formatINR(dateTotalExpected)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Collected:</span>
              <span className="text-emerald-400 font-bold">{formatINR(dateTotalCollected)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Net Variance:</span>
              <span
                className={`font-bold ${
                  dateNetVariance < 0
                    ? 'text-rose-400'
                    : dateNetVariance > 0
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              >
                {dateNetVariance < 0
                  ? `- ${formatINR(Math.abs(dateNetVariance))}`
                  : dateNetVariance > 0
                  ? `+ ${formatINR(dateNetVariance)}`
                  : formatINR(0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/80 print:border-none">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-700/80">
            <tr>
              <th scope="col" className="px-4 py-3">Shift Date &amp; Time</th>
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
              filteredRecords.map((record) => {
                const { dateFormatted, timeStr } = formatTimestamp(record.timestamp, record.shiftDate);

                return (
                  <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-sans print:text-black">
                      <div className="font-semibold text-slate-100 print:text-black flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 no-print" />
                        {dateFormatted}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {timeStr}
                      </div>
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
                );
              })
            ) : isDateFiltered ? (
              // Specific Empty State when filtering by date
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="p-3 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-500">
                      <CalendarX className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      No shift records found for {formatDateDisplay(filters.dateFilter!)}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Try selecting a different date or clear the date filter to see all records.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilter('dateFilter', '')}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
                    >
                      Clear Date Filter / Show All
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // Default Empty State
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
