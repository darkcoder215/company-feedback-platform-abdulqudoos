import {
  Employee,
  Evaluation,
  PerformanceReview,
  LeaderEvaluation,
  PlatformData,
  UnifiedEmployee,
  DataQualityReport,
  CleanedData,
} from './types';

// ── Arabic Name Normalization ──

/** Strip tatweel, normalize hamza variants, remove diacritics, collapse whitespace */
export function normalizeArabicName(name: string): string {
  if (!name) return '';
  let n = name.trim();
  // Remove tatweel (kashida)
  n = n.replace(/ـ/g, '');
  // Normalize hamza variants → bare alef
  n = n.replace(/[أإآٱ]/g, 'ا');
  // Normalize taa marbuta → haa
  n = n.replace(/ة/g, 'ه');
  // Remove diacritics (tashkeel): fatha, damma, kasra, sukun, shadda, tanwin
  n = n.replace(/[\u064B-\u065F\u0670]/g, '');
  // Remove zero-width characters
  n = n.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
  // Collapse whitespace
  n = n.replace(/\s+/g, ' ').trim();
  // Lowercase for any Latin parts
  n = n.toLowerCase();
  return n;
}

/** Tokenize a normalized name into individual words */
function tokenize(name: string): string[] {
  return name.split(/\s+/).filter(t => t.length > 0);
}

// ── Fuzzy Matching ──

export function fuzzyMatchName(
  name: string,
  candidates: Map<string, string>, // normalized → original
): { match: string; confidence: number } | null {
  const normalized = normalizeArabicName(name);
  if (!normalized) return null;

  // Stage 1: Exact normalized match (confidence 1.0)
  if (candidates.has(normalized)) {
    return { match: candidates.get(normalized)!, confidence: 1.0 };
  }

  // Stage 2: Substring/contains match (confidence 0.8)
  const tokens = tokenize(normalized);
  for (const [candNorm, candOrig] of candidates) {
    // Check if one contains the other
    if (candNorm.includes(normalized) || normalized.includes(candNorm)) {
      return { match: candOrig, confidence: 0.8 };
    }
  }

  // Stage 3: Token overlap (confidence based on overlap ratio)
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [candNorm, candOrig] of candidates) {
    const candTokens = tokenize(candNorm);
    if (candTokens.length === 0) continue;

    // Count matching tokens
    let matches = 0;
    for (const t of tokens) {
      if (candTokens.some(ct => ct === t || ct.includes(t) || t.includes(ct))) {
        matches++;
      }
    }

    const overlapRatio = matches / Math.max(tokens.length, candTokens.length);
    if (overlapRatio > bestScore && overlapRatio >= 0.5) {
      bestScore = overlapRatio;
      bestMatch = candOrig;
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    return { match: bestMatch, confidence: Math.min(0.7, bestScore) };
  }

  return null;
}

// ── Garbage Detection ──

export function isGarbageRecord(name: string): boolean {
  if (!name || name.trim().length === 0) return true;
  const trimmed = name.trim();
  // Single character
  if (trimmed.length <= 1) return true;
  // Numeric only
  if (/^\d+$/.test(trimmed)) return true;
  // Test/junk patterns
  if (/^(test|تجربة|تست|تجريبي|xxx|aaa|bbb|zzz)/i.test(trimmed)) return true;
  // Email-like (not a name)
  if (/^[^@]+@[^@]+\.[^@]+$/.test(trimmed)) return true;
  // Only special characters
  if (/^[^a-zA-Z\u0600-\u06FF]+$/.test(trimmed)) return true;
  return false;
}

// ── Deduplication ──

export function deduplicateByName<T>(items: T[], nameKey: keyof T): { unique: T[]; removed: number } {
  const seen = new Set<string>();
  const unique: T[] = [];
  let removed = 0;

  for (const item of items) {
    const name = normalizeArabicName(String(item[nameKey] || ''));
    if (!name || seen.has(name)) {
      if (name) removed++;
      continue;
    }
    seen.add(name);
    unique.push(item);
  }

  return { unique, removed };
}

// ── Unified Employee Map Builder ──

export function buildUnifiedEmployeeMap(data: PlatformData): {
  unifiedMap: Map<string, UnifiedEmployee>;
  qualityReport: DataQualityReport;
} {
  // Build normalized name → original name lookup for employees
  const empByNormalized = new Map<string, string>(); // normalized → employee.name
  const empByOriginal = new Map<string, Employee>(); // original name → Employee

  for (const emp of data.employees) {
    const norm = normalizeArabicName(emp.name);
    if (norm && !empByNormalized.has(norm)) {
      empByNormalized.set(norm, emp.name);
      empByOriginal.set(emp.name, emp);
    }
    // Also index by preferred name
    if (emp.preferredName && emp.preferredName !== emp.name) {
      const normPref = normalizeArabicName(emp.preferredName);
      if (normPref && !empByNormalized.has(normPref)) {
        empByNormalized.set(normPref, emp.name);
      }
    }
  }

  // Initialize unified map
  const unifiedMap = new Map<string, UnifiedEmployee>();
  for (const emp of data.employees) {
    unifiedMap.set(emp.name, {
      ...emp,
      evaluations: [],
      reviews: [],
      leaderEvaluations: [],
      leaderEvaluationsGiven: [],
      matchConfidence: {},
    });
  }

  const report: DataQualityReport = {
    totalEmployees: data.employees.length,
    matchedEvaluations: 0,
    totalEvaluations: data.evaluations.length,
    matchedReviews: 0,
    totalReviews: data.reviews.length,
    matchedLeaders: 0,
    totalLeaders: data.leaders.length,
    unmatchedEvaluationNames: [],
    unmatchedReviewNames: [],
    unmatchedLeaderNames: [],
    garbageRemoved: 0,
    duplicatesRemoved: 0,
  };

  // Link evaluations → employees
  const unmatchedEvalSet = new Set<string>();
  for (const ev of data.evaluations) {
    if (isGarbageRecord(ev.employeeName)) {
      report.garbageRemoved++;
      continue;
    }
    const match = fuzzyMatchName(ev.employeeName, empByNormalized);
    if (match) {
      const unified = unifiedMap.get(match.match);
      if (unified) {
        unified.evaluations.push(ev);
        unified.matchConfidence[`eval-${ev.id}`] = match.confidence;
        report.matchedEvaluations++;
      }
    } else {
      unmatchedEvalSet.add(ev.employeeName);
    }
  }
  report.unmatchedEvaluationNames = Array.from(unmatchedEvalSet);

  // Link reviews → employees
  const unmatchedRevSet = new Set<string>();
  for (const rev of data.reviews) {
    if (isGarbageRecord(rev.employeeName)) {
      report.garbageRemoved++;
      continue;
    }
    const match = fuzzyMatchName(rev.employeeName, empByNormalized);
    if (match) {
      const unified = unifiedMap.get(match.match);
      if (unified) {
        unified.reviews.push(rev);
        unified.matchConfidence[`rev-${rev.id}`] = match.confidence;
        report.matchedReviews++;
      }
    } else {
      unmatchedRevSet.add(rev.employeeName);
    }
  }
  report.unmatchedReviewNames = Array.from(unmatchedRevSet);

  // Link leader evaluations → employees (both as evaluatee and evaluator)
  const unmatchedLeaderSet = new Set<string>();
  for (const ldr of data.leaders) {
    if (isGarbageRecord(ldr.leaderName)) {
      report.garbageRemoved++;
      continue;
    }

    let matched = false;

    // Match leader (evaluatee)
    const leaderMatch = fuzzyMatchName(ldr.leaderName, empByNormalized);
    if (leaderMatch) {
      const unified = unifiedMap.get(leaderMatch.match);
      if (unified) {
        unified.leaderEvaluations.push(ldr);
        unified.matchConfidence[`ldr-${ldr.id}`] = leaderMatch.confidence;
        matched = true;
      }
    }

    // Match evaluator (who gave the evaluation)
    if (ldr.evaluatorName && !isGarbageRecord(ldr.evaluatorName)) {
      const evaluatorMatch = fuzzyMatchName(ldr.evaluatorName, empByNormalized);
      if (evaluatorMatch) {
        const unified = unifiedMap.get(evaluatorMatch.match);
        if (unified) {
          unified.leaderEvaluationsGiven.push(ldr);
        }
      }
    }

    if (matched) {
      report.matchedLeaders++;
    } else {
      unmatchedLeaderSet.add(ldr.leaderName);
    }
  }
  report.unmatchedLeaderNames = Array.from(unmatchedLeaderSet);

  return { unifiedMap, qualityReport: report };
}

// ── Main Pipeline Entry Point ──

export function cleanPlatformData(data: PlatformData): CleanedData {
  // Step 1: Remove garbage records
  const cleanEvals = data.evaluations.filter(e => !isGarbageRecord(e.employeeName));
  const cleanRevs = data.reviews.filter(r => !isGarbageRecord(r.employeeName));
  const cleanLdrs = data.leaders.filter(l => !isGarbageRecord(l.leaderName));
  const cleanEmps = data.employees.filter(e => !isGarbageRecord(e.name));

  const garbageCount =
    (data.evaluations.length - cleanEvals.length) +
    (data.reviews.length - cleanRevs.length) +
    (data.leaders.length - cleanLdrs.length) +
    (data.employees.length - cleanEmps.length);

  // Step 2: Deduplicate employees by name
  const { unique: dedupedEmps, removed: empDupes } = deduplicateByName(cleanEmps, 'name');

  const cleanData: PlatformData = {
    employees: dedupedEmps,
    evaluations: cleanEvals,
    reviews: cleanRevs,
    leaders: cleanLdrs,
  };

  // Step 3: Build unified map with fuzzy matching
  const { unifiedMap, qualityReport } = buildUnifiedEmployeeMap(cleanData);

  // Add garbage and dedup counts
  qualityReport.garbageRemoved = garbageCount;
  qualityReport.duplicatesRemoved = empDupes;

  return {
    ...cleanData,
    unifiedMap,
    qualityReport,
  };
}
