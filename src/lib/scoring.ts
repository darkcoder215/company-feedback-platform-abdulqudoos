/**
 * Maps emoji-based evaluation scores to numeric values (1-5 scale).
 * Handles both first impression and decision station evaluation formats.
 */

const SCORE_PATTERNS: Array<{ pattern: RegExp; score: number; label: string }> = [
  { pattern: /🟢🟢\s*ممتاز/, score: 5, label: 'ممتاز' },
  { pattern: /🟢🟢\s*جاهز تمامًا/, score: 5, label: 'جاهز تمامًا' },
  { pattern: /🟢\s*جيد جدًا/, score: 4, label: 'جيد جدًا' },
  { pattern: /🟢\s*جاهز جزئيًا/, score: 4, label: 'جاهز جزئيًا' },
  { pattern: /🟡\s*جيد/, score: 3, label: 'جيد' },
  { pattern: /🔴\s*متعثّر/, score: 2, label: 'متعثّر' },
  { pattern: /🔴🔴\s*ضعيف/, score: 1, label: 'ضعيف' },
  { pattern: /🔴🔴\s*غير مناسب/, score: 1, label: 'غير مناسب' },
];

// First impression specific patterns
const FIRST_IMPRESSION_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /🟢🟢\s*ممتاز.*بدأ بقوة/, score: 5 },
  { pattern: /🟢🟢\s*ممتاز.*سريع التعلّم/, score: 5 },
  { pattern: /🟢🟢\s*ممتاز.*يستخدم بيسكامب/, score: 5 },
  { pattern: /🟢\s*جيد جدًا.*اندمج بسرعة/, score: 4 },
  { pattern: /🟢\s*جيد جدًا.*يستوعب المهام/, score: 4 },
  { pattern: /🟢\s*جيد جدًا.*متعاون/, score: 4 },
  { pattern: /🟢\s*جيد جدًا.*بداية إيجابية/, score: 4 },
  { pattern: /🟡\s*جيد.*يتواصل عند الحاجة/, score: 3 },
  { pattern: /🟡\s*جيد.*يتابع التحديثات/, score: 3 },
];

const TRAFFIC_LIGHT_PATTERNS: Array<{ pattern: RegExp; score: number; label: string }> = [
  { pattern: /🟢🟢\s*دربه فخر/, score: 5, label: 'فخر' },
  { pattern: /🟢\s*دربه خضر/, score: 4, label: 'خضر' },
  { pattern: /🟡\s*دربه صفر/, score: 3, label: 'صفر' },
  { pattern: /🔴\s*دربه حمر/, score: 1, label: 'حمر' },
];

const DECISION_PATTERNS: Array<{ pattern: RegExp; decision: string }> = [
  { pattern: /🥇\s*الترسيم/, decision: 'confirmed' },
  { pattern: /❌\s*عدم الاستمرار/, decision: 'terminated' },
];

export function parseScoreFromText(text: string | undefined | null): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();

  // Try specific first impression patterns first
  for (const { pattern, score } of FIRST_IMPRESSION_PATTERNS) {
    if (pattern.test(trimmed)) return score;
  }

  // Try general score patterns
  for (const { pattern, score } of SCORE_PATTERNS) {
    if (pattern.test(trimmed)) return score;
  }

  return 0;
}

export function parseTrafficLight(text: string | undefined | null): { score: number; label: string } {
  if (!text || typeof text !== 'string') return { score: 0, label: '' };
  const trimmed = text.trim();

  for (const { pattern, score, label } of TRAFFIC_LIGHT_PATTERNS) {
    if (pattern.test(trimmed)) return { score, label };
  }

  return { score: 0, label: '' };
}

export function parseFinalDecision(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();

  for (const { pattern, decision } of DECISION_PATTERNS) {
    if (pattern.test(trimmed)) return decision;
  }

  return '';
}

export function getScoreColor(score: number): string {
  if (score >= 4.5) return '#00C17A'; // Excellent
  if (score >= 3.5) return '#B2E2BA'; // Good
  if (score >= 2.5) return '#FFBC0A'; // Average
  if (score >= 1.5) return '#FF9172'; // Below average
  if (score >= 0.5) return '#F24935'; // Poor
  return '#EFEDE2'; // No data
}

export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'ممتاز';
  if (score >= 3.5) return 'جيد جدًا';
  if (score >= 2.5) return 'جيد';
  if (score >= 1.5) return 'متعثّر';
  if (score >= 0.5) return 'ضعيف';
  return 'غير متاح';
}

export function getTrafficLightColor(label: string): string {
  switch (label) {
    case 'فخر': return '#00C17A';
    case 'خضر': return '#B2E2BA';
    case 'صفر': return '#FFBC0A';
    case 'حمر': return '#F24935';
    default: return '#EFEDE2';
  }
}

export function getDecisionLabel(decision: string): string {
  switch (decision) {
    case 'confirmed': return 'الترسيم';
    case 'terminated': return 'عدم الاستمرار';
    default: return 'غير محدد';
  }
}

export function getDecisionColor(decision: string): string {
  switch (decision) {
    case 'confirmed': return '#00C17A';
    case 'terminated': return '#F24935';
    default: return '#EFEDE2';
  }
}

export function calculateAverageScore(scores: number[]): number {
  const valid = scores.filter(s => s > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
