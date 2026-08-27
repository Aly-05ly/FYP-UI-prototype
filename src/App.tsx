import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  buildPresetReceiptDocuments, 
  buildPresetAuditRecords, 
  INITIAL_SETTINGS 
} from './data/sampleReceipts';
import { 
  ReceiptDocument, 
  ReceiptField, 
  AuditRecord, 
  AppSettings, 
  DecisionStatus 
} from './types';
import { generateReceiptImages } from './utils/receiptCanvas';

import { Navbar } from './components/Navbar';
import { UploadArea } from './components/UploadArea';
import { EvidenceViewer } from './components/EvidenceViewer';
import { ExtractedFieldsPanel } from './components/ExtractedFieldsPanel';
import { FieldEvidenceModal } from './components/FieldEvidenceModal';
import { ProcessingStepperModal } from './components/ProcessingStepperModal';
import { ReceiptHistoryView } from './components/ReceiptHistoryView';
import { AuditLogView } from './components/AuditLogView';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('review');
  const [receipts, setReceipts] = useState<ReceiptDocument[]>(() => {
    const saved = localStorage.getItem('dsdnet_receipts_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved receipts:', e);
      }
    }
    return buildPresetReceiptDocuments();
  });

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem('dsdnet_audit_records_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved audit records:', e);
      }
    }
    return buildPresetAuditRecords(buildPresetReceiptDocuments());
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('dsdnet_settings_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
    return INITIAL_SETTINGS;
  });

  // Active receipt in workspace
  const [activeReceiptId, setActiveReceiptId] = useState<string>(() => {
    return receipts[0]?.id || '';
  });

  const activeReceipt = receipts.find((r) => r.id === activeReceiptId) || receipts[0];

  // Field selection & modal inspection state
  const [selectedField, setSelectedField] = useState<ReceiptField | null>(null);
  const [inspectingField, setInspectingField] = useState<ReceiptField | null>(null);

  // Viewer options
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(settings.defaultHeatmapOpacity);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(settings.showBoundingBoxes);
  const [syncZoom, setSyncZoom] = useState<boolean>(settings.enableSynchronizedZoom);

  // Processing stepper state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<number>(1);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('dsdnet_receipts_v2', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('dsdnet_audit_records_v2', JSON.stringify(auditRecords));
  }, [auditRecords]);

  useEffect(() => {
    localStorage.setItem('dsdnet_settings_v2', JSON.stringify(settings));
  }, [settings]);

  // Handle Field Status Updates (e.g. Accept, Warn, Manual Verification)
  const handleUpdateFieldStatus = (fieldId: string, newStatus: DecisionStatus, note?: string) => {
    if (!activeReceipt) return;

    const updatedFields = activeReceipt.fields.map((f) => {
      if (f.id === fieldId) {
        const isAbst = newStatus === 'manual_verification';
        return {
          ...f,
          decisionStatus: newStatus,
          isAbstained: isAbst,
          abstentionReason: isAbst
            ? 'This value requires manual verification because available evidence is insufficient.'
            : undefined,
          reviewerNote: note !== undefined ? note : f.reviewerNote,
          history: [
            ...(f.history || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              action: `Reviewer updated status to ${newStatus}`,
              previousValue: f.decisionStatus,
              newValue: newStatus,
              reviewer: settings.reviewerName,
            },
          ],
        };
      }
      return f;
    });

    updateReceiptFieldsAndDecisions(activeReceipt.id, updatedFields);
  };

  // Handle Field Value Manual Override
  const handleUpdateFieldValue = (fieldId: string, newValue: string, note?: string) => {
    if (!activeReceipt) return;

    const updatedFields = activeReceipt.fields.map((f) => {
      if (f.id === fieldId) {
        return {
          ...f,
          value: newValue,
          isModified: true,
          reviewerNote: note || f.reviewerNote,
          history: [
            ...(f.history || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              action: 'Reviewer manual override',
              previousValue: f.value,
              newValue: newValue,
              reviewer: settings.reviewerName,
            },
          ],
        };
      }
      return f;
    });

    updateReceiptFieldsAndDecisions(activeReceipt.id, updatedFields);
  };

  // Batch Accept all fields that have trace support >= 0.75
  const handleBatchAcceptSupported = () => {
    if (!activeReceipt) return;

    const updatedFields = activeReceipt.fields.map((f) => {
      if (f.traceSupportScore >= settings.traceSupportThreshold) {
        return {
          ...f,
          decisionStatus: 'accepted' as DecisionStatus,
          isAbstained: false,
          abstentionReason: undefined,
          history: [
            ...(f.history || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              action: 'Batch accepted by reviewer',
              reviewer: settings.reviewerName,
            },
          ],
        };
      }
      return f;
    });

    updateReceiptFieldsAndDecisions(activeReceipt.id, updatedFields);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
  };

  // Save overall receipt approval decision
  const handleSaveReceiptDecision = (decision: DecisionStatus, generalNote: string) => {
    if (!activeReceipt) return;

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updatedReceipts = receipts.map((r) => {
      if (r.id === activeReceipt.id) {
        return {
          ...r,
          overallDecision: decision,
          reviewerNotes: generalNote,
          reviewerName: settings.reviewerName,
        };
      }
      return r;
    });

    setReceipts(updatedReceipts);

    // Update or append audit record
    const updatedAuditRecords = auditRecords.map((aud) => {
      if (aud.receiptId === activeReceipt.id) {
        return {
          ...aud,
          decision: decision,
          notes: generalNote,
          reviewer: settings.reviewerName,
          processingTimestamp: timestamp,
        };
      }
      return aud;
    });

    setAuditRecords(updatedAuditRecords);
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.7 } });
  };

  const updateReceiptFieldsAndDecisions = (receiptId: string, updatedFields: ReceiptField[]) => {
    const hasManual = updatedFields.some((f) => f.decisionStatus === 'manual_verification');
    const hasWarning = updatedFields.some((f) => f.decisionStatus === 'warning');
    const overall: DecisionStatus = hasManual
      ? 'manual_verification'
      : hasWarning
      ? 'warning'
      : 'accepted';

    const highRiskCount = updatedFields.filter(
      (f) => f.riskCategory === 'high' && f.decisionStatus !== 'accepted'
    ).length;

    const updatedReceipts = receipts.map((r) => {
      if (r.id === receiptId) {
        return {
          ...r,
          fields: updatedFields,
          overallDecision: overall,
          highRiskReviewCount: highRiskCount,
        };
      }
      return r;
    });

    setReceipts(updatedReceipts);

    // Sync selected field reference
    if (selectedField) {
      const updatedSel = updatedFields.find((f) => f.id === selectedField.id);
      if (updatedSel) setSelectedField(updatedSel);
    }
  };

  // Pipeline simulation for custom user uploaded file
  const handleProcessCustomFile = (file: File) => {
    setIsProcessing(true);
    setProcessingStage(1);

    // Simulate 6 pipeline stages with realistic step timings
    const stageIntervals = [300, 500, 700, 600, 500, 400];
    let currentStep = 1;

    const advanceStep = () => {
      if (currentStep < 6) {
        currentStep += 1;
        setProcessingStage(currentStep);
        setTimeout(advanceStep, stageIntervals[currentStep - 1]);
      } else {
        // Complete execution and generate synthesized receipt document
        setTimeout(() => {
          completeCustomFileUpload(file);
          setIsProcessing(false);
          setActiveTab('review');
        }, 400);
      }
    };

    setTimeout(advanceStep, stageIntervals[0]);
  };

  const completeCustomFileUpload = (file: File) => {
    const newId = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const renderCfg = {
      merchantName: file.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/_/g, ' '),
      receiptNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: '26/08/2026',
      taxId: 'W10-2204-32000819',
      subtotal: '86.40',
      taxAmount: '5.18',
      totalAmount: '91.58',
      degradation: 'thermal_fading' as const,
      severity: 'moderate' as const,
      items: [
        { description: 'Alat Tulis & Kertas A4', qty: 2, unitPrice: '28.00', total: '56.00' },
        { description: 'Thermal Paper Roll 80mm', qty: 4, unitPrice: '7.60', total: '30.40' },
      ],
    };

    const images = generateReceiptImages(renderCfg);

    const newFields: ReceiptField[] = [
      {
        id: `f-${newId}-1`,
        key: 'merchant_name',
        name: 'Merchant Name',
        value: renderCfg.merchantName,
        originalExtractedValue: renderCfg.merchantName,
        boundingBox: { x: 10, y: 3.5, width: 80, height: 5.5 },
        ocrConfidence: 0.96,
        traceSupportScore: 0.92,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Registered Malaysian merchant pattern verified',
        riskCategory: 'medium',
        decisionStatus: 'accepted',
        isAbstained: false,
        evidenceRegionDescription: 'Clear thermal ink absorption footprint without fading.',
      },
      {
        id: `f-${newId}-2`,
        key: 'receipt_number',
        name: 'Receipt Number',
        value: renderCfg.receiptNumber,
        originalExtractedValue: renderCfg.receiptNumber,
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.91,
        traceSupportScore: 0.88,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Standard Malaysian tax invoice numbering [INV-XXXXXX]',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        isAbstained: false,
        evidenceRegionDescription: 'High stroke continuity in alphanumeric block.',
      },
      {
        id: `f-${newId}-3`,
        key: 'date',
        name: 'Transaction Date',
        value: renderCfg.date,
        originalExtractedValue: renderCfg.date,
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.94,
        traceSupportScore: 0.89,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Calendar date verified',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        isAbstained: false,
      },
      {
        id: `f-${newId}-4`,
        key: 'tax_identifier',
        name: 'Tax Identifier (SST / TIN)',
        value: renderCfg.taxId,
        originalExtractedValue: renderCfg.taxId,
        boundingBox: { x: 15, y: 13, width: 70, height: 4 },
        ocrConfidence: 0.93,
        traceSupportScore: 0.89,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid SST ID format',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        isAbstained: false,
      },
      {
        id: `f-${newId}-5`,
        key: 'tax_amount',
        name: 'Tax Amount (SST 6%)',
        value: `RM ${renderCfg.taxAmount}`,
        originalExtractedValue: `RM ${renderCfg.taxAmount}`,
        boundingBox: { x: 5, y: 60, width: 90, height: 4 },
        ocrConfidence: 0.74,
        traceSupportScore: 0.69,
        ruleCheckStatus: 'warning',
        ruleCheckMessage: 'Moderate thermal fading on decimal tail. 6% calculation = 5.184',
        riskCategory: 'high',
        decisionStatus: 'warning',
        isAbstained: false,
        evidenceRegionDescription: 'Amber zone in authenticity heatmap. Review recommended.',
      },
      {
        id: `f-${newId}-6`,
        key: 'total_amount',
        name: 'Total Amount',
        value: `RM ${renderCfg.totalAmount}`,
        originalExtractedValue: `RM ${renderCfg.totalAmount}`,
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.91,
        traceSupportScore: 0.86,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Subtotal (86.40) + Tax (5.18) = Total (91.58)',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        isAbstained: false,
      },
    ];

    const newDoc: ReceiptDocument = {
      id: newId,
      filename: file.name,
      fileSizeKb: Math.round(file.size / 1024),
      uploadTimestamp: timestamp,
      processedTimestamp: timestamp,
      status: 'ready',
      overallDecision: 'warning',
      degradationType: 'thermal_fading',
      degradationSeverity: 'moderate',
      processingMethod: settings.processingMethod,
      processingTimeMs: 485,
      merchantName: renderCfg.merchantName,
      receiptNumber: renderCfg.receiptNumber,
      date: renderCfg.date,
      taxIdentifier: renderCfg.taxId,
      taxAmount: `RM ${renderCfg.taxAmount}`,
      totalAmount: `RM ${renderCfg.totalAmount}`,
      items: renderCfg.items.map((it, i) => ({
        id: `it-${newId}-${i}`,
        description: it.description,
        quantity: it.qty,
        unitPrice: parseFloat(it.unitPrice),
        totalPrice: parseFloat(it.total),
        traceSupportScore: 0.88,
        ocrConfidence: 0.93,
        decisionStatus: 'accepted',
      })),
      fields: newFields,
      rawOcrText: `${renderCfg.merchantName}\nRCPT NO: ${renderCfg.receiptNumber}\nTOTAL: RM ${renderCfg.totalAmount}`,
      imageDimensions: { width: images.width, height: images.height },
      originalImageUrl: images.originalImageUrl,
      restoredImageUrl: images.restoredImageUrl,
      heatmapImageUrl: images.heatmapImageUrl,
      overlayImageUrl: images.overlayImageUrl,
      auditRecordId: `AUD-${newId}`,
      reviewerNotes: 'Processed via custom upload pipeline. Restored using dual-branch DSDNet.',
      reviewerName: settings.reviewerName,
      highRiskReviewCount: 1,
    };

    const newAudit: AuditRecord = {
      auditId: `AUD-${newId}`,
      receiptId: newId,
      filename: file.name,
      methodId: settings.processingMethod,
      processingTimestamp: timestamp,
      inputChecksum: `SHA256:4a8b92e${newId.slice(-4)}df890123...`,
      outputChecksum: `SHA256:9c1a55e${newId.slice(-4)}ab778401...`,
      decision: 'warning',
      reviewer: settings.reviewerName,
      thresholdConfig: {
        traceThreshold: settings.traceSupportThreshold,
        ocrThreshold: settings.ocrConfidenceThreshold,
        strictHighRisk: true,
      },
      fieldDecisionsSummary: {
        total: newFields.length,
        accepted: newFields.filter((f) => f.decisionStatus === 'accepted').length,
        warning: newFields.filter((f) => f.decisionStatus === 'warning').length,
        manualVerification: newFields.filter((f) => f.decisionStatus === 'manual_verification').length,
      },
      fieldDetails: newFields.map((f) => ({
        fieldName: f.name,
        value: f.value,
        traceScore: f.traceSupportScore,
        ocrConf: f.ocrConfidence,
        status: f.decisionStatus,
      })),
      notes: 'Custom uploaded receipt processed.',
      exportHistory: [],
    };

    setReceipts([newDoc, ...receipts]);
    setAuditRecords([newAudit, ...auditRecords]);
    setActiveReceiptId(newId);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] flex flex-col font-sans">
      {/* App Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={receipts.length}
        auditCount={auditRecords.length}
        hasActiveReceipt={!!activeReceipt}
        reviewerName={settings.reviewerName}
      />

      {/* Main Screen Content */}
      <main className="flex-1">
        {/* SCREEN 1: RECEIPT REVIEW WORKSPACE */}
        {activeTab === 'review' && activeReceipt && (
          <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
            {/* Top Upload / Document Switcher Bar */}
            <UploadArea
              onProcessCustomFile={handleProcessCustomFile}
              onSelectPresetReceipt={(id) => {
                setActiveReceiptId(id);
                setSelectedField(null);
              }}
              presetReceipts={receipts}
              isProcessing={isProcessing}
            />

            {/* Main Dual Workspace: 4-Panel Evidence Viewer + Extracted Fields Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left 7 Columns on Lg: 4-Panel Evidence Viewer */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[560px]">
                <EvidenceViewer
                  receipt={activeReceipt}
                  selectedField={selectedField}
                  onSelectField={(field) => setSelectedField(field)}
                  onInspectField={(field) => setInspectingField(field)}
                  heatmapOpacity={heatmapOpacity}
                  setHeatmapOpacity={setHeatmapOpacity}
                  showBoundingBoxes={showBoundingBoxes}
                  setShowBoundingBoxes={setShowBoundingBoxes}
                  syncZoom={syncZoom}
                  setSyncZoom={setSyncZoom}
                />
              </div>

              {/* Right 5 Columns on Lg: Structured Fields & Decision Panel */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[560px]">
                <ExtractedFieldsPanel
                  receipt={activeReceipt}
                  selectedField={selectedField}
                  onSelectField={(field) => setSelectedField(field)}
                  onInspectField={(field) => setInspectingField(field)}
                  onUpdateFieldStatus={handleUpdateFieldStatus}
                  onUpdateFieldValue={handleUpdateFieldValue}
                  onBatchAcceptSupported={handleBatchAcceptSupported}
                  onSaveReceiptDecision={handleSaveReceiptDecision}
                />
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: FIELD EVIDENCE INSPECTION MODAL */}
        {inspectingField && activeReceipt && (
          <FieldEvidenceModal
            receipt={activeReceipt}
            field={inspectingField}
            onClose={() => setInspectingField(null)}
            onSaveFieldDecision={(fieldId, status, val, note) => {
              handleUpdateFieldStatus(fieldId, status, note);
              if (val !== inspectingField.value) {
                handleUpdateFieldValue(fieldId, val, note);
              }
            }}
          />
        )}

        {/* SCREEN 3: RECEIPT HISTORY */}
        {activeTab === 'history' && (
          <ReceiptHistoryView
            receipts={receipts}
            onOpenReceipt={(r) => {
              setActiveReceiptId(r.id);
              setSelectedField(null);
              setActiveTab('review');
            }}
            onViewAudit={(auditId) => {
              setActiveTab('audit');
            }}
          />
        )}

        {/* SCREEN 4: AUDIT LOG */}
        {activeTab === 'audit' && (
          <AuditLogView
            auditRecords={auditRecords}
            onOpenReceiptById={(receiptId) => {
              setActiveReceiptId(receiptId);
              setActiveTab('review');
            }}
          />
        )}

        {/* SCREEN 5: EVALUATION DASHBOARD */}
        {activeTab === 'evaluation' && <EvaluationDashboard />}

        {/* SCREEN 6: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSet) => setSettings(newSet)}
            onResetDefaults={() => setSettings(INITIAL_SETTINGS)}
          />
        )}
      </main>

      {/* Processing Stepper Progress Modal */}
      {isProcessing && (
        <ProcessingStepperModal
          currentStage={processingStage}
          onComplete={() => setIsProcessing(false)}
        />
      )}

      {/* Global Bottom Status Bar */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] border-t border-slate-800 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>DSDNet-Receipt Framework v2.2</span>
          <span className="text-slate-600">•</span>
          <span>Method: {settings.processingMethod.split(' ')[0]}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Trace Cutoff T_trace: {(settings.traceSupportThreshold * 100).toFixed(0)}%</span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Local Storage: {settings.localStoragePath}
        </div>
      </footer>
    </div>
  );
}
