import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  FileText, 
  ArrowRight, 
  Clock, 
  Cpu, 
  ShieldAlert, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { ReceiptDocument, DecisionStatus } from '../types';
import { exportReceiptAsJSON, exportReceiptAsCSV } from '../utils/exportUtils';

interface ReceiptHistoryViewProps {
  receipts: ReceiptDocument[];
  onOpenReceipt: (receipt: ReceiptDocument) => void;
  onViewAudit: (auditId: string) => void;
}

export const ReceiptHistoryView: React.FC<ReceiptHistoryViewProps> = ({
  receipts,
  onOpenReceipt,
  onViewAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [degradationFilter, setDegradationFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.overallDecision === statusFilter;
    const matchesDegradation =
      degradationFilter === 'all' || r.degradationType === degradationFilter;
    const matchesMethod = methodFilter === 'all' || r.processingMethod.includes(methodFilter);

    return matchesSearch && matchesStatus && matchesDegradation && matchesMethod;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <h1 className="font-bold text-lg text-slate-900">Receipt Processing History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of previously processed thermal receipts, evidence evaluation decisions, and audit snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200">
            Total Records: <strong className="font-mono">{receipts.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Receipt ID, Filename, or Merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted Only</option>
            <option value="warning">Warning Only</option>
            <option value="manual_verification">Manual Verification Only</option>
          </select>
        </div>

        {/* Degradation Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Degradation:</span>
          <select
            value={degradationFilter}
            onChange={(e) => setDegradationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium focus:outline-none"
          >
            <option value="all">All Degradations</option>
            <option value="thermal_fading">Thermal Fading</option>
            <option value="oil_stain">Oil Stain</option>
            <option value="creased_tear">Creased / Tear</option>
            <option value="uneven_lighting">Uneven Lighting</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Receipt ID & Merchant</th>
                <th className="px-3 py-3">Filename & Degradation</th>
                <th className="px-3 py-3">Processing Date</th>
                <th className="px-3 py-3 text-center">Overall Decision</th>
                <th className="px-3 py-3 text-center">High-Risk Review</th>
                <th className="px-3 py-3 text-center">Proc Time</th>
                <th className="px-3 py-3 text-left">Reviewer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No matching receipt records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const highRiskAlert = r.highRiskReviewCount > 0;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => onOpenReceipt(r)}
                    >
                      {/* Receipt ID & Merchant */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-teal-700">
                          {r.id}
                        </div>
                        <div className="text-[11px] text-slate-600 font-semibold truncate max-w-[200px]">
                          {r.merchantName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rcpt #{r.receiptNumber} • {r.totalAmount}
                        </div>
                      </td>

                      {/* Filename & Degradation */}
                      <td className="px-3 py-3">
                        <div className="font-mono text-slate-700 text-[11px] truncate max-w-[180px]">
                          {r.filename}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono capitalize">
                            {r.degradationType.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            ({r.degradationSeverity})
                          </span>
                        </div>
                      </td>

                      {/* Processing Date */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{r.processedTimestamp || r.uploadTimestamp}</span>
                        </div>
                      </td>

                      {/* Overall Decision Status */}
                      <td className="px-3 py-3 text-center">
                        {r.overallDecision === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Accepted
                          </span>
                        ) : r.overallDecision === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            <AlertOctagon className="w-3 h-3 text-red-600" />
                            Manual Verification
                          </span>
                        )}
                      </td>

                      {/* High-Risk Review */}
                      <td className="px-3 py-3 text-center">
                        {highRiskAlert ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            {r.highRiskReviewCount} field(s)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">0 pending</span>
                        )}
                      </td>

                      {/* Proc Time */}
                      <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-600">
                        {r.processingTimeMs} ms
                      </td>

                      {/* Reviewer */}
                      <td className="px-3 py-3 text-slate-700 font-medium text-[11px]">
                        {r.reviewerName}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceipt(r)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs"
                            title="Open in Review Workspace"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => exportReceiptAsJSON(r)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                            title="Download JSON Export"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
