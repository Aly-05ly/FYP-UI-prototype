import React, { useState, useEffect } from 'react';
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
import { computeCompositeFieldScore, computeFieldDecision } from './utils/fieldScoring';

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
        // Enforce rule failure logic: if rule is failed, forced to manual_verification
        const isRuleFailed = f.ruleCheckStatus === 'failed';
        const finalStatus = isRuleFailed ? 'manual_verification' : newStatus;
        const isAbst = finalStatus === 'manual_verification';
        return {
          ...f,
          decisionStatus: finalStatus,
          isAbstained: isAbst,
          abstentionReason: isAbst
            ? (isRuleFailed ? 'Validation rule check failed. Value requires manual verification.' : 'This value requires manual verification because available evidence is insufficient.')
            : undefined,
          reviewerNote: note !== undefined ? note : f.reviewerNote,
          history: [
            ...(f.history || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              action: `Reviewer updated status to ${finalStatus}`,
              previousValue: f.decisionStatus,
              newValue: finalStatus,
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

  // Batch Accept all fields that meet tau_accept (>= 0.85) and passed rules
  const handleBatchAcceptSupported = () => {
    if (!activeReceipt) return;

    const updatedFields = activeReceipt.fields.map((f) => {
      if (f.afieldScore >= 0.85 && f.ruleCheckStatus !== 'failed') {
        return {
          ...f,
          decisionStatus: 'accepted' as DecisionStatus,
          isAbstained: false,
          abstentionReason: undefined,
          history: [
            ...(f.history || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              action: 'Batch accepted by reviewer (A_field >= 0.85)',
              reviewer: settings.reviewerName,
            },
          ],
        };
      }
      return f;
    });

    updateReceiptFieldsAndDecisions(activeReceipt.id, updatedFields);
  };

  // Save overall receipt review decision
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
          decisionTimestamp: timestamp
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

    // Simulate 5-filter pipeline stages
    const stageIntervals = [300, 600, 600, 500, 400];
    let currentStep = 1;

    const advanceStep = () => {
      if (currentStep < 5) {
        currentStep += 1;
        setProcessingStage(currentStep);
        setTimeout(advanceStep, stageIntervals[currentStep - 1]);
      } else {
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

    const rawFieldsData = [
      {
        id: `f-${newId}-1`,
        key: 'merchant_name',
        name: 'Merchant Name',
        value: renderCfg.merchantName,
        boundingBox: { x: 10, y: 3.5, width: 80, height: 5.5 },
        pixelQuantileAuth: 0.94,
        ocrConfidence: 0.96,
        ruleCheckStatus: 'passed' as const,
        ruleCheckMessage: 'Registered Malaysian merchant pattern verified',
        ruleCheckMultiplier: 1.0,
        riskCategory: 'medium' as const,
      },
      {
        id: `f-${newId}-2`,
        key: 'receipt_number',
        name: 'Receipt Number',
        value: renderCfg.receiptNumber,
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        pixelQuantileAuth: 0.92,
        ocrConfidence: 0.91,
        ruleCheckStatus: 'passed' as const,
        ruleCheckMessage: 'Standard Malaysian tax invoice numbering [INV-XXXXXX]',
        ruleCheckMultiplier: 1.0,
        riskCategory: 'high' as const,
      },
      {
        id: `f-${newId}-3`,
        key: 'date',
        name: 'Transaction Date',
        value: renderCfg.date,
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        pixelQuantileAuth: 0.93,
        ocrConfidence: 0.94,
        ruleCheckStatus: 'passed' as const,
        ruleCheckMessage: 'Calendar date verified',
        ruleCheckMultiplier: 1.0,
        riskCategory: 'high' as const,
      },
      {
        id: `f-${newId}-4`,
        key: 'tax_identifier',
        name: 'Tax Identifier (SST / TIN)',
        value: renderCfg.taxId,
        boundingBox: { x: 15, y: 13, width: 70, height: 4 },
        pixelQuantileAuth: 0.91,
        ocrConfidence: 0.93,
        ruleCheckStatus: 'passed' as const,
        ruleCheckMessage: 'Valid SST ID format',
        ruleCheckMultiplier: 1.0,
        riskCategory: 'high' as const,
      },
      {
        id: `f-${newId}-5`,
        key: 'tax_amount',
        name: 'Tax Amount (SST 6%)',
        value: `RM ${renderCfg.taxAmount}`,
        boundingBox: { x: 5, y: 60, width: 90, height: 4 },
        pixelQuantileAuth: 0.82,
        ocrConfidence: 0.88,
        ruleCheckStatus: 'warning' as const,
        ruleCheckMessage: 'Moderate thermal fading on decimal tail. 6% SST calculation checked.',
        ruleCheckMultiplier: 0.85,
        riskCategory: 'high' as const,
      },
      {
        id: `f-${newId}-6`,
        key: 'total_amount',
        name: 'Total Amount',
        value: `RM ${renderCfg.totalAmount}`,
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        pixelQuantileAuth: 0.92,
        ocrConfidence: 0.95,
        ruleCheckStatus: 'passed' as const,
        ruleCheckMessage: 'Subtotal (86.40) + Tax (5.18) = Total (91.58)',
        ruleCheckMultiplier: 1.0,
        riskCategory: 'high' as const,
      },
    ];

    const newFields: ReceiptField[] = rawFieldsData.map((raw) => {
      const afield = computeCompositeFieldScore(raw.pixelQuantileAuth, raw.ocrConfidence, raw.ruleCheckMultiplier);
      const decision = computeFieldDecision(afield, raw.ruleCheckStatus);
      return {
        id: raw.id,
        key: raw.key,
        name: raw.name,
        value: raw.value,
        originalExtractedValue: raw.value,
        boundingBox: raw.boundingBox,
        pixelQuantileAuth: raw.pixelQuantileAuth,
        ocrConfidence: raw.ocrConfidence,
        ruleCheckMultiplier: raw.ruleCheckMultiplier,
        afieldScore: afield,
        traceSupportScore: afield,
        ruleCheckStatus: raw.ruleCheckStatus,
        ruleCheckMessage: raw.ruleCheckMessage,
        riskCategory: raw.riskCategory,
        decisionStatus: decision.decisionStatus,
        isAbstained: decision.isAbstained,
        abstentionReason: decision.abstentionReason,
      };
    });

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
      processingMethod: 'Unrolled DSDNet + Authenticity Map',
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
        afieldScore: 0.88,
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
      reviewerNotes: 'Processed via custom upload (5-filter pipeline simulation).',
      reviewerName: settings.reviewerName,
      highRiskReviewCount: 1,
      inputChecksumSHA256: `SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
      outputChecksumSHA256: `SHA256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4`,
    };

    const newAudit: AuditRecord = {
      auditId: `AUD-${newId}`,
      receiptId: newId,
      filename: file.name,
      methodId: 'Unrolled DSDNet + Authenticity Map',
      configVersion: 'v2.2-Thesis-Fig4.1',
      unrollingIterationsK: 4,
      multiScaleBranchesM: 3,
      quantileQ: 0.10,
      processingTimestamp: timestamp,
      inputChecksum: `SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
      outputChecksum: `SHA256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4`,
      decision: 'warning',
      reviewer: settings.reviewerName,
      thresholdConfig: {
        tauAccept: 0.85,
        tauWarn: 0.70,
        traceThreshold: 0.85,
        ocrThreshold: 0.70,
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
        key: f.key,
        value: f.value,
        afieldScore: f.afieldScore,
        pixelQuantileAuth: f.pixelQuantileAuth,
        ocrConf: f.ocrConfidence,
        ruleStatus: f.ruleCheckStatus,
        status: f.decisionStatus,
      })),
      notes: 'Custom uploaded receipt processed through 5-filter pipeline simulation.',
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
            onViewAudit={() => {
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

      {/* Clean Global Bottom Status Bar */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] border-t border-slate-800 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold">DSDNet-Receipt</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Evidence-Bounded Document Review</span>
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          Decision Support System (Equation 8 & Abstention Filter)
        </div>
      </footer>
    </div>
  );
}
