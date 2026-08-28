import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Search, 
  Edit3, 
  Check, 
  X, 
  Download, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  Sparkles,
  ExternalLink,
  Info,
  CornerDownRight,
  MessageSquarePlus,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ReceiptDocument, ReceiptField, DecisionStatus } from '../types';
import { exportReceiptAsJSON, exportReceiptAsCSV } from '../utils/exportUtils';

interface ExtractedFieldsPanelProps {
  receipt: ReceiptDocument;
  selectedField: ReceiptField | null;
  onSelectField: (field: ReceiptField) => void;
  onInspectField: (field: ReceiptField) => void;
  onUpdateFieldStatus: (fieldId: string, status: DecisionStatus, note?: string) => void;
  onUpdateFieldValue: (fieldId: string, newValue: string, note?: string) => void;
  onBatchAcceptSupported: () => void;
  onSaveReceiptDecision: (decision: DecisionStatus, generalNote: string) => void;
}

export const ExtractedFieldsPanel: React.FC<ExtractedFieldsPanelProps> = ({
  receipt,
  selectedField,
  onSelectField,
  onInspectField,
  onUpdateFieldStatus,
  onUpdateFieldValue,
  onBatchAcceptSupported,
  onSaveReceiptDecision,
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [generalNote, setGeneralNote] = useState<string>(receipt.reviewerNotes || '');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'items' | 'summary'>('fields');

  const handleStartEdit = (field: ReceiptField) => {
    setEditingFieldId(field.id);
    setEditValue(field.value);
    setEditNote(field.reviewerNote || '');
  };

  const handleSaveEdit = (fieldId: string) => {
    onUpdateFieldValue(fieldId, editValue, editNote);
    setEditingFieldId(null);
  };

  const handleCancelEdit = () => {
    setEditingFieldId(null);
  };

  const acceptedCount = receipt.fields.filter((f) => f.decisionStatus === 'accepted').length;
  const warningCount = receipt.fields.filter((f) => f.decisionStatus === 'warning').length;
  const manualCount = receipt.fields.filter((f) => f.decisionStatus === 'manual_verification').length;
  const highRiskIssues = receipt.fields.filter(
    (f) => f.riskCategory === 'high' && f.decisionStatus !== 'accepted'
  ).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-900 text-slate-100 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-100">Extracted Structured Fields</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              Eq.(8) Composite Scoring
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Evaluating A_field(f) = Q_q(B_f) × C_OCR(f) × P_rule(f) against thesis thresholds
          </p>
        </div>

        {/* Export dropdown */}
        <div className="relative">
          <button
            id="btn-export-dropdown"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30 text-xs">
              <button
                onClick={() => {
                  exportReceiptAsJSON(receipt);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Export Verification JSON</span>
              </button>
              <button
                onClick={() => {
                  exportReceiptAsCSV(receipt);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Field Audit CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Metric Quick Tally & Tabs */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            {acceptedCount} Accepted (≥0.85)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {warningCount} Warning (0.70-0.84)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-medium">
            <AlertOctagon className="w-3 h-3 text-red-600" />
            {manualCount} Abstained (&lt;0.70)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-2.5 py-0.5 rounded font-medium ${
              activeTab === 'fields' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Key Fields ({receipt.fields.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-2.5 py-0.5 rounded font-medium ${
              activeTab === 'items' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Line Items ({receipt.items.length})
          </button>
        </div>
      </div>

      {/* High-risk Alert Banner if manual verification needed */}
      {highRiskIssues > 0 && (
        <div className="bg-red-50/90 border-b border-red-200 px-4 py-2 flex items-start gap-2 text-xs text-red-900">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{highRiskIssues} High-Risk Financial Field(s) Require Review.</span>
            <p className="text-[11px] text-red-800 mt-0.5">
              Available pixel authenticity support is insufficient for automated confirmation. Review source evidence before confirming decision.
            </p>
          </div>
        </div>
      )}

      {/* Main Field List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
        {activeTab === 'fields' && (
          <>
            {receipt.fields.map((field) => {
              const isSelected = selectedField?.id === field.id;
              const isEditing = editingFieldId === field.id;
              const isHighRisk = field.riskCategory === 'high';

              return (
                <div
                  key={field.id}
                  id={`field-row-${field.key}`}
                  onClick={() => onSelectField(field)}
                  className={`rounded-md border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400'
                      : field.decisionStatus === 'manual_verification'
                      ? 'border-red-200 bg-red-50/20 hover:bg-red-50/40'
                      : field.decisionStatus === 'warning'
                      ? 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  {/* Row Top: Name, Risk Badge, Decision Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 text-xs">{field.name}</span>
                      {isHighRisk && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-tight">
                          High Risk
                        </span>
                      )}
                      {field.isModified && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Edited by Reviewer
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1">
                      {field.decisionStatus === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Accepted
                        </span>
                      ) : field.decisionStatus === 'warning' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 animate-pulse">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          Manual Verification
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row Middle: Value or Edit Input */}
                  <div className="mt-2">
                    {isEditing ? (
                      <div className="space-y-1.5 bg-slate-50 p-2 rounded border border-slate-300" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] text-slate-600 font-semibold">Corrected Value:</label>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Add reason / voucher reference note..."
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-0.5 text-[11px] rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(field.id)}
                            className="px-2.5 py-0.5 text-[11px] font-medium rounded bg-teal-600 text-white hover:bg-teal-500 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm bg-slate-100/80 px-2 py-1 rounded border border-slate-200 select-all">
                          {field.value}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(field);
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 flex items-center gap-1"
                          title="Edit extracted value"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Abstention Notice if Evidence is Insufficient */}
                  {field.decisionStatus === 'manual_verification' && (
                    <div className="mt-2 p-2 rounded bg-red-100/70 border border-red-200 text-[11px] text-red-900 flex items-start gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Abstained by System (§4.3.2)</span>
                        <span>This value requires manual verification because available evidence is insufficient.</span>
                      </div>
                    </div>
                  )}

                  {/* Row Bottom: Equation (8) Composite Score Breakdown */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5 text-[10px]">
                    {/* Composite Score A_field */}
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[8px] text-slate-500 uppercase block font-bold">A_field(f)</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          field.afieldScore >= 0.85
                            ? 'text-emerald-700'
                            : field.afieldScore >= 0.70
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {(field.afieldScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Pixel Authenticity Q_q */}
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[8px] text-slate-500 uppercase block font-semibold">Q_q(Auth)</span>
                      <span className="font-mono font-medium text-slate-800">
                        {(field.pixelQuantileAuth * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* OCR Conf C_OCR */}
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[8px] text-slate-500 uppercase block font-semibold">C_OCR</span>
                      <span className="font-mono font-medium text-slate-800">
                        {(field.ocrConfidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Rule Check P_rule */}
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[8px] text-slate-500 uppercase block font-semibold">P_rule</span>
                      <span
                        className={`font-mono font-semibold block truncate ${
                          field.ruleCheckStatus === 'passed'
                            ? 'text-emerald-700'
                            : field.ruleCheckStatus === 'warning'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                        title={field.ruleCheckMessage}
                      >
                        {field.ruleCheckStatus === 'passed' ? '1.0' : field.ruleCheckStatus === 'warning' ? '0.85' : '0.0'}
                      </span>
                    </div>
                  </div>

                  {/* Actions strip */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectField(field);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      <Search className="w-3 h-3" />
                      <span>Inspect evidence</span>
                    </button>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {field.decisionStatus !== 'accepted' && (
                        <button
                          onClick={() => onUpdateFieldStatus(field.id, 'accepted')}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
                        >
                          Accept
                        </button>
                      )}
                      {field.decisionStatus !== 'warning' && (
                        <button
                          onClick={() => onUpdateFieldStatus(field.id, 'warning')}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                        >
                          Warn
                        </button>
                      )}
                      {field.decisionStatus !== 'manual_verification' && (
                        <button
                          onClick={() => onUpdateFieldStatus(field.id, 'manual_verification')}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-100 hover:bg-red-200 text-red-800 border border-red-300"
                        >
                          Abstain / Flag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* LINE ITEMS TAB */}
        {activeTab === 'items' && (
          <div className="space-y-2">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Line Items Breakdown:</span>
              <p className="text-[11px] text-slate-500">
                Item lines cross-verified with subtotal sum arithmetic validation.
              </p>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10px] font-semibold text-slate-600">
                  <tr>
                    <th className="px-2.5 py-1.5 text-left">Qty & Description</th>
                    <th className="px-2 py-1.5 text-right">Price</th>
                    <th className="px-2 py-1.5 text-right">Total</th>
                    <th className="px-2 py-1.5 text-center">A_field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="px-2.5 py-1.5 font-mono">
                        <span className="font-bold text-slate-800">{it.quantity}x </span>
                        <span>{it.description}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-600">
                        {it.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-slate-900">
                        {it.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            it.afieldScore >= 0.85
                              ? 'bg-emerald-100 text-emerald-800'
                              : it.afieldScore >= 0.70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(it.afieldScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reviewer Action Bar & Persist Section */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
        {/* Quick Batch Accept */}
        <div className="flex items-center justify-between gap-2">
          <button
            id="btn-batch-accept"
            onClick={onBatchAcceptSupported}
            className="flex-1 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Accept Evidence-Supported Fields (A_field ≥ 0.85)</span>
          </button>
        </div>

        {/* General Reviewer Notes */}
        <div>
          <label className="text-[10px] font-semibold text-slate-600 uppercase flex items-center gap-1">
            <MessageSquarePlus className="w-3 h-3" />
            Reviewer Audit Decision Note:
          </label>
          <textarea
            rows={2}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            placeholder="Record justification, physical voucher correlation, or tax review notes..."
            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none mt-1"
          />
        </div>

        {/* Save Review Decision */}
        <div className="flex items-center gap-2">
          <button
            id="btn-confirm-review-decision"
            onClick={() => onSaveReceiptDecision('accepted', generalNote)}
            className="flex-1 py-1.5 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-1 shadow-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirm Review Decision</span>
          </button>
          <button
            id="btn-abstain-review-decision"
            onClick={() => onSaveReceiptDecision('manual_verification', generalNote)}
            className="py-1.5 px-3 text-xs font-semibold rounded bg-red-700 hover:bg-red-600 text-white flex items-center justify-center gap-1 shadow-xs"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Abstain / Flag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
