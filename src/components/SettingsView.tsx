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
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Calculator
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

  const isEvaluationMode = settings.evaluationMode ?? true;

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
              Configure Unrolled DSDNet restoration pipelines, abstention thresholds, local storage, and audit parameters.
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

      {/* EVALUATION MODE TOGGLE BANNER */}
      <div className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${
        isEvaluationMode 
          ? 'bg-teal-50/80 border-teal-300 text-teal-950' 
          : 'bg-amber-50/80 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-start gap-3">
          <Lock className={`w-5 h-5 shrink-0 mt-0.5 ${isEvaluationMode ? 'text-teal-700' : 'text-amber-700'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {isEvaluationMode ? 'Evaluation Mode Active (Thesis Locked Thresholds)' : 'Custom Experimentation Mode'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                isEvaluationMode ? 'bg-teal-200 text-teal-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {isEvaluationMode ? 'Read-Only Locks' : 'Customizable'}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-600 leading-relaxed">
              {isEvaluationMode
                ? 'Thresholds are locked to Chapter 4 (§4.3.2) evaluation benchmark settings (τ_accept = 0.85, τ_warn = 0.70). Toggle off to test custom sensitivity parameters.'
                : 'Custom parameter adjustments enabled. Note: results generated in this mode deviate from the standard thesis benchmark settings.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleChange('evaluationMode', !isEvaluationMode)}
          className={`shrink-0 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs ${
            isEvaluationMode
              ? 'bg-teal-700 hover:bg-teal-800 text-white'
              : 'bg-amber-700 hover:bg-amber-800 text-white'
          }`}
        >
          {isEvaluationMode ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock Custom Mode</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Lock to Evaluation Mode</span>
            </>
          )}
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
              disabled={isEvaluationMode}
              value={settings.processingMethod}
              onChange={(e) => handleChange('processingMethod', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:opacity-75 disabled:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="DSDNet-v2.2-DualBranch (Conservative)">
                Unrolled DSDNet (Conservative Restoration - Recommended)
              </option>
              <option value="DSDNet-v2.1-Standard">DSDNet-v2.1-Standard (Dual Branch)</option>
              <option value="DSDNet-NoAuthenticity-Branch">DSDNet-NoAuthenticity-Branch (Restoration Only)</option>
              <option value="Baseline-CLAHE-Bilateral">Baseline-CLAHE-Bilateral (Classical)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Generates pixel-wise authenticity support maps alongside restored documents.
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Operational Mode:</label>
            <select
              disabled={isEvaluationMode}
              value={settings.baselineMode}
              onChange={(e) => handleChange('baselineMode', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:opacity-75 disabled:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
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
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            2. Abstention Thresholds (§4.3.2 Equation 8)
          </h2>
          {isEvaluationMode && (
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3 text-teal-600" /> Locked to Thesis Benchmarks
            </span>
          )}
        </div>

        <div className="space-y-4 text-xs">
          {/* Acceptance Threshold tau_accept */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Acceptance Threshold (τ_accept):</span>
                <p className="text-[11px] text-slate-500">
                  Minimum composite score A_field(f) for automated acceptance.
                </p>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-300 text-teal-700">
                {(settings.tauAccept * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              disabled={isEvaluationMode}
              min="0.75"
              max="0.95"
              step="0.01"
              value={settings.tauAccept}
              onChange={(e) => handleChange('tauAccept', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>75%</span>
              <span className="font-bold text-teal-800">85% (Thesis Standard)</span>
              <span>95%</span>
            </div>
          </div>

          {/* Warning Threshold tau_warn */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Warning Threshold (τ_warn):</span>
                <p className="text-[11px] text-slate-500">
                  Cutoff below which fields are marked for mandatory manual review / abstention.
                </p>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-300 text-amber-700">
                {(settings.tauWarn * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              disabled={isEvaluationMode}
              min="0.50"
              max="0.80"
              step="0.01"
              value={settings.tauWarn}
              onChange={(e) => handleChange('tauWarn', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50%</span>
              <span className="font-bold text-amber-800">70% (Thesis Standard)</span>
              <span>80%</span>
            </div>
          </div>

          {/* OCR Confidence Threshold */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">OCR Confidence Cutoff (C_OCR):</span>
                <p className="text-[11px] text-slate-500">
                  Fixed OCR glyph classification probability baseline.
                </p>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-300 text-blue-700">
                {(settings.ocrConfidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              disabled={isEvaluationMode}
              min="0.60"
              max="0.95"
              step="0.05"
              value={settings.ocrConfidenceThreshold}
              onChange={(e) => handleChange('ocrConfidenceThreshold', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Route fields to "Manual Verification" whenever A_field(f) is below τ_warn (0.70).
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
                  disabled={isEvaluationMode}
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={settings.strictHighRiskMultiplier}
                  onChange={(e) => handleChange('strictHighRiskMultiplier', parseFloat(e.target.value) || 1.15)}
                  className="w-20 p-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-500">
                  Applies +15% stricter criteria to Total, Tax Amount, and SST ID.
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
