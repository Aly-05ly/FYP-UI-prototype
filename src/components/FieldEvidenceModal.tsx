import React, { useState } from 'react';
import { 
  X, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldCheck, 
  FileCheck, 
  Sparkles, 
  History, 
  HelpCircle,
  Eye,
  Check,
  Edit2,
  Calculator
} from 'lucide-react';
import { ReceiptDocument, ReceiptField, DecisionStatus } from '../types';

interface FieldEvidenceModalProps {
  receipt: ReceiptDocument;
  field: ReceiptField;
  onClose: () => void;
  onSaveFieldDecision: (fieldId: string, status: DecisionStatus, value: string, note: string) => void;
}

export const FieldEvidenceModal: React.FC<FieldEvidenceModalProps> = ({
  receipt,
  field,
  onClose,
  onSaveFieldDecision,
}) => {
  const [currentValue, setCurrentValue] = useState<string>(field.value);
  const [currentStatus, setCurrentStatus] = useState<DecisionStatus>(field.decisionStatus);
  const [reviewerNote, setReviewerNote] = useState<string>(field.reviewerNote || '');
  const [isEditingValue, setIsEditingValue] = useState<boolean>(false);

  const handleSave = () => {
    onSaveFieldDecision(field.id, currentStatus, currentValue, reviewerNote);
    onClose();
  };

  // Crop percentage coordinates
  const { x, y, width, height } = field.boundingBox;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-blue-600/30 border border-blue-500/40 text-blue-300">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  Field Evidence Inspection: <span className="text-teal-400">{field.name}</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  field.riskCategory === 'high' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {field.riskCategory} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Receipt #{receipt.receiptNumber} • {receipt.merchantName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* 1. 3-WAY COMPARATIVE CROP INSPECTION VIEWER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                Pixel Region Forensic Comparison (Bounding Box B_f Crop)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Box B_f: [x:{x.toFixed(1)}%, y:{y.toFixed(1)}%, w:{width.toFixed(1)}%, h:{height.toFixed(1)}%]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Panel A: Original Crop */}
              <div className="bg-white rounded-md border border-slate-300 p-3 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">1. Original Input Substrate</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    Degraded
                  </span>
                </div>
                <div className="flex-1 bg-slate-100 rounded border border-slate-200 p-2 flex items-center justify-center min-h-[140px] overflow-hidden relative">
                  <div className="relative overflow-hidden w-full h-[120px] rounded bg-white flex items-center justify-center">
                    <img
                      src={receipt.originalImageUrl}
                      alt="Original crop"
                      style={{
                        position: 'absolute',
                        width: '320px',
                        maxWidth: 'none',
                        left: `-${(x / 100) * 320 - 20}px`,
                        top: `-${(y / 100) * 480 - 20}px`,
                      }}
                      className="filter contrast-125"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">
                  Thermal fading, substrate grain, and ink baseline.
                </p>
              </div>

              {/* Panel B: Restored Crop */}
              <div className="bg-white rounded-md border border-slate-300 p-3 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">2. Unrolled DSDNet Restored</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                    Reconstructed
                  </span>
                </div>
                <div className="flex-1 bg-slate-100 rounded border border-slate-200 p-2 flex items-center justify-center min-h-[140px] overflow-hidden relative">
                  <div className="relative overflow-hidden w-full h-[120px] rounded bg-white flex items-center justify-center">
                    <img
                      src={receipt.restoredImageUrl}
                      alt="Restored crop"
                      style={{
                        position: 'absolute',
                        width: '320px',
                        maxWidth: 'none',
                        left: `-${(x / 100) * 320 - 20}px`,
                        top: `-${(y / 100) * 480 - 20}px`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Reconstructed strokes via unrolled DSDNet iterations.
                </p>
              </div>

              {/* Panel C: Heatmap Crop */}
              <div className="bg-white rounded-md border border-slate-300 p-3 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">3. Pixel Authenticity Map</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                    M_auth(x,y)
                  </span>
                </div>
                <div className="flex-1 bg-slate-100 rounded border border-slate-200 p-2 flex items-center justify-center min-h-[140px] overflow-hidden relative">
                  <div className="relative overflow-hidden w-full h-[120px] rounded bg-white flex items-center justify-center">
                    <img
                      src={receipt.heatmapImageUrl}
                      alt="Heatmap crop"
                      style={{
                        position: 'absolute',
                        width: '320px',
                        maxWidth: 'none',
                        left: `-${(x / 100) * 320 - 20}px`,
                        top: `-${(y / 100) * 480 - 20}px`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  Q_0.10(B_f): <span className="font-bold text-slate-800">{(field.pixelQuantileAuth * 100).toFixed(1)}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. EQUATION (8) COMPOSITE FORMULA BREAKDOWN */}
          <div className="bg-white rounded-md border border-slate-300 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-teal-600" />
                Equation (8) Composite Field Authenticity Score Formulation
              </span>
              <span className="text-xs font-mono bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200 font-bold">
                A_field(f) = {(field.afieldScore * 100).toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-md font-mono text-xs mb-3 overflow-x-auto">
              <div className="text-teal-300 mb-1">
                A_field(f) = Q_q(pixel authenticity in B_f) × C_OCR(f) × P_rule(f)
              </div>
              <div className="text-slate-300 text-[11px]">
                A_field(f) = {(field.pixelQuantileAuth).toFixed(3)} × {(field.ocrConfidence).toFixed(3)} × {(field.ruleCheckMultiplier ?? (field.ruleCheckStatus === 'passed' ? 1.0 : field.ruleCheckStatus === 'warning' ? 0.85 : 0.0)).toFixed(2)} = <strong className="text-teal-400">{(field.afieldScore).toFixed(4)}</strong> ({ (field.afieldScore * 100).toFixed(1) }%)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Quantile pixel support */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Q_0.10 Authenticity</span>
                <span className="text-base font-mono font-bold text-slate-800 mt-0.5 block">
                  {(field.pixelQuantileAuth * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">10th percentile pixel evidence in B_f</span>
              </div>

              {/* OCR Confidence */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">2. C_OCR Confidence</span>
                <span className="text-base font-mono font-bold text-slate-800 mt-0.5 block">
                  {(field.ocrConfidence * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">Glyph classification probability</span>
              </div>

              {/* Rule Multiplier */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">3. P_rule Validation</span>
                <span className={`text-base font-mono font-bold mt-0.5 block ${
                  field.ruleCheckStatus === 'passed' ? 'text-emerald-700' : field.ruleCheckStatus === 'warning' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {field.ruleCheckStatus === 'passed' ? '1.0 (Passed)' : field.ruleCheckStatus === 'warning' ? '0.85 (Warn)' : '0.0 (Failed)'}
                </span>
                <span className="text-[10px] text-slate-500">{field.ruleCheckMessage}</span>
              </div>
            </div>
          </div>

          {/* 3. FIELD VALUE & OVERRIDE */}
          <div className="bg-white rounded-md border border-slate-300 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Extracted Field Value & Manual Override
              </span>
              <button
                onClick={() => setIsEditingValue(!isEditingValue)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingValue ? 'Done Editing' : 'Manual Override'}</span>
              </button>
            </div>

            {isEditingValue ? (
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full text-sm font-mono font-bold px-2 py-1.5 bg-white border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            ) : (
              <div className="font-mono font-bold text-slate-900 text-base bg-slate-50 p-2 rounded border border-slate-200 select-all">
                {currentValue}
              </div>
            )}
            {field.originalExtractedValue !== currentValue && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                Original extraction: <code className="font-mono">{field.originalExtractedValue}</code>
              </span>
            )}
          </div>

          {/* 4. REVIEWER DECISION & AUDIT ACTION */}
          <div className="bg-white rounded-md border border-slate-300 p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-3">
              Record Reviewer Decision for this Field (§4.3.2 Thresholds)
            </span>

            {/* Status Option Radios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                  currentStatus === 'accepted'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="field-status"
                  value="accepted"
                  checked={currentStatus === 'accepted'}
                  onChange={() => setCurrentStatus('accepted')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-xs text-emerald-900 block flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Accept Field (A_field ≥ 0.85)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Evidence and OCR result meet confidence threshold.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                  currentStatus === 'warning'
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="field-status"
                  value="warning"
                  checked={currentStatus === 'warning'}
                  onChange={() => setCurrentStatus('warning')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-xs text-amber-900 block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Warning (0.70 ≤ A_field &lt; 0.85)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Partial uncertainty or soft rule check warning present.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                  currentStatus === 'manual_verification'
                    ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="field-status"
                  value="manual_verification"
                  checked={currentStatus === 'manual_verification'}
                  onChange={() => setCurrentStatus('manual_verification')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-xs text-red-900 block flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                    Manual Verification / Abstain (&lt; 0.70)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Evidence is insufficient or rule failed. Automated acceptance blocked.
                  </span>
                </div>
              </label>
            </div>

            {/* Note input */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Field Audit Note:
              </label>
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="E.g., Confirmed with physical paper copy voucher #401; trace support verified on subtotal..."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Decisions are recorded in the research audit trail before persisting.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Save Decision</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
