export type RiskCategory = 'high' | 'medium' | 'low';
export type DecisionStatus = 'accepted' | 'warning' | 'manual_verification';
export type ProcessingStatus = 
  | 'idle'
  | 'uploading'
  | 'preprocessing'
  | 'restoring'
  | 'mapping'
  | 'extracting'
  | 'auditing'
  | 'ready'
  | 'error';

export interface BoundingBox {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
}

export interface FieldHistoryItem {
  timestamp: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  reviewer?: string;
}

export interface ReceiptField {
  id: string;
  name: string;
  key: string;
  value: string;
  originalExtractedValue: string;
  boundingBox: BoundingBox;
  ocrConfidence: number; // C_OCR(f) in [0.0, 1.0]
  traceSupportScore: number; // Pixel authenticity support Q_q in [0.0, 1.0]
  pixelQuantileAuth: number; // Q_q(pixel authenticity in B_f)
  quantileQ?: number; // default e.g. 0.10 (10th percentile)
  aggregationMethod?: string; // 'q10_quantile' | 'mean'
  afieldScore: number; // Composite score A_field(f) = Q_q * C_OCR * P_rule
  ruleCheckMultiplier?: number; // P_rule(f) in {1.0, 0.85, 0.0}
  ruleCheckStatus: 'passed' | 'warning' | 'failed';
  ruleCheckMessage: string;
  riskCategory: RiskCategory;
  decisionStatus: DecisionStatus;
  isAbstained: boolean;
  abstentionReason?: string;
  reviewerNote?: string;
  isModified?: boolean;
  evidenceRegionDescription?: string;
  history?: FieldHistoryItem[];
}

export interface ItemLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  traceSupportScore: number;
  ocrConfidence: number;
  afieldScore: number;
  decisionStatus: DecisionStatus;
}

export interface ReceiptDocument {
  id: string;
  filename: string;
  fileSizeKb: number;
  uploadTimestamp: string;
  processedTimestamp?: string;
  decisionTimestamp?: string;
  inputChecksumSHA256?: string;
  outputChecksumSHA256?: string;
  status: ProcessingStatus;
  overallDecision: DecisionStatus;
  degradationType: 'thermal_fading' | 'uneven_lighting' | 'creased_tear' | 'oil_stain' | 'heavy_blur';
  degradationSeverity: 'mild' | 'moderate' | 'severe';
  processingMethod: string;
  processingTimeMs: number;
  merchantName: string;
  receiptNumber: string;
  date: string;
  taxIdentifier: string;
  taxAmount: string;
  totalAmount: string;
  items: ItemLine[];
  fields: ReceiptField[];
  rawOcrText: string;
  imageDimensions: { width: number; height: number };
  originalImageUrl: string;
  restoredImageUrl: string;
  heatmapImageUrl: string;
  overlayImageUrl: string;
  auditRecordId: string;
  reviewerNotes: string;
  reviewerName: string;
  highRiskReviewCount: number;
}

export interface AuditRecord {
  auditId: string;
  receiptId: string;
  filename: string;
  methodId: string;
  configVersion: string;
  unrollingIterationsK: number; // e.g. 4
  multiScaleBranchesM: number; // e.g. 3
  quantileQ: number; // e.g. 0.10
  processingTimestamp: string;
  inputChecksum: string;
  outputChecksum: string;
  decision: DecisionStatus;
  reviewer: string;
  thresholdConfig: {
    tauAccept: number; // e.g. 0.85
    tauWarn: number; // e.g. 0.70
    traceThreshold: number; // 0.85
    ocrThreshold: number; // 0.80
    strictHighRisk: boolean;
  };
  fieldDecisionsSummary: {
    total: number;
    accepted: number;
    warning: number;
    manualVerification: number;
  };
  fieldDetails: {
    fieldName: string;
    key?: string;
    value: string;
    afieldScore: number;
    pixelQuantileAuth: number;
    ocrConf: number;
    ruleStatus: 'passed' | 'warning' | 'failed';
    status: DecisionStatus;
    notes?: string;
    isModified?: boolean;
  }[];
  notes: string;
  exportHistory: {
    timestamp: string;
    format: string;
    exportedBy: string;
  }[];
}

export interface EvaluationMetric {
  id: string;
  methodName: string;
  methodCategory: 'baseline' | 'classical' | 'proposed';
  isExecuted: boolean;
  isPlannedTarget?: boolean;
  psnr: number | null; // dB
  ssim: number | null; // 0-1
  cer: number | null; // % Character Error Rate (lower better)
  wer: number | null; // % Word Error Rate (lower better)
  fieldAccuracy: number | null; // %
  traceF1: number | null; // 0-1
  ece: number | null; // Expected Calibration Error (lower better)
  faithfulnessAuc: number | null; // 0-1
  abstentionRate: number | null; // %
  acceptedFieldAcc: number | null; // %
  unsupportedAcceptanceRate: number | null; // % (lower better)
  processingTimeMs: number | null;
  notes: string;
}

export interface AppSettings {
  processingMethod: string;
  baselineMode: string;
  tauAccept: number; // 0.85 (Thesis Chapter 4 §4.3.2)
  tauWarn: number; // 0.70
  traceSupportThreshold: number; // 0.85
  ocrConfidenceThreshold: number; // 0.80
  strictHighRiskMultiplier: number;
  autoAbstainLowSupport: boolean;
  evaluationMode: boolean; // Locks thresholds to thesis defaults
  unrollingIterationsK: number; // K=4
  multiScaleBranchesM: number; // M=3
  quantileQ: number; // q=0.10
  localStoragePath: string;
  dataRetentionDays: number;
  reviewerName: string;
  defaultExportFormat: 'json' | 'csv' | 'png' | 'summary';
  enableSynchronizedZoom: boolean;
  showBoundingBoxes: boolean;
  defaultHeatmapOpacity: number;
}
