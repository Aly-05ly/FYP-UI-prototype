import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Lock, 
  ExternalLink, 
  X, 
  Eye
} from 'lucide-react';
import { AuditRecord } from '../types';
import { exportAuditRecordAsJSON } from '../utils/exportUtils';

interface AuditLogViewProps {
  auditRecords: AuditRecord[];
  onOpenReceiptById: (receiptId: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditRecords,
  onOpenReceiptById,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const filteredRecords = auditRecords.filter((rec) => {
    return (
      rec.auditId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reviewer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h1 className="font-bold text-lg text-slate-900">Research Audit Log & Traceability</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured execution log tracking pipeline methods, Equation (8) composite scores, abstention thresholds, and reviewer decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-slate-900 text-teal-300 rounded-md font-mono text-[11px] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Immutable Research Format</span>
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Audit ID, Receipt ID, Filename, or Reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Main Audit Records Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Audit ID & Checksum</th>
                <th className="px-3 py-3">Receipt ID & File</th>
                <th className="px-3 py-3">Method ID</th>
                <th className="px-3 py-3">Processing Timestamp</th>
                <th className="px-3 py-3 text-center">Decision</th>
                <th className="px-3 py-3">Reviewer</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No audit records found.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.auditId}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    {/* Audit ID & Checksum */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700">
                        {rec.auditId}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {rec.inputChecksum}
                      </div>
                    </td>

                    {/* Receipt ID & File */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{rec.receiptId}</div>
                      <div className="text-[10px] text-slate-500 font-sans truncate max-w-[150px]">
                        {rec.filename}
                      </div>
                    </td>

                    {/* Method ID */}
                    <td className="px-3 py-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                        {rec.methodId}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-3 py-3 text-slate-600 font-sans text-[11px]">
                      {rec.processingTimestamp}
                    </td>

                    {/* Decision */}
                    <td className="px-3 py-3 text-center font-sans">
                      {rec.decision === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Accepted
                        </span>
                      ) : rec.decision === 'warning' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          Manual Ver.
                        </span>
                      )}
                    </td>

                    {/* Reviewer */}
                    <td className="px-3 py-3 font-sans text-slate-700">
                      {rec.reviewer}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => exportAuditRecordAsJSON(rec)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                          title="Export Audit Record JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL FOR SELECTED AUDIT RECORD */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Audit Record Details: <span className="font-mono text-teal-300">{selectedRecord.auditId}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Receipt Ref: {selectedRecord.receiptId} ({selectedRecord.filename})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-slate-50/50">
              {/* Checksum & Pipeline Card */}
              <div className="bg-white p-4 rounded-md border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] block">
                  1. Execution Pipeline & Hash Verification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Restoration Method ID:</span>
                    <code className="font-mono font-bold text-slate-800">{selectedRecord.methodId}</code>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Processing Timestamp:</span>
                    <span className="font-mono text-slate-800">{selectedRecord.processingTimestamp}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Input Source Hash (SHA256):</span>
                    <code className="font-mono text-[10px] bg-slate-100 p-1 rounded block text-slate-700 select-all">
                      {selectedRecord.inputChecksum}
                    </code>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Output Restored + Heatmap Hash (SHA256):</span>
                    <code className="font-mono text-[10px] bg-slate-100 p-1 rounded block text-slate-700 select-all">
                      {selectedRecord.outputChecksum}
                    </code>
                  </div>
                </div>
              </div>

              {/* Threshold Parameters */}
              <div className="bg-white p-4 rounded-md border border-slate-200">
                <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] block mb-2">
                  2. Abstention Thresholds (§4.3.2)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                    <span className="text-emerald-800 text-[10px] block font-semibold">Accept Threshold (τ_accept)</span>
                    <span className="font-mono font-bold text-emerald-900 text-sm">
                      {selectedRecord.thresholdConfig.traceThreshold >= 0.8 ? '≥ 0.85' : `${(selectedRecord.thresholdConfig.traceThreshold * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="bg-amber-50/70 p-2 rounded border border-amber-200">
                    <span className="text-amber-800 text-[10px] block font-semibold">Warning Threshold (τ_warn)</span>
                    <span className="font-mono font-bold text-amber-900 text-sm">
                      0.70 – 0.85
                    </span>
                  </div>
                  <div className="bg-rose-50/70 p-2 rounded border border-rose-200">
                    <span className="text-rose-800 text-[10px] block font-semibold">Manual Review Threshold</span>
                    <span className="font-mono font-bold text-rose-900 text-sm">
                      &lt; 0.70 or Rule Failure
                    </span>
                  </div>
                </div>
              </div>

              {/* Field Decisions Table */}
              <div className="bg-white p-4 rounded-md border border-slate-200">
                <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] block mb-2">
                  3. Field Decisions Snapshot & Composite Score A_field (Eq. 8)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-[10px] font-semibold text-slate-600">
                      <tr>
                        <th className="px-2 py-1.5">Field</th>
                        <th className="px-2 py-1.5">Value</th>
                        <th className="px-2 py-1.5 text-center">A_field Score</th>
                        <th className="px-2 py-1.5 text-center">OCR Conf</th>
                        <th className="px-2 py-1.5 text-center">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedRecord.fieldDetails.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-2 py-1.5 font-sans font-medium text-slate-800">{f.fieldName}</td>
                          <td className="px-2 py-1.5 font-bold text-slate-900">{f.value}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={f.traceScore >= 0.85 ? 'text-emerald-700 font-bold' : f.traceScore >= 0.70 ? 'text-amber-700 font-bold' : 'text-rose-700 font-bold'}>
                              {f.traceScore.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center text-slate-600">
                            {f.ocrConf.toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5 text-center font-sans">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              f.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : f.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {f.status === 'accepted' ? 'Accept' : f.status === 'warning' ? 'Warning' : 'Manual Review'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviewer Note */}
              <div className="bg-white p-4 rounded-md border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] block mb-1">
                  4. Reviewer Compliance Notes
                </span>
                <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                  "{selectedRecord.notes || 'No custom notes recorded.'}"
                </p>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Reviewer: <strong>{selectedRecord.reviewer}</strong></span>
                  <span>Recorded: {selectedRecord.processingTimestamp}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onOpenReceiptById(selectedRecord.receiptId);
                  setSelectedRecord(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5"
              >
                <span>Open in Review Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => exportAuditRecordAsJSON(selectedRecord)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Record (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
