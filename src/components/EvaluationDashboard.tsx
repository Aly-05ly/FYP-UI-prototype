import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  Target, 
  HelpCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Zap, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { EVALUATION_METRICS } from '../data/sampleReceipts';
import { EvaluationMetric } from '../types';

export const EvaluationDashboard: React.FC = () => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>('m-dsdnet-receipt-proposed');
  const [activeMetricGroup, setActiveMetricGroup] = useState<'all' | 'accuracy' | 'abstention' | 'image_quality'>('all');

  const selectedMetric = EVALUATION_METRICS.find((m) => m.id === selectedMethodId) || EVALUATION_METRICS[4];

  // Chart data formatting: only plot benchmarks with executed empirical runs
  const chartData = EVALUATION_METRICS.filter((m) => m.isExecuted).map((m) => ({
    name: m.methodName.split(' ')[0],
    fullName: m.methodName,
    fieldAccuracy: m.fieldAccuracy ?? 0,
    acceptedFieldAcc: m.acceptedFieldAcc ?? 0,
    unsupportedAcceptance: m.unsupportedAcceptanceRate ?? 0,
    abstentionRate: m.abstentionRate ?? 0,
    cer: m.cer ?? 0,
    psnr: m.psnr ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h1 className="font-bold text-lg text-slate-900">Research Baseline & Evaluation Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical benchmarking comparing raw OCR, classical filtering, unconstrained DSDNet, and planned thesis target framework.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded bg-slate-900 text-teal-300 font-mono text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>5 Baseline Benchmarks</span>
          </span>
        </div>
      </div>

      {/* Experimental Disclaimer Notice */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Academic Evaluation Notice:</span>
          <p className="text-[11px] text-amber-800 mt-0.5">
            All metrics displayed below represent experimental research evaluation across synthetic and test thermal receipt datasets (SROIE/CORD degradation benchmarks). Metrics are for comparative scientific evaluation and do not represent official government tax compliance ratings.
          </p>
        </div>
      </div>

      {/* 5 Baseline Method Selector Tabs */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-[700px]">
          {EVALUATION_METRICS.map((m) => {
            const isSelected = selectedMethodId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethodId(m.id)}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all text-left border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold truncate">{m.methodName}</span>
                  {m.isPlannedTarget ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-blue-400 text-blue-300 bg-blue-950">
                      Planned Target
                    </span>
                  ) : (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-teal-900 text-teal-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Executed
                    </span>
                  )}
                </div>
                <span className={`text-[10px] block truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {m.isExecuted ? `Field Acc: ${m.fieldAccuracy}% • CER: ${m.cer}%` : 'Phase 2 Evaluation Target'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Method Deep Breakdown Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">{selectedMetric.methodName}</h2>
              {selectedMetric.isPlannedTarget ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-300 text-blue-800 bg-blue-50">
                  Planned Target (Evaluation Pending)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Executed Benchmark
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedMetric.notes}</p>
          </div>
        </div>

        {selectedMetric.isPlannedTarget && (
          <div className="p-3 rounded-md bg-blue-50/80 border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Research Target Specification:</span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                This proposed architecture (Unrolled DSDNet + Authenticity Map + Abstention) is the designated thesis target. Numerical metrics will be populated during the formal empirical evaluation phase on the test dataset.
              </p>
            </div>
          </div>
        )}

        {/* 12 Metric KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* 1. Field Accuracy */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Field Accuracy</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.fieldAccuracy, '%')}
            </div>
            <span className="text-[10px] text-slate-500">Overall financial fields</span>
          </div>

          {/* 2. Accepted Field Accuracy */}
          <div className="bg-emerald-50/70 p-3 rounded-md border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Accepted-Field Acc</span>
            <div className="text-lg font-mono font-bold text-emerald-900 mt-0.5">
              {formatMetric(selectedMetric.acceptedFieldAcc, '%')}
            </div>
            <span className="text-[10px] text-emerald-700">On non-abstained fields</span>
          </div>

          {/* 3. Unsupported Acceptance Rate */}
          <div className="bg-rose-50/70 p-3 rounded-md border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">False Acceptance</span>
            <div className="text-lg font-mono font-bold text-rose-900 mt-0.5">
              {formatMetric(selectedMetric.unsupportedAcceptanceRate, '%')}
            </div>
            <span className="text-[10px] text-rose-700">Lower is better</span>
          </div>

          {/* 4. Abstention Rate */}
          <div className="bg-amber-50/70 p-3 rounded-md border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Abstention Rate</span>
            <div className="text-lg font-mono font-bold text-amber-900 mt-0.5">
              {formatMetric(selectedMetric.abstentionRate, '%')}
            </div>
            <span className="text-[10px] text-amber-700">Routed to manual review</span>
          </div>

          {/* 5. Trace-F1 */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Trace-F1 Score</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.traceF1)}
            </div>
            <span className="text-[10px] text-slate-500">Pixel trace fidelity</span>
          </div>

          {/* 6. ECE (Expected Calibration Error) */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">ECE (Calibration)</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.ece)}
            </div>
            <span className="text-[10px] text-slate-500">Lower = better calibrated</span>
          </div>

          {/* 7. CER */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">CER (Char Error)</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.cer, '%')}
            </div>
            <span className="text-[10px] text-slate-500">Tesseract raw CER</span>
          </div>

          {/* 8. WER */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">WER (Word Error)</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.wer, '%')}
            </div>
            <span className="text-[10px] text-slate-500">Word recognition error</span>
          </div>

          {/* 9. PSNR */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">PSNR (dB)</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.psnr, ' dB')}
            </div>
            <span className="text-[10px] text-slate-500">Peak signal-to-noise</span>
          </div>

          {/* 10. SSIM */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">SSIM</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.ssim)}
            </div>
            <span className="text-[10px] text-slate-500">Structural similarity</span>
          </div>

          {/* 11. Faithfulness AUC */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Faithfulness AUC</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.faithfulnessAuc)}
            </div>
            <span className="text-[10px] text-slate-500">Evidence retention AUC</span>
          </div>

          {/* 12. Processing Latency */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Proc Latency</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {formatMetric(selectedMetric.processingTimeMs, ' ms')}
            </div>
            <span className="text-[10px] text-slate-500">End-to-end inference</span>
          </div>
        </div>
      </div>

      {/* Comparative Charts Section (Executed Baselines) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart A: Field Accuracy & Safe Accepted Accuracy */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Executed Baselines: Field Accuracy & Accepted-Field Acc (%)
            </h3>
            <p className="text-[11px] text-slate-500">
              Comparison across executed experimental benchmarks (Methods 1-4).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="fieldAccuracy" name="Raw Field Acc (%)" fill="#64748b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="acceptedFieldAcc" name="Accepted-Field Acc (%)" fill="#0d9488" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: False Acceptance vs Character Error Rate (CER) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Executed Baselines: False Acceptance vs CER (%)
            </h3>
            <p className="text-[11px] text-slate-500">
              Lower is better. Demonstrates error rates prior to proposed abstention pipeline.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 40]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="unsupportedAcceptance" name="Unsupported Acceptance (%)" fill="#e11d48" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cer" name="Char Error Rate CER (%)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Cross-Benchmark Comparison Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
            Master Evaluation Comparison Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-200 text-[10px] uppercase font-semibold">
              <tr>
                <th className="px-3 py-2.5">Method</th>
                <th className="px-2 py-2.5 text-center">Status</th>
                <th className="px-2 py-2.5 text-center">PSNR (dB)</th>
                <th className="px-2 py-2.5 text-center">SSIM</th>
                <th className="px-2 py-2.5 text-center">CER (%)</th>
                <th className="px-2 py-2.5 text-center">Field Acc (%)</th>
                <th className="px-2 py-2.5 text-center">Trace-F1</th>
                <th className="px-2 py-2.5 text-center">ECE</th>
                <th className="px-2 py-2.5 text-center">Abstain (%)</th>
                <th className="px-2 py-2.5 text-center">Accepted Acc (%)</th>
                <th className="px-2 py-2.5 text-center">False Acc (%)</th>
                <th className="px-2 py-2.5 text-center">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {EVALUATION_METRICS.map((m) => {
                const isProposed = m.id === 'm-dsdnet-receipt-proposed';
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isProposed ? 'bg-blue-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-900">
                      {m.methodName}
                    </td>
                    <td className="px-2 py-2.5 text-center font-sans">
                      {m.isPlannedTarget ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded border border-blue-300 text-blue-700 bg-blue-50 font-bold">
                          Target
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          Executed
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.psnr)}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.ssim)}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.cer, '%')}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.fieldAccuracy, '%')}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.traceF1)}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.ece)}</td>
                    <td className="px-2 py-2.5 text-center">{formatMetric(m.abstentionRate, '%')}</td>
                    <td className="px-2 py-2.5 text-center text-teal-800 font-bold">
                      {formatMetric(m.acceptedFieldAcc, '%')}
                    </td>
                    <td className="px-2 py-2.5 text-center text-rose-700 font-bold">
                      {formatMetric(m.unsupportedAcceptanceRate, '%')}
                    </td>
                    <td className="px-2 py-2.5 text-center text-slate-600">
                      {formatMetric(m.processingTimeMs, 'ms')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function formatMetric(val: number | null | undefined, suffix = ''): string {
  if (val === null || val === undefined) {
    return '—';
  }
  return `${val}${suffix}`;
}
