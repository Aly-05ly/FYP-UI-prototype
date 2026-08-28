import { DecisionStatus } from '../types';

export interface FieldScoreComponents {
  pixelQuantileAuth: number; // Q_q(pixel authenticity in B_f) in [0, 1]
  ocrConfidence: number;     // C_OCR(f) in [0, 1]
  ruleCheckMultiplier: number; // P_rule(f) in {1.0, 0.85, 0.0}
  quantileQ: number;         // e.g. 0.10 (10th percentile)
  aggregationMethod: string; // 'q10_quantile' | 'mean' | 'median'
}

/**
 * Computes composite field authenticity score A_field(f) according to Equation (8):
 * A_field(f) = Q_q(pixel authenticity in B_f) * C_OCR(f) * P_rule(f)
 */
export function calculateAfieldScore(
  pixelQuantileAuth: number,
  ocrConfidence: number,
  ruleStatus: 'passed' | 'warning' | 'failed',
  customRuleMultiplier?: number
): {
  afieldScore: number;
  ruleMultiplier: number;
} {
  let ruleMultiplier = 1.0;
  if (customRuleMultiplier !== undefined) {
    ruleMultiplier = customRuleMultiplier;
  } else {
    if (ruleStatus === 'passed') {
      ruleMultiplier = 1.0;
    } else if (ruleStatus === 'warning') {
      ruleMultiplier = 0.85; // soft rule warning penalty
    } else {
      ruleMultiplier = 0.0; // deterministic rule failure forces score to 0
    }
  }

  const rawScore = pixelQuantileAuth * ocrConfidence * ruleMultiplier;
  const clampedScore = Math.max(0, Math.min(1, rawScore));

  return {
    afieldScore: Number(clampedScore.toFixed(4)),
    ruleMultiplier,
  };
}

export function computeCompositeFieldScore(
  pixelQuantileAuth: number,
  ocrConfidence: number,
  ruleMultiplier: number = 1.0
): number {
  const rawScore = pixelQuantileAuth * ocrConfidence * ruleMultiplier;
  return Number(Math.max(0, Math.min(1, rawScore)).toFixed(4));
}

/**
 * Determines decision status based on thesis thresholds (§4.3.2):
 * - If rule failed (P_rule == 0) -> 'manual_verification'
 * - If A_field >= tau_accept (0.85) -> 'accepted'
 * - If tau_warn <= A_field < tau_accept (0.70 <= A_field < 0.85) -> 'warning'
 * - If A_field < tau_warn (< 0.70) -> 'manual_verification' (Abstained)
 */
export function evaluateFieldDecision(
  afieldScore: number,
  ruleStatus: 'passed' | 'warning' | 'failed',
  tauAccept: number = 0.85,
  tauWarn: number = 0.70
): DecisionStatus {
  if (ruleStatus === 'failed') {
    return 'manual_verification';
  }

  if (afieldScore >= tauAccept) {
    return 'accepted';
  } else if (afieldScore >= tauWarn) {
    return 'warning';
  } else {
    return 'manual_verification';
  }
}

export function computeFieldDecision(
  afieldScore: number,
  ruleStatus: 'passed' | 'warning' | 'failed',
  tauAccept: number = 0.85,
  tauWarn: number = 0.70
): { decisionStatus: DecisionStatus; isAbstained: boolean; abstentionReason?: string } {
  const status = evaluateFieldDecision(afieldScore, ruleStatus, tauAccept, tauWarn);
  const isAbst = status === 'manual_verification';
  let abstentionReason: string | undefined;

  if (ruleStatus === 'failed') {
    abstentionReason = 'Deterministic validation rule failed. Manual verification required.';
  } else if (afieldScore < tauWarn) {
    abstentionReason = `Composite score A_field (${afieldScore.toFixed(3)}) is below warning cutoff (tau_warn = ${tauWarn}). Evidence insufficient.`;
  }

  return {
    decisionStatus: status,
    isAbstained: isAbst,
    abstentionReason,
  };
}
