import React from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Zap,
  Layers,
  Filter,
  FileCheck
} from 'lucide-react';

interface ProcessingStepperModalProps {
  currentStage: number; // 1 to 5
  onComplete: () => void;
}

export const ProcessingStepperModal: React.FC<ProcessingStepperModalProps> = ({
  currentStage,
  onComplete,
}) => {
  const steps = [
    {
      id: 1,
      name: 'Filter 1: Conservative Preprocessing',
      desc: 'Bilateral contrast leveling, deskewing & gradient edge preservation without stroke hallucination',
      time: '34ms',
    },
    {
      id: 2,
      name: 'Filter 2: Unrolled DSDNet Restoration',
      desc: 'Deep iterative dual-branch stroke reconstruction & substrate noise separation',
      time: '185ms',
    },
    {
      id: 3,
      name: 'Filter 3: Pixel Authenticity Map Generation',
      desc: 'Computing pixel-level authenticity field M_auth(x,y) from substrate gradient residuals',
      time: '64ms',
    },
    {
      id: 4,
      name: 'Filter 4: Evidence-Bounded OCR Extraction',
      desc: 'Fixed OCR glyph recognition & bounding box B_f coordinate alignment',
      time: '78ms',
    },
    {
      id: 5,
      name: 'Filter 5: Deterministic Rules & Equation (8) Scoring',
      desc: 'Evaluating A_field(f) = Q_q(B_f) × C_OCR(f) × P_rule(f) against τ_accept=0.85, τ_warn=0.70',
      time: '26ms',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-teal-600/30 border border-teal-500/40 text-teal-300">
              <Filter className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                5-Filter Evidence-Bounded Pipeline (Figure 4.1)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Unrolled DSDNet Restoration & Authenticity Scoring
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-teal-400 font-bold bg-slate-800 px-2 py-1 rounded">
            Stage {Math.min(currentStage, 5)} of 5
          </span>
        </div>

        {/* Stepper Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-3">
            {steps.map((step) => {
              const isDone = currentStage > step.id;
              const isCurrent = currentStage === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-2.5 rounded-md border transition-all ${
                    isCurrent
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                      : isDone
                      ? 'border-slate-200 bg-slate-50/60'
                      : 'border-transparent text-slate-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-mono">
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-teal-950'
                            : isDone
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.name}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-mono text-slate-400">{step.time}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              style={{ width: `${(Math.min(currentStage, 5) / 5) * 100}%` }}
              className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Verifying stroke continuity & evaluating Equation (8) abstention thresholds...
        </div>
      </div>
    </div>
  );
};
