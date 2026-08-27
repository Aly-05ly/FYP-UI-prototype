import React from 'react';
import { 
  Settings, 
  Sliders, 
  ShieldCheck, 
  HardDrive, 
  FileText, 
  Lock, 
  Check, 
  RotateCcw, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-slate-900 text-teal-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900">System & Verification Settings</h1>
            <p className="text-xs text-slate-500">
              Configure DSDNet restoration pipelines, trace evidence thresholds, local storage, and audit parameters.
            </p>
          </div>
        </div>

        <button
          onClick={onResetDefaults}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. PIPELINE & BASELINE SELECTION */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-600" />
          1. Inference Pipeline & Model Mode
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Active Restoration Method:</label>
            <select
              value={settings.processingMethod}
              onChange={(e) => handleChange('processingMethod', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              <option value="DSDNet-v2.2-DualBranch (Conservative)">
                DSDNet-v2.2-DualBranch (Conservative - Recommended)
              </option>
              <option value="DSDNet-v2.1-Standard">DSDNet-v2.1-Standard (Dual Branch)</option>
              <option value="DSDNet-NoAuthenticity-Branch">DSDNet-NoAuthenticity-Branch (Restoration Only)</option>
              <option value="Baseline-CLAHE-Bilateral">Baseline-CLAHE-Bilateral (Classical)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Generates pixel-wise trace support heatmaps alongside restored documents.
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Baseline Operational Mode:</label>
            <select
              value={settings.baselineMode}
              onChange={(e) => handleChange('baselineMode', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Proposed (Restoration + Authenticity + Abstention)">
                Proposed (Restoration + Authenticity + Abstention)
              </option>
              <option value="Direct Extraction (No Restoration)">Direct Extraction (No Restoration)</option>
              <option value="Restoration Without Abstention">Restoration Without Abstention</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Routes low-support fields to human manual review when evidence is below threshold.
            </span>
          </div>
        </div>
      </div>

      {/* 2. CONFIDENCE & EVIDENCE THRESHOLDS */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          2. Trace Support & OCR Acceptance Thresholds
        </h2>

        <div className="space-y-4 text-xs">
          {/* Trace Support Threshold */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Minimum Trace Support Threshold (T_trace):</span>
                <p className="text-[11px] text-slate-500">
                  Substrate ink stroke density required for automated acceptance.
                </p>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-300 text-teal-700">
                {(settings.traceSupportThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={settings.traceSupportThreshold}
              onChange={(e) => handleChange('traceSupportThreshold', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50% (Permissive)</span>
              <span>75% (Default Recommended)</span>
              <span>95% (Strict Forensic)</span>
            </div>
          </div>

          {/* OCR Confidence Threshold */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Minimum OCR Confidence Threshold (T_ocr):</span>
                <p className="text-[11px] text-slate-500">
                  Fixed OCR glyph classification probability cutoff.
                </p>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-300 text-blue-700">
                {(settings.ocrConfidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.95"
              step="0.05"
              value={settings.ocrConfidenceThreshold}
              onChange={(e) => handleChange('ocrConfidenceThreshold', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* High Risk Multipliers & Abstention Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-md border border-slate-200 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAbstainLowSupport}
                onChange={(e) => handleChange('autoAbstainLowSupport', e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Automatic Abstention Routing</span>
                <span className="text-[11px] text-slate-500">
                  Mark fields as "Manual Verification" whenever trace support is below T_trace.
                </span>
              </div>
            </label>

            <div className="p-3 rounded-md border border-slate-200 bg-white">
              <span className="font-semibold text-slate-800 block mb-0.5">
                High-Risk Strictness Multiplier:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={settings.strictHighRiskMultiplier}
                  onChange={(e) => handleChange('strictHighRiskMultiplier', parseFloat(e.target.value) || 1.15)}
                  className="w-20 p-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
                />
                <span className="text-[11px] text-slate-500">
                  Applies +15% stricter threshold to Total, Tax Amount, and SST ID.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DATA PERSISTENCE & LOCAL PRIVACY */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-teal-600" />
          3. Local Data Storage & Retention Boundary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Local Storage Database Path:</label>
            <input
              type="text"
              value={settings.localStoragePath}
              onChange={(e) => handleChange('localStoragePath', e.target.value)}
              className="w-full p-2 font-mono text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Document images and audit records are stored locally on device.
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Audit Record Retention (Days):</label>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value) || 90)}
              className="w-full p-2 font-mono text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Default statutory review retention buffer.
            </span>
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Default Reviewer Identity:</label>
            <input
              type="text"
              value={settings.reviewerName}
              onChange={(e) => handleChange('reviewerName', e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Privacy & Compliance Notice */}
        <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 block">Data Privacy & Research Integrity Boundary:</span>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Receipt images and extracted fields are processed and stored locally by default. Demonstration data is synthetic or redacted. The prototype provides evidence-based decision support and does not certify legal compliance, guarantee MyInvois acceptance, or replace human or official verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
