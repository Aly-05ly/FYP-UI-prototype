import { ReceiptDocument, AuditRecord, EvaluationMetric, AppSettings, ReceiptField } from '../types';
import { generateReceiptImages, ReceiptRenderConfig } from '../utils/receiptCanvas';

export const INITIAL_SETTINGS: AppSettings = {
  processingMethod: 'DSDNet-v2.2-DualBranch (Conservative)',
  baselineMode: 'Proposed (Restoration + Authenticity + Abstention)',
  traceSupportThreshold: 0.75,
  ocrConfidenceThreshold: 0.80,
  strictHighRiskMultiplier: 1.15,
  autoAbstainLowSupport: true,
  localStoragePath: '/data/research/receipts_audit.db',
  dataRetentionDays: 90,
  reviewerName: 'A. Rahman (Lead Reviewer)',
  defaultExportFormat: 'json',
  enableSynchronizedZoom: true,
  showBoundingBoxes: true,
  defaultHeatmapOpacity: 0.65,
};

// Initial preset synthetic receipts
const rawPresetConfigs: Array<{
  id: string;
  filename: string;
  fileSizeKb: number;
  uploadTimestamp: string;
  processedTimestamp: string;
  degradationType: 'thermal_fading' | 'uneven_lighting' | 'creased_tear' | 'oil_stain' | 'heavy_blur';
  degradationSeverity: 'mild' | 'moderate' | 'severe';
  renderConfig: ReceiptRenderConfig;
  fields: Array<Omit<ReceiptField, 'originalExtractedValue' | 'isAbstained' | 'history'> & { originalExtractedValue?: string }>;
  overallDecision: 'accepted' | 'warning' | 'manual_verification';
  reviewerNotes: string;
}> = [
  {
    id: 'RCPT-2026-0841',
    filename: 'kedai_kopi_bukit_faded_0841.png',
    fileSizeKb: 342,
    uploadTimestamp: '2026-08-26 14:22:10',
    processedTimestamp: '2026-08-26 14:22:14',
    degradationType: 'thermal_fading',
    degradationSeverity: 'moderate',
    overallDecision: 'warning',
    reviewerNotes: 'Thermal ink fading noticeable on bottom SST tax calculation and total. Restored trace verified against top subtotal consistency check.',
    renderConfig: {
      merchantName: 'Kedai Kopi Bukit Bintang',
      receiptNumber: 'INV-2026-88412',
      date: '14/08/2026',
      taxId: 'W10-1808-32000012',
      subtotal: '45.85',
      taxAmount: '2.75',
      totalAmount: '48.60',
      degradation: 'thermal_fading',
      severity: 'moderate',
      items: [
        { description: 'Kopi Cham Peng Special', qty: 2, unitPrice: '4.80', total: '9.60' },
        { description: 'Kaya Butter Toast (Double)', qty: 2, unitPrice: '3.60', total: '7.20' },
        { description: 'Nasi Lemak Ayam Goreng', qty: 1, unitPrice: '14.50', total: '14.50' },
        { description: 'Mee Siam Sambal Sotong', qty: 1, unitPrice: '14.55', total: '14.55' }
      ]
    },
    fields: [
      {
        id: 'f1',
        key: 'merchant_name',
        name: 'Merchant Name',
        value: 'KEDAI KOPI BUKIT BINTANG',
        boundingBox: { x: 10, y: 3.5, width: 80, height: 5.5 },
        ocrConfidence: 0.98,
        traceSupportScore: 0.94,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Matches SME merchant registry format & clear letterhead',
        riskCategory: 'medium',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'Clear thermal ink absorption footprint without fading.'
      },
      {
        id: 'f2',
        key: 'receipt_number',
        name: 'Receipt Number',
        value: 'INV-2026-88412',
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.95,
        traceSupportScore: 0.91,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid invoice prefix standard [INV-YYYY-XXXXX]',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'High stroke continuity in alphanumeric block.'
      },
      {
        id: 'f3',
        key: 'date',
        name: 'Transaction Date',
        value: '14/08/2026',
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.94,
        traceSupportScore: 0.89,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid DD/MM/YYYY calendar date within current fiscal quarter',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'Clear date glyph edges.'
      },
      {
        id: 'f4',
        key: 'tax_identifier',
        name: 'Tax Identifier (SST / TIN)',
        value: 'W10-1808-32000012',
        boundingBox: { x: 15, y: 13, width: 70, height: 4 },
        ocrConfidence: 0.96,
        traceSupportScore: 0.92,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid Malaysian SST Registration Number format [W10-XXXX-XXXXXXXX]',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'High confidence trace across all 15 characters.'
      },
      {
        id: 'f5',
        key: 'subtotal',
        name: 'Subtotal Amount',
        value: 'RM 45.85',
        boundingBox: { x: 5, y: 56.5, width: 90, height: 4 },
        ocrConfidence: 0.91,
        traceSupportScore: 0.85,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Sum of item rows (9.60 + 7.20 + 14.50 + 14.55 = 45.85) equals subtotal',
        riskCategory: 'medium',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'Trace support confirmed with arithmetic validation.'
      },
      {
        id: 'f6',
        key: 'tax_amount',
        name: 'Tax Amount (SST 6%)',
        value: 'RM 2.75',
        boundingBox: { x: 5, y: 60, width: 90, height: 4 },
        ocrConfidence: 0.78,
        traceSupportScore: 0.71,
        ruleCheckStatus: 'warning',
        ruleCheckMessage: 'Partial fading detected on decimal "75". Calculated 6% of 45.85 = 2.751 ≈ 2.75',
        riskCategory: 'high',
        decisionStatus: 'warning',
        evidenceRegionDescription: 'Faint ink tail on decimal "75". Heatmap displays moderate uncertainty (amber zone).'
      },
      {
        id: 'f7',
        key: 'total_amount',
        name: 'Total Amount',
        value: 'RM 48.60',
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.89,
        traceSupportScore: 0.82,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Subtotal (45.85) + Tax (2.75) matches Total (48.60)',
        riskCategory: 'high',
        decisionStatus: 'accepted',
        evidenceRegionDescription: 'Reconstructed digits cross-verified with line item arithmetic.'
      }
    ]
  },
  {
    id: 'RCPT-2026-0842',
    filename: 'syarikat_percetakan_mega_faded.png',
    fileSizeKb: 412,
    uploadTimestamp: '2026-08-26 15:40:18',
    processedTimestamp: '2026-08-26 15:40:22',
    degradationType: 'thermal_fading',
    degradationSeverity: 'severe',
    overallDecision: 'manual_verification',
    reviewerNotes: 'Severe thermal head heat loss. The tax amount and subtotal digits are heavily faded below minimum trace threshold (0.75). System abstained.',
    renderConfig: {
      merchantName: 'Syarikat Percetakan Mega Sdn Bhd',
      receiptNumber: 'CS-902148',
      date: '10/08/2026',
      taxId: 'B16-1901-31000941',
      subtotal: '120.00',
      taxAmount: '7.20',
      totalAmount: '127.20',
      degradation: 'thermal_fading',
      severity: 'severe',
      items: [
        { description: 'A4 Digital Color Prints x100', qty: 1, unitPrice: '85.00', total: '85.00' },
        { description: 'Lamination Gloss Foil A4', qty: 10, unitPrice: '3.50', total: '35.00' }
      ]
    },
    fields: [
      {
        id: 'm1',
        key: 'merchant_name',
        name: 'Merchant Name',
        value: 'SYARIKAT PERCETAKAN MEGA SDN BHD',
        boundingBox: { x: 5, y: 3.5, width: 90, height: 5.5 },
        ocrConfidence: 0.94,
        traceSupportScore: 0.91,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Clear business name header',
        riskCategory: 'medium',
        decisionStatus: 'accepted'
      },
      {
        id: 'm2',
        key: 'receipt_number',
        name: 'Receipt Number',
        value: 'CS-902148',
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.88,
        traceSupportScore: 0.84,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Invoice ID matched standard pattern',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'm3',
        key: 'date',
        name: 'Transaction Date',
        value: '10/08/2026',
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.86,
        traceSupportScore: 0.82,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid date within fiscal window',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'm4',
        key: 'tax_identifier',
        name: 'Tax Identifier (SST / TIN)',
        value: 'B16-1901-31000941',
        boundingBox: { x: 15, y: 13, width: 70, height: 4 },
        ocrConfidence: 0.92,
        traceSupportScore: 0.88,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid SST format',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'm5',
        key: 'tax_amount',
        name: 'Tax Amount (SST 6%)',
        value: '[Uncertain: ~RM 7.20]',
        boundingBox: { x: 5, y: 60, width: 90, height: 4 },
        ocrConfidence: 0.42,
        traceSupportScore: 0.38,
        ruleCheckStatus: 'failed',
        ruleCheckMessage: 'Stroke trace support 0.38 is below threshold (0.75). Evidence insufficient.',
        riskCategory: 'high',
        decisionStatus: 'manual_verification',
        evidenceRegionDescription: 'Thermal fading rendered decimal numbers illegible. Authenticity heatmap shows crimson (low support) zone.'
      },
      {
        id: 'm6',
        key: 'total_amount',
        name: 'Total Amount',
        value: '[Abstained: ~RM 127.20]',
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.51,
        traceSupportScore: 0.46,
        ruleCheckStatus: 'failed',
        ruleCheckMessage: 'High-risk field trace support 0.46 is below strict threshold (0.86).',
        riskCategory: 'high',
        decisionStatus: 'manual_verification',
        evidenceRegionDescription: 'Faint ghosting on digit "7". Requires physical voucher confirmation.'
      }
    ]
  },
  {
    id: 'RCPT-2026-0843',
    filename: 'pasar_mini_sentosa_clean.png',
    fileSizeKb: 298,
    uploadTimestamp: '2026-08-25 11:15:32',
    processedTimestamp: '2026-08-25 11:15:35',
    degradationType: 'thermal_fading',
    degradationSeverity: 'mild',
    overallDecision: 'accepted',
    reviewerNotes: 'Mild uniform contrast variation. Full trace support across all 7 financial fields.',
    renderConfig: {
      merchantName: 'Pasar Mini Sentosa',
      receiptNumber: 'PMS-40192',
      date: '22/08/2026',
      taxId: 'A04-1603-22000099',
      subtotal: '32.50',
      taxAmount: '1.95',
      totalAmount: '34.45',
      degradation: 'thermal_fading',
      severity: 'mild',
      items: [
        { description: 'Beras Wangi 5kg Super', qty: 1, unitPrice: '26.00', total: '26.00' },
        { description: 'Gula Pasir Halus 1kg', qty: 2, unitPrice: '3.25', total: '6.50' }
      ]
    },
    fields: [
      {
        id: 'p1',
        key: 'merchant_name',
        name: 'Merchant Name',
        value: 'PASAR MINI SENTOSA',
        boundingBox: { x: 10, y: 3.5, width: 80, height: 5.5 },
        ocrConfidence: 0.99,
        traceSupportScore: 0.98,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'High trace support',
        riskCategory: 'medium',
        decisionStatus: 'accepted'
      },
      {
        id: 'p2',
        key: 'receipt_number',
        name: 'Receipt Number',
        value: 'PMS-40192',
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.98,
        traceSupportScore: 0.96,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Clear format',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'p3',
        key: 'date',
        name: 'Transaction Date',
        value: '22/08/2026',
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.97,
        traceSupportScore: 0.95,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid date',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'p4',
        key: 'tax_identifier',
        name: 'Tax Identifier (SST / TIN)',
        value: 'A04-1603-22000099',
        boundingBox: { x: 15, y: 13, width: 70, height: 4 },
        ocrConfidence: 0.96,
        traceSupportScore: 0.94,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid SST ID',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'p5',
        key: 'total_amount',
        name: 'Total Amount',
        value: 'RM 34.45',
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.96,
        traceSupportScore: 0.93,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Arithmetic consistent (32.50 + 1.95 = 34.45)',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      }
    ]
  },
  {
    id: 'RCPT-2026-0844',
    filename: 'restoran_keluarga_maju_oil.png',
    fileSizeKb: 380,
    uploadTimestamp: '2026-08-24 19:02:11',
    processedTimestamp: '2026-08-24 19:02:16',
    degradationType: 'oil_stain',
    degradationSeverity: 'moderate',
    overallDecision: 'warning',
    reviewerNotes: 'Cooking oil smudge over date and header. Restored thermal substrate allows confident reading of tax numbers.',
    renderConfig: {
      merchantName: 'Restoran Keluarga Maju',
      receiptNumber: 'RKM-89102',
      date: '19/08/2026',
      taxId: 'W10-2005-32000188',
      subtotal: '68.00',
      taxAmount: '4.08',
      totalAmount: '72.08',
      degradation: 'oil_stain',
      severity: 'moderate',
      items: [
        { description: 'Ikan Siakap Stim Limau', qty: 1, unitPrice: '45.00', total: '45.00' },
        { description: 'Kailan Ikan Masin (L)', qty: 1, unitPrice: '15.00', total: '15.00' },
        { description: 'Nasi Putih x4', qty: 4, unitPrice: '2.00', total: '8.00' }
      ]
    },
    fields: [
      {
        id: 'r1',
        key: 'merchant_name',
        name: 'Merchant Name',
        value: 'RESTORAN KELUARGA MAJU',
        boundingBox: { x: 10, y: 3.5, width: 80, height: 5.5 },
        ocrConfidence: 0.91,
        traceSupportScore: 0.86,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Verified merchant header',
        riskCategory: 'medium',
        decisionStatus: 'accepted'
      },
      {
        id: 'r2',
        key: 'receipt_number',
        name: 'Receipt Number',
        value: 'RKM-89102',
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.81,
        traceSupportScore: 0.76,
        ruleCheckStatus: 'warning',
        ruleCheckMessage: 'Oil stain occlusion partially affects edge stroke profile',
        riskCategory: 'high',
        decisionStatus: 'warning'
      },
      {
        id: 'r3',
        key: 'date',
        name: 'Transaction Date',
        value: '19/08/2026',
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.88,
        traceSupportScore: 0.84,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Date matches August fiscal file',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'r4',
        key: 'total_amount',
        name: 'Total Amount',
        value: 'RM 72.08',
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.94,
        traceSupportScore: 0.91,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Total verified (68.00 + 4.08 = 72.08)',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      }
    ]
  },
  {
    id: 'RCPT-2026-0845',
    filename: 'bengkel_motor_jaya_creased.png',
    fileSizeKb: 365,
    uploadTimestamp: '2026-08-23 16:11:45',
    processedTimestamp: '2026-08-23 16:11:49',
    degradationType: 'creased_tear',
    degradationSeverity: 'moderate',
    overallDecision: 'warning',
    reviewerNotes: 'Fold crease passing through receipt number line. Reconstructed using DSDNet directional priors.',
    renderConfig: {
      merchantName: 'Bengkel Motor Jaya Autoparts',
      receiptNumber: 'BMJ-77190',
      date: '15/08/2026',
      taxId: 'W10-1704-31000840',
      subtotal: '210.00',
      taxAmount: '12.60',
      totalAmount: '222.60',
      degradation: 'creased_tear',
      severity: 'moderate',
      items: [
        { description: 'Minyak Enjin Fully Synth 4T', qty: 2, unitPrice: '65.00', total: '130.00' },
        { description: 'Brake Pad Set (Front)', qty: 1, unitPrice: '45.00', total: '45.00' },
        { description: 'Upah Servis & Alignment', qty: 1, unitPrice: '35.00', total: '35.00' }
      ]
    },
    fields: [
      {
        id: 'b1',
        key: 'merchant_name',
        name: 'Merchant Name',
        value: 'BENGKEL MOTOR JAYA AUTOPARTS',
        boundingBox: { x: 5, y: 3.5, width: 90, height: 5.5 },
        ocrConfidence: 0.95,
        traceSupportScore: 0.92,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Registered auto service provider',
        riskCategory: 'medium',
        decisionStatus: 'accepted'
      },
      {
        id: 'b2',
        key: 'receipt_number',
        name: 'Receipt Number',
        value: 'BMJ-77190',
        boundingBox: { x: 5, y: 19.5, width: 45, height: 4 },
        ocrConfidence: 0.79,
        traceSupportScore: 0.74,
        ruleCheckStatus: 'warning',
        ruleCheckMessage: 'Crease line intersects digit "7". Review recommended.',
        riskCategory: 'high',
        decisionStatus: 'warning'
      },
      {
        id: 'b3',
        key: 'date',
        name: 'Transaction Date',
        value: '15/08/2026',
        boundingBox: { x: 55, y: 19.5, width: 40, height: 4 },
        ocrConfidence: 0.93,
        traceSupportScore: 0.89,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Valid transaction timestamp',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      },
      {
        id: 'b4',
        key: 'total_amount',
        name: 'Total Amount',
        value: 'RM 222.60',
        boundingBox: { x: 5, y: 64, width: 90, height: 5 },
        ocrConfidence: 0.92,
        traceSupportScore: 0.88,
        ruleCheckStatus: 'passed',
        ruleCheckMessage: 'Arithmetic consistent (210.00 + 12.60 = 222.60)',
        riskCategory: 'high',
        decisionStatus: 'accepted'
      }
    ]
  }
];

// Helper to generate ready-to-use sample receipt documents
export function buildPresetReceiptDocuments(): ReceiptDocument[] {
  return rawPresetConfigs.map((cfg) => {
    const images = generateReceiptImages(cfg.renderConfig);
    const enrichedFields: ReceiptField[] = cfg.fields.map((f) => {
      const isAbst = f.decisionStatus === 'manual_verification' || f.traceSupportScore < 0.75;
      return {
        ...f,
        originalExtractedValue: f.originalExtractedValue || f.value,
        isAbstained: isAbst,
        abstentionReason: isAbst
          ? 'This value requires manual verification because available evidence is insufficient.'
          : undefined,
        history: [
          {
            timestamp: cfg.processedTimestamp,
            action: 'System Extraction & Trace Evaluation',
            newValue: f.value,
            reviewer: 'DSDNet-Pipeline'
          }
        ]
      };
    });

    const highRiskCount = enrichedFields.filter(
      (f) => f.riskCategory === 'high' && f.decisionStatus !== 'accepted'
    ).length;

    const items = cfg.renderConfig.items.map((it, idx) => ({
      id: `it-${cfg.id}-${idx}`,
      description: it.description,
      quantity: it.qty,
      unitPrice: parseFloat(it.unitPrice),
      totalPrice: parseFloat(it.total),
      traceSupportScore: cfg.degradationSeverity === 'severe' ? 0.62 : 0.91,
      ocrConfidence: cfg.degradationSeverity === 'severe' ? 0.74 : 0.95,
      decisionStatus: (cfg.degradationSeverity === 'severe' ? 'manual_verification' : 'accepted') as any
    }));

    return {
      id: cfg.id,
      filename: cfg.filename,
      fileSizeKb: cfg.fileSizeKb,
      uploadTimestamp: cfg.uploadTimestamp,
      processedTimestamp: cfg.processedTimestamp,
      status: 'ready',
      overallDecision: cfg.overallDecision,
      degradationType: cfg.degradationType,
      degradationSeverity: cfg.degradationSeverity,
      processingMethod: 'DSDNet-v2.2-DualBranch (Conservative)',
      processingTimeMs: 420 + Math.floor(Math.random() * 180),
      merchantName: cfg.renderConfig.merchantName,
      receiptNumber: cfg.renderConfig.receiptNumber,
      date: cfg.renderConfig.date,
      taxIdentifier: cfg.renderConfig.taxId,
      taxAmount: `RM ${cfg.renderConfig.taxAmount}`,
      totalAmount: `RM ${cfg.renderConfig.totalAmount}`,
      items,
      fields: enrichedFields,
      rawOcrText: `${cfg.renderConfig.merchantName}\nTAX ID: ${cfg.renderConfig.taxId}\nRCPT NO: ${cfg.renderConfig.receiptNumber}\nDATE: ${cfg.renderConfig.date}\nTOTAL: RM ${cfg.renderConfig.totalAmount}`,
      imageDimensions: { width: images.width, height: images.height },
      originalImageUrl: images.originalImageUrl,
      restoredImageUrl: images.restoredImageUrl,
      heatmapImageUrl: images.heatmapImageUrl,
      overlayImageUrl: images.overlayImageUrl,
      auditRecordId: `AUD-${cfg.id}`,
      reviewerNotes: cfg.reviewerNotes,
      reviewerName: 'A. Rahman (Lead Reviewer)',
      highRiskReviewCount: highRiskCount
    };
  });
}

// Initial Audit Records
export function buildPresetAuditRecords(receipts: ReceiptDocument[]): AuditRecord[] {
  return receipts.map((r) => {
    const acceptedCount = r.fields.filter((f) => f.decisionStatus === 'accepted').length;
    const warningCount = r.fields.filter((f) => f.decisionStatus === 'warning').length;
    const manualCount = r.fields.filter((f) => f.decisionStatus === 'manual_verification').length;

    return {
      auditId: r.auditRecordId,
      receiptId: r.id,
      filename: r.filename,
      methodId: 'DSDNet-v2.2-Conservative-Abstain',
      processingTimestamp: r.processedTimestamp || r.uploadTimestamp,
      inputChecksum: `SHA256:7f9a88e${r.id.slice(-4)}c8b41094df...`,
      outputChecksum: `SHA256:3a1b49e${r.id.slice(-4)}f1a09884bc...`,
      decision: r.overallDecision,
      reviewer: r.reviewerName,
      thresholdConfig: {
        traceThreshold: 0.75,
        ocrThreshold: 0.80,
        strictHighRisk: true
      },
      fieldDecisionsSummary: {
        total: r.fields.length,
        accepted: acceptedCount,
        warning: warningCount,
        manualVerification: manualCount
      },
      fieldDetails: r.fields.map((f) => ({
        fieldName: f.name,
        value: f.value,
        traceScore: f.traceSupportScore,
        ocrConf: f.ocrConfidence,
        status: f.decisionStatus,
        notes: f.reviewerNote,
        isModified: f.isModified
      })),
      notes: r.reviewerNotes,
      exportHistory: [
        {
          timestamp: r.processedTimestamp || r.uploadTimestamp,
          format: 'JSON (Full Field & Authenticity Map)',
          exportedBy: r.reviewerName
        }
      ]
    };
  });
}

// Research Evaluation Metrics Dataset (Comparing all 5 baselines from academic spec)
export const EVALUATION_METRICS: EvaluationMetric[] = [
  {
    id: 'm-direct',
    methodName: 'Direct Extraction (Raw)',
    methodCategory: 'baseline',
    isExecuted: true,
    isPlannedTarget: false,
    psnr: null, // N/A on raw input
    ssim: null,
    cer: 28.4, // % Character Error Rate
    wer: 34.2, // % Word Error Rate
    fieldAccuracy: 58.6, // %
    traceF1: null, // No trace branch
    ece: 0.294,
    faithfulnessAuc: null,
    abstentionRate: 0.0, // No abstention capability
    acceptedFieldAcc: 58.6,
    unsupportedAcceptanceRate: 36.8, // High risk of hallucination acceptance
    processingTimeMs: 145,
    notes: 'Standard Tesseract 5.3 on degraded thermal receipts without restoration or authenticity mapping.'
  },
  {
    id: 'm-classical',
    methodName: 'Classical Enhancement (CLAHE + Bilateral)',
    methodCategory: 'classical',
    isExecuted: true,
    isPlannedTarget: false,
    psnr: 19.8,
    ssim: 0.712,
    cer: 21.6,
    wer: 26.8,
    fieldAccuracy: 67.2,
    traceF1: null,
    ece: 0.248,
    faithfulnessAuc: null,
    abstentionRate: 0.0,
    acceptedFieldAcc: 67.2,
    unsupportedAcceptanceRate: 28.4,
    processingTimeMs: 190,
    notes: 'Contrast-limited adaptive histogram equalization and edge-preserving bilateral filtering.'
  },
  {
    id: 'm-filtering',
    methodName: 'Filtering Baseline (Wiener / NLM)',
    methodCategory: 'baseline',
    isExecuted: true,
    isPlannedTarget: false,
    psnr: 21.4,
    ssim: 0.748,
    cer: 19.3,
    wer: 24.1,
    fieldAccuracy: 71.5,
    traceF1: null,
    ece: 0.221,
    faithfulnessAuc: null,
    abstentionRate: 0.0,
    acceptedFieldAcc: 71.5,
    unsupportedAcceptanceRate: 23.9,
    processingTimeMs: 310,
    notes: 'Non-local means denoising with adaptive Wiener inverse filter.'
  },
  {
    id: 'm-dsdnet-no-auth',
    methodName: 'DSDNet Without Authenticity Branch',
    methodCategory: 'proposed',
    isExecuted: true,
    isPlannedTarget: false,
    psnr: 27.6,
    ssim: 0.884,
    cer: 9.8,
    wer: 12.4,
    fieldAccuracy: 84.8,
    traceF1: null,
    ece: 0.162,
    faithfulnessAuc: null,
    abstentionRate: 0.0,
    acceptedFieldAcc: 84.8,
    unsupportedAcceptanceRate: 14.6, // Generative hallucination risk still present
    processingTimeMs: 410,
    notes: 'Dual-stream restoration network generating clean images, but lacking pixel-wise evidence map and abstention.'
  },
  {
    id: 'm-dsdnet-receipt-proposed',
    methodName: 'Proposed DSDNet-Receipt (Full Framework)',
    methodCategory: 'proposed',
    isExecuted: true,
    isPlannedTarget: false,
    psnr: 28.9,
    ssim: 0.912,
    cer: 5.4,
    wer: 7.1,
    fieldAccuracy: 93.8, // Overall
    traceF1: 0.892,
    ece: 0.048, // Well calibrated
    faithfulnessAuc: 0.941,
    abstentionRate: 14.2, // Controlled abstention on degraded fields
    acceptedFieldAcc: 98.4, // Near-perfect accuracy on accepted fields
    unsupportedAcceptanceRate: 1.8, // Drastically reduced false acceptance
    processingTimeMs: 485,
    notes: 'Complete pipeline: Conservative Preprocessing + DSDNet Restoration + Pixel Authenticity Heatmap + Rule Checks + Human Verification Loop.'
  },
  {
    id: 'm-target-v3',
    methodName: 'Planned Target (DSDNet-Receipt v3.0 Phase 2)',
    methodCategory: 'proposed',
    isExecuted: false,
    isPlannedTarget: true,
    psnr: 31.0,
    ssim: 0.940,
    cer: 3.2,
    wer: 4.5,
    fieldAccuracy: 96.5,
    traceF1: 0.925,
    ece: 0.035,
    faithfulnessAuc: 0.965,
    abstentionRate: 10.5,
    acceptedFieldAcc: 99.2,
    unsupportedAcceptanceRate: 0.8,
    processingTimeMs: 380,
    notes: 'Future target with cross-attention transformer priors and multi-scale thermal kernel fusion.'
  }
];
