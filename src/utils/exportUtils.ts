import { ReceiptDocument, AuditRecord } from '../types';

export function exportReceiptAsJSON(receipt: ReceiptDocument, auditRecord?: AuditRecord) {
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      system: 'DSDNet-Receipt Research Prototype (Thesis Chapter 4 Implementation)',
      researchNotice:
        'This export is generated for receipt evidence review and verification research. It does not certify legal compliance or guarantee MyInvois acceptance.'
    },
    receipt: {
      id: receipt.id,
      filename: receipt.filename,
      uploadTimestamp: receipt.uploadTimestamp,
      processedTimestamp: receipt.processedTimestamp,
      overallDecision: receipt.overallDecision,
      processingMethod: receipt.processingMethod,
      degradationType: receipt.degradationType,
      degradationSeverity: receipt.degradationSeverity,
      processingTimeMs: receipt.processingTimeMs,
      reviewer: receipt.reviewerName,
      reviewerNotes: receipt.reviewerNotes,
      decisionTimestamp: receipt.decisionTimestamp,
      inputChecksumSHA256: receipt.inputChecksumSHA256,
      outputChecksumSHA256: receipt.outputChecksumSHA256
    },
    extractedFields: receipt.fields.map((f) => ({
      name: f.name,
      key: f.key,
      value: f.value,
      originalExtractedValue: f.originalExtractedValue,
      afieldScore: f.afieldScore,
      pixelQuantileAuth: f.pixelQuantileAuth,
      ocrConfidence: f.ocrConfidence,
      ruleMultiplier: f.ruleCheckMultiplier ?? (f.ruleCheckStatus === 'passed' ? 1.0 : f.ruleCheckStatus === 'warning' ? 0.85 : 0.0),
      ruleCheckStatus: f.ruleCheckStatus,
      ruleCheckMessage: f.ruleCheckMessage,
      riskCategory: f.riskCategory,
      decisionStatus: f.decisionStatus,
      isAbstained: f.isAbstained,
      abstentionReason: f.abstentionReason,
      reviewerNote: f.reviewerNote,
      boundingBox: f.boundingBox
    })),
    lineItems: receipt.items,
    auditRecord: auditRecord || {
      auditId: receipt.auditRecordId,
      receiptId: receipt.id,
      inputChecksumSHA256: receipt.inputChecksumSHA256,
      outputChecksumSHA256: receipt.outputChecksumSHA256,
      processingMethod: receipt.processingMethod,
      timestamp: receipt.processedTimestamp,
      reviewer: receipt.reviewerName,
      decision: receipt.overallDecision,
      abstentionCount: receipt.fields.filter((f) => f.isAbstained).length,
      tauAccept: 0.85,
      tauWarn: 0.70
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${receipt.id}_dsdnet_verification.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReceiptAsCSV(receipt: ReceiptDocument) {
  const headers = [
    'Field Name',
    'Extracted Value',
    'A_field Score (Eq 8)',
    'Pixel Quantile Auth (Q_q)',
    'OCR Confidence (C_OCR)',
    'Rule Multiplier (P_rule)',
    'Rule Check Status',
    'Risk Category',
    'Decision Status',
    'Is Abstained',
    'Reviewer Note'
  ];

  const rows = receipt.fields.map((f) => [
    `"${f.name}"`,
    `"${f.value.replace(/"/g, '""')}"`,
    f.afieldScore.toFixed(4),
    f.pixelQuantileAuth.toFixed(3),
    f.ocrConfidence.toFixed(3),
    (f.ruleCheckMultiplier ?? (f.ruleCheckStatus === 'passed' ? 1.0 : f.ruleCheckStatus === 'warning' ? 0.85 : 0.0)).toFixed(2),
    `"${f.ruleCheckStatus}"`,
    `"${f.riskCategory}"`,
    `"${f.decisionStatus}"`,
    f.isAbstained ? 'YES' : 'NO',
    `"${(f.reviewerNote || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${receipt.id}_fields_audit.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAuditRecordAsJSON(record: AuditRecord) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${record.auditId}_audit_record.json`;
  a.click();
  URL.revokeObjectURL(url);
}
