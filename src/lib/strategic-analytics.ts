import { Employee, Evaluation, PerformanceReview, LeaderEvaluation, PlatformData } from './types';
import { calculateAverageScore } from './scoring';

// ── Types ──

export interface RiskEmployee {
  employee: Employee;
  score: number;
  factors: string[];
}

export interface OrgHealth {
  composite: number;
  leaderScore: number;
  probationRate: number;
  performanceHealth: number;
  retentionRate: number;
  byDepartment: { name: string; score: number }[];
}

export interface TalentRisk {
  critical: RiskEmployee[];
  high: RiskEmployee[];
  medium: RiskEmployee[];
  byDepartment: { name: string; critical: number; high: number; medium: number }[];
}

export interface Recommendation {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: number;
}

export interface OnboardingPipeline {
  funnel: { stage: string; count: number; pct: number }[];
  byDepartment: { name: string; total: number; confirmed: number; terminated: number; rate: number }[];
  byEvaluator: { name: string; confirmed: number; terminated: number; total: number; rate: number }[];
}

export interface LeaderRanking {
  name: string;
  score360: number;
  teamPerfAvg: number;
  teamSize: number;
}

export interface LeadershipEffectiveness {
  ranking: LeaderRanking[];
  coachingNeeded: { name: string; weakAreas: string[] }[];
  topVsBottom: { category: string; topScore: number; bottomScore: number }[];
}

export interface SkillGaps {
  orgRadar: { criterion: string; score: number; label: string }[];
  bottom3: { criterion: string; score: number; label: string }[];
  heatmap: { department: string; scores: Record<string, number> }[];
}

export interface ManagerCalibration {
  perfCalibration: { manager: string; avgGiven: number; count: number; deviation: number }[];
  probCalibration: { evaluator: string; avgGiven: number; count: number; deviation: number }[];
  orgAvgPerf: number;
  orgAvgProb: number;
}

export interface WorkforceComposition {
  tenureBuckets: { bucket: string; count: number }[];
  ageBuckets: { bucket: string; count: number }[];
  leadershipDensity: { dept: string; density: number; leaders: number; total: number }[];
  workTypes: { type: string; count: number }[];
}

// ── Helpers ──

const PERF_CRITERIA: { key: keyof import('./types').PerformanceScores; label: string }[] = [
  { key: 'outputQuality', label: 'جودة المخرجات' },
  { key: 'timeDiscipline', label: 'الانضباط' },
  { key: 'basecampUsage', label: 'بيسكامب' },
  { key: 'initiative', label: 'المبادرة' },
  { key: 'efficiency', label: 'الكفاءة' },
  { key: 'dependability', label: 'الاعتمادية' },
  { key: 'professionalDev', label: 'التطور المهني' },
  { key: 'overallTrack', label: 'الدرب العام' },
];

const LEADER_CATEGORIES: { key: keyof LeaderEvaluation; label: string }[] = [
  { key: 'communication', label: 'التواصل' },
  { key: 'prioritization', label: 'الأولويات' },
  { key: 'decisionMaking', label: 'اتخاذ القرار' },
  { key: 'goalSetting', label: 'تحديد الأهداف' },
  { key: 'empowerment', label: 'التمكين' },
  { key: 'delegation', label: 'التفويض' },
  { key: 'support', label: 'الدعم' },
  { key: 'emotionalIntelligence', label: 'الذكاء العاطفي' },
  { key: 'morale', label: 'المعنويات' },
  { key: 'collaboration', label: 'التعاون' },
  { key: 'environment', label: 'بيئة العمل' },
  { key: 'inclusion', label: 'الشمولية' },
  { key: 'development', label: 'التطوير' },
  { key: 'feedback', label: 'التغذية الراجعة' },
  { key: 'performance', label: 'الأداء' },
  { key: 'creativity', label: 'الإبداع' },
];

function getDepartments(data: PlatformData): string[] {
  const depts = new Set<string>();
  data.employees.forEach(e => { if (e.department) depts.add(e.department); });
  data.reviews.forEach(r => { if (r.department) depts.add(r.department); });
  return Array.from(depts);
}

function computeHealthComponents(
  employees: Employee[],
  evaluations: Evaluation[],
  reviews: PerformanceReview[],
  leaders: LeaderEvaluation[],
): { leaderScore: number; probationRate: number; performanceHealth: number; retentionRate: number } {
  // Leader score: avg of leader 360 averages / 10 * 100
  const leaderAvgs = leaders.map(l => l.averageScore).filter(s => s > 0);
  const leaderScore = leaderAvgs.length > 0 ? (calculateAverageScore(leaderAvgs) / 10) * 100 : 50;

  // Probation rate: confirmed / (confirmed + terminated) * 100
  const confirmed = evaluations.filter(e => e.finalDecision && e.finalDecision.includes('الترسيم')).length;
  const terminated = evaluations.filter(e => e.finalDecision && e.finalDecision.includes('عدم الاستمرار')).length;
  const probationRate = (confirmed + terminated) > 0 ? (confirmed / (confirmed + terminated)) * 100 : 50;

  // Performance health: (فخر + خضر) reviews / total reviews * 100
  const greenReviews = reviews.filter(r => {
    const t = r.generalTrack || '';
    return t.includes('فخر') || t.includes('خضر');
  }).length;
  const performanceHealth = reviews.length > 0 ? (greenReviews / reviews.length) * 100 : 50;

  // Retention rate: retainEmployee = yes / (yes + no) * 100
  const retainYes = reviews.filter(r => {
    const v = (r.retainEmployee || '').trim().toLowerCase();
    return v === 'yes' || v === 'نعم' || v === '✅' || v.includes('نعم');
  }).length;
  const retainNo = reviews.filter(r => {
    const v = (r.retainEmployee || '').trim().toLowerCase();
    return v === 'no' || v === 'لا' || v === '❌' || v.includes('لا');
  }).length;
  const retentionRate = (retainYes + retainNo) > 0 ? (retainYes / (retainYes + retainNo)) * 100 : 50;

  return { leaderScore, probationRate, performanceHealth, retentionRate };
}

function computeComposite(c: { leaderScore: number; probationRate: number; performanceHealth: number; retentionRate: number }): number {
  return Math.round(c.leaderScore * 0.25 + c.probationRate * 0.20 + c.performanceHealth * 0.30 + c.retentionRate * 0.25);
}

// ── Main Functions ──

export function computeOrgHealth(data: PlatformData): OrgHealth {
  const components = computeHealthComponents(data.employees, data.evaluations, data.reviews, data.leaders);
  const composite = computeComposite(components);

  const departments = getDepartments(data);
  const byDepartment = departments.map(dept => {
    const deptEmps = data.employees.filter(e => e.department === dept);
    const deptEvals = data.evaluations.filter(e => {
      const emp = deptEmps.find(emp => emp.name === e.employeeName || emp.preferredName === e.employeeName);
      return !!emp;
    });
    const deptReviews = data.reviews.filter(r => r.department === dept);
    const deptLeaders = data.leaders.filter(l => {
      const emp = deptEmps.find(emp => emp.name === l.leaderName || emp.preferredName === l.leaderName);
      return !!emp;
    });
    const c = computeHealthComponents(deptEmps, deptEvals, deptReviews, deptLeaders);
    return { name: dept, score: computeComposite(c) };
  }).sort((a, b) => b.score - a.score);

  return { composite, ...components, byDepartment };
}

export function computeTalentRisk(data: PlatformData): TalentRisk {
  const riskEmployees: RiskEmployee[] = data.employees.map(emp => {
    let score = 0;
    const factors: string[] = [];

    // Contract expiry risk
    if (emp.contractDaysRemaining > 0 && emp.contractDaysRemaining < 30) {
      score += 40;
      factors.push('عقد ينتهي خلال ٣٠ يوم');
    } else if (emp.contractDaysRemaining >= 30 && emp.contractDaysRemaining < 60) {
      score += 25;
      factors.push('عقد ينتهي خلال ٦٠ يوم');
    } else if (emp.contractDaysRemaining >= 60 && emp.contractDaysRemaining < 90) {
      score += 15;
      factors.push('عقد ينتهي خلال ٩٠ يوم');
    }

    // Retain employee risk
    const review = data.reviews.find(r => r.employeeName === emp.name || r.employeeName === emp.preferredName);
    if (review) {
      const retain = (review.retainEmployee || '').trim().toLowerCase();
      if (retain === '❌' || retain === 'لا' || retain === 'no') {
        score += 30;
        factors.push('لا يتم التمسك به');
      }
      // Track risk
      const track = review.generalTrack || '';
      if (track.includes('حمر') || track.includes('خطر')) {
        score += 25;
        factors.push('درب حمر/خطر');
      }
      // Traffic light
    }

    // Evaluation risk
    const evaluation = data.evaluations.find(e => e.employeeName === emp.name || e.employeeName === emp.preferredName);
    if (evaluation) {
      if (evaluation.finalDecision && evaluation.finalDecision.includes('عدم الاستمرار')) {
        score += 35;
        factors.push('فشل فترة التجربة');
      }
      const tl = (evaluation.trafficLight || '').trim();
      if (tl.includes('حمر')) {
        score += 20;
        factors.push('إشارة حمراء');
      }
    }

    return { employee: emp, score, factors };
  }).filter(r => r.score >= 20);

  const critical = riskEmployees.filter(r => r.score >= 60).sort((a, b) => b.score - a.score);
  const high = riskEmployees.filter(r => r.score >= 40 && r.score < 60).sort((a, b) => b.score - a.score);
  const medium = riskEmployees.filter(r => r.score >= 20 && r.score < 40).sort((a, b) => b.score - a.score);

  const departments = getDepartments(data);
  const byDepartment = departments.map(dept => {
    const deptEmps = new Set(data.employees.filter(e => e.department === dept).map(e => e.name));
    return {
      name: dept,
      critical: critical.filter(r => deptEmps.has(r.employee.name)).length,
      high: high.filter(r => deptEmps.has(r.employee.name)).length,
      medium: medium.filter(r => deptEmps.has(r.employee.name)).length,
    };
  }).filter(d => d.critical + d.high + d.medium > 0);

  return { critical, high, medium, byDepartment };
}

export function generateRecommendations(data: PlatformData): Recommendation[] {
  const recs: Recommendation[] = [];
  const departments = getDepartments(data);

  // 1. Dept probation failure > 30%
  departments.forEach(dept => {
    const deptEmps = new Set(data.employees.filter(e => e.department === dept).map(e => e.name));
    const deptEvals = data.evaluations.filter(e => deptEmps.has(e.employeeName));
    const confirmed = deptEvals.filter(e => e.finalDecision && e.finalDecision.includes('الترسيم')).length;
    const terminated = deptEvals.filter(e => e.finalDecision && e.finalDecision.includes('عدم الاستمرار')).length;
    const total = confirmed + terminated;
    if (total > 0) {
      const failRate = (terminated / total) * 100;
      if (failRate > 30) {
        recs.push({
          severity: 'critical',
          title: `إدارة ${dept} معدل فشل تجربة ${Math.round(failRate)}% — راجعوا عملية التأهيل`,
          description: `${terminated} من ${total} موظف لم يجتازوا فترة التجربة`,
          metric: failRate,
        });
      }
    }
  });

  // 2. Contracts expiring < 30d > 3
  const expiringContracts = data.employees.filter(e => e.contractDaysRemaining > 0 && e.contractDaysRemaining < 30);
  if (expiringContracts.length > 3) {
    recs.push({
      severity: 'critical',
      title: `${expiringContracts.length} عقود تنتهي خلال ٣٠ يوماً — بدء التجديد فوراً`,
      description: `عقود على وشك الانتهاء تحتاج إجراء عاجل`,
      metric: expiringContracts.length,
    });
  }

  // 3. Any leader 360 avg < 5
  const leaderNames = [...new Set(data.leaders.map(l => l.leaderName))];
  const lowLeaders = leaderNames.filter(name => {
    const evals = data.leaders.filter(l => l.leaderName === name);
    const avg = calculateAverageScore(evals.map(e => e.averageScore));
    return avg > 0 && avg < 5;
  });
  if (lowLeaders.length > 0) {
    recs.push({
      severity: 'warning',
      title: `${lowLeaders.length} قائد تحت المتوسط — خطة تطوير قيادي`,
      description: `قادة حصلوا على تقييم ٣٦٠ أقل من ٥/١٠`,
      metric: lowLeaders.length,
    });
  }

  // 4. Any perf criterion org-avg < 3/5
  if (data.reviews.length > 0) {
    let weakestCriterion = '';
    let weakestScore = 5;
    PERF_CRITERIA.forEach(({ key, label }) => {
      const scores = data.reviews.map(r => r.performanceScores[key]).filter(s => s > 0);
      if (scores.length > 0) {
        const avg = calculateAverageScore(scores);
        if (avg < weakestScore) {
          weakestScore = avg;
          weakestCriterion = label;
        }
      }
    });
    if (weakestScore < 3) {
      recs.push({
        severity: 'warning',
        title: `${weakestCriterion} أضعف معيار بمتوسط ${weakestScore.toFixed(1)} — تدريب مطلوب`,
        description: `هذا المعيار أقل من ٣/٥ على مستوى المنظمة`,
        metric: weakestScore,
      });
    }
  }

  // 5. retainEmployee ❌ > 15%
  if (data.reviews.length > 0) {
    const retainNo = data.reviews.filter(r => {
      const v = (r.retainEmployee || '').trim().toLowerCase();
      return v === '❌' || v === 'لا' || v === 'no';
    }).length;
    const retainYes = data.reviews.filter(r => {
      const v = (r.retainEmployee || '').trim().toLowerCase();
      return v === 'yes' || v === 'نعم' || v === '✅' || v.includes('نعم');
    }).length;
    const total = retainYes + retainNo;
    if (total > 0) {
      const pct = (retainNo / total) * 100;
      if (pct > 15) {
        recs.push({
          severity: 'warning',
          title: `${Math.round(pct)}% لا يتم التمسك بهم — تحقيق مطلوب`,
          description: `${retainNo} موظف من ${total} لا يُوصى بالتمسك بهم`,
          metric: pct,
        });
      }
    }
  }

  // 6. Dept avg perf below org avg by > 0.5
  if (data.reviews.length > 0) {
    const allScores = data.reviews.map(r => {
      const vals = Object.values(r.performanceScores).filter(v => typeof v === 'number' && v > 0);
      return vals.length > 0 ? calculateAverageScore(vals) : 0;
    }).filter(s => s > 0);
    const orgAvg = allScores.length > 0 ? calculateAverageScore(allScores) : 0;

    departments.forEach(dept => {
      const deptReviews = data.reviews.filter(r => r.department === dept);
      const deptScores = deptReviews.map(r => {
        const vals = Object.values(r.performanceScores).filter(v => typeof v === 'number' && v > 0);
        return vals.length > 0 ? calculateAverageScore(vals) : 0;
      }).filter(s => s > 0);
      if (deptScores.length > 0) {
        const deptAvg = calculateAverageScore(deptScores);
        if (orgAvg - deptAvg > 0.5) {
          recs.push({
            severity: 'info',
            title: `إدارة ${dept} أداء أقل من المتوسط`,
            description: `متوسط الأداء ${deptAvg.toFixed(1)} مقابل ${orgAvg.toFixed(1)} للمنظمة`,
            metric: deptAvg,
          });
        }
      }
    });
  }

  // 7. Female leaders < 20%
  const leaders = data.employees.filter(e => e.isLeader);
  if (leaders.length > 0) {
    const femaleLeaders = leaders.filter(e => e.gender === 'أنثى' || e.gender === 'Female' || e.gender === 'female' || e.gender === 'F');
    const pct = (femaleLeaders.length / leaders.length) * 100;
    if (pct < 20) {
      recs.push({
        severity: 'info',
        title: `القيادات النسائية ${Math.round(pct)}% — فرصة تعزيز التنوع`,
        description: `${femaleLeaders.length} قائدة من ${leaders.length} قائد`,
        metric: pct,
      });
    }
  }

  // 8. Leader category avg < 6/10
  if (data.leaders.length > 0) {
    LEADER_CATEGORIES.forEach(({ key, label }) => {
      const scores = data.leaders.map(l => l[key] as number).filter(s => typeof s === 'number' && s > 0);
      if (scores.length > 0) {
        const avg = calculateAverageScore(scores);
        if (avg < 6) {
          recs.push({
            severity: 'info',
            title: `محور ${label} يحتاج تطوير`,
            description: `متوسط ${avg.toFixed(1)}/١٠ على مستوى جميع القادة`,
            metric: avg,
          });
        }
      }
    });
  }

  return recs;
}

export function computeOnboardingPipeline(data: PlatformData): OnboardingPipeline {
  const totalEmployees = data.employees.filter(e => e.inProbation || data.evaluations.some(ev => ev.employeeName === e.name || ev.employeeName === e.preferredName)).length || data.evaluations.length;

  const firstImpressions = data.evaluations.filter(e => e.evaluationType === 'first_impression');
  const decisionStation = data.evaluations.filter(e => e.evaluationType === 'decision_station');
  const confirmed = data.evaluations.filter(e => e.finalDecision && e.finalDecision.includes('الترسيم'));
  const terminated = data.evaluations.filter(e => e.finalDecision && e.finalDecision.includes('عدم الاستمرار'));

  const total = Math.max(totalEmployees, firstImpressions.length, data.evaluations.length);
  const funnel = [
    { stage: 'تعيين', count: total, pct: 100 },
    { stage: 'الانطباع الأول', count: firstImpressions.length, pct: total > 0 ? (firstImpressions.length / total) * 100 : 0 },
    { stage: 'محطة القرار', count: decisionStation.length, pct: total > 0 ? (decisionStation.length / total) * 100 : 0 },
    { stage: 'ترسيم', count: confirmed.length, pct: total > 0 ? (confirmed.length / total) * 100 : 0 },
    { stage: 'عدم استمرار', count: terminated.length, pct: total > 0 ? (terminated.length / total) * 100 : 0 },
  ];

  const departments = getDepartments(data);
  const byDepartment = departments.map(dept => {
    const deptEmps = new Set(data.employees.filter(e => e.department === dept).map(e => e.name));
    const deptEvals = data.evaluations.filter(e => deptEmps.has(e.employeeName));
    const deptConfirmed = deptEvals.filter(e => e.finalDecision && e.finalDecision.includes('الترسيم')).length;
    const deptTerminated = deptEvals.filter(e => e.finalDecision && e.finalDecision.includes('عدم الاستمرار')).length;
    const deptTotal = deptConfirmed + deptTerminated;
    return {
      name: dept,
      total: deptEvals.length,
      confirmed: deptConfirmed,
      terminated: deptTerminated,
      rate: deptTotal > 0 ? (deptConfirmed / deptTotal) * 100 : 0,
    };
  }).filter(d => d.total > 0);

  const evaluators = [...new Set(data.evaluations.map(e => e.evaluatorName).filter(Boolean))];
  const byEvaluator = evaluators.map(name => {
    const evals = data.evaluations.filter(e => e.evaluatorName === name);
    const evalConfirmed = evals.filter(e => e.finalDecision && e.finalDecision.includes('الترسيم')).length;
    const evalTerminated = evals.filter(e => e.finalDecision && e.finalDecision.includes('عدم الاستمرار')).length;
    const evalTotal = evalConfirmed + evalTerminated;
    return {
      name,
      confirmed: evalConfirmed,
      terminated: evalTerminated,
      total: evals.length,
      rate: evalTotal > 0 ? (evalConfirmed / evalTotal) * 100 : 0,
    };
  }).filter(e => e.total > 0);

  return { funnel, byDepartment, byEvaluator };
}

export function computeLeadershipEffectiveness(
  employees: Employee[],
  leaders: LeaderEvaluation[],
  reviews: PerformanceReview[],
): LeadershipEffectiveness {
  const leaderNames = [...new Set(leaders.map(l => l.leaderName))];

  const ranking: LeaderRanking[] = leaderNames.map(name => {
    const evals = leaders.filter(l => l.leaderName === name);
    const score360 = calculateAverageScore(evals.map(e => e.averageScore));

    // Match team via employee.manager === leaderName
    const teamMembers = employees.filter(e => e.manager === name);
    const teamNames = new Set(teamMembers.map(e => e.name));
    // Also add preferred names
    teamMembers.forEach(e => { if (e.preferredName) teamNames.add(e.preferredName); });

    const teamReviews = reviews.filter(r => teamNames.has(r.employeeName));
    const teamPerfScores = teamReviews.map(r => {
      const vals = Object.values(r.performanceScores).filter(v => typeof v === 'number' && v > 0);
      return vals.length > 0 ? calculateAverageScore(vals) : 0;
    }).filter(s => s > 0);
    const teamPerfAvg = teamPerfScores.length > 0 ? calculateAverageScore(teamPerfScores) : 0;

    return { name, score360, teamPerfAvg, teamSize: teamMembers.length };
  }).sort((a, b) => b.score360 - a.score360);

  // Coaching needed: leaders with any category avg < 6
  const coachingNeeded = leaderNames.map(name => {
    const evals = leaders.filter(l => l.leaderName === name);
    const weakAreas: string[] = [];
    LEADER_CATEGORIES.forEach(({ key, label }) => {
      const scores = evals.map(e => e[key] as number).filter(s => typeof s === 'number' && s > 0);
      if (scores.length > 0 && calculateAverageScore(scores) < 6) {
        weakAreas.push(label);
      }
    });
    return { name, weakAreas };
  }).filter(c => c.weakAreas.length > 0);

  // Top vs bottom comparison
  const topVsBottom: { category: string; topScore: number; bottomScore: number }[] = [];
  if (ranking.length >= 2) {
    const topLeader = ranking[0].name;
    const bottomLeader = ranking[ranking.length - 1].name;
    const topEvals = leaders.filter(l => l.leaderName === topLeader);
    const bottomEvals = leaders.filter(l => l.leaderName === bottomLeader);

    LEADER_CATEGORIES.forEach(({ key, label }) => {
      const topScores = topEvals.map(e => e[key] as number).filter(s => typeof s === 'number' && s > 0);
      const bottomScores = bottomEvals.map(e => e[key] as number).filter(s => typeof s === 'number' && s > 0);
      topVsBottom.push({
        category: label,
        topScore: topScores.length > 0 ? calculateAverageScore(topScores) : 0,
        bottomScore: bottomScores.length > 0 ? calculateAverageScore(bottomScores) : 0,
      });
    });
  }

  return { ranking, coachingNeeded, topVsBottom };
}

export function computeSkillGaps(reviews: PerformanceReview[]): SkillGaps {
  if (reviews.length === 0) {
    return { orgRadar: [], bottom3: [], heatmap: [] };
  }

  const orgRadar = PERF_CRITERIA.map(({ key, label }) => {
    const scores = reviews.map(r => r.performanceScores[key]).filter(s => s > 0);
    const score = scores.length > 0 ? calculateAverageScore(scores) : 0;
    return { criterion: key, score: Math.round(score * 100) / 100, label };
  });

  const bottom3 = [...orgRadar].sort((a, b) => a.score - b.score).slice(0, 3);

  const departments = [...new Set(reviews.map(r => r.department).filter(Boolean))];
  const heatmap = departments.map(dept => {
    const deptReviews = reviews.filter(r => r.department === dept);
    const scores: Record<string, number> = {};
    PERF_CRITERIA.forEach(({ key }) => {
      const vals = deptReviews.map(r => r.performanceScores[key]).filter(s => s > 0);
      scores[key] = vals.length > 0 ? Math.round(calculateAverageScore(vals) * 100) / 100 : 0;
    });
    return { department: dept, scores };
  });

  return { orgRadar, bottom3, heatmap };
}

export function computeManagerCalibration(
  reviews: PerformanceReview[],
  evaluations: Evaluation[],
): ManagerCalibration {
  // Performance calibration by directLeader
  const managers = [...new Set(reviews.map(r => r.directLeader).filter(Boolean))];
  const allPerfAvgs = reviews.map(r => {
    const vals = Object.values(r.performanceScores).filter(v => typeof v === 'number' && v > 0);
    return vals.length > 0 ? calculateAverageScore(vals) : 0;
  }).filter(s => s > 0);
  const orgAvgPerf = allPerfAvgs.length > 0 ? calculateAverageScore(allPerfAvgs) : 0;

  const perfCalibration = managers.map(manager => {
    const managerReviews = reviews.filter(r => r.directLeader === manager);
    const scores = managerReviews.map(r => {
      const vals = Object.values(r.performanceScores).filter(v => typeof v === 'number' && v > 0);
      return vals.length > 0 ? calculateAverageScore(vals) : 0;
    }).filter(s => s > 0);
    const avgGiven = scores.length > 0 ? calculateAverageScore(scores) : 0;
    return {
      manager,
      avgGiven: Math.round(avgGiven * 100) / 100,
      count: managerReviews.length,
      deviation: Math.round((avgGiven - orgAvgPerf) * 100) / 100,
    };
  }).filter(m => m.count > 0).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  // Probation calibration by evaluator
  const evaluators = [...new Set(evaluations.map(e => e.evaluatorName).filter(Boolean))];
  const allEvalScores = evaluations.map(e => e.trafficLightScore).filter(s => s > 0);
  const orgAvgProb = allEvalScores.length > 0 ? calculateAverageScore(allEvalScores) : 0;

  const probCalibration = evaluators.map(evaluator => {
    const evalEvals = evaluations.filter(e => e.evaluatorName === evaluator);
    const scores = evalEvals.map(e => e.trafficLightScore).filter(s => s > 0);
    const avgGiven = scores.length > 0 ? calculateAverageScore(scores) : 0;
    return {
      evaluator,
      avgGiven: Math.round(avgGiven * 100) / 100,
      count: evalEvals.length,
      deviation: Math.round((avgGiven - orgAvgProb) * 100) / 100,
    };
  }).filter(e => e.count > 0).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  return {
    perfCalibration,
    probCalibration,
    orgAvgPerf: Math.round(orgAvgPerf * 100) / 100,
    orgAvgProb: Math.round(orgAvgProb * 100) / 100,
  };
}

export function computeWorkforceComposition(employees: Employee[]): WorkforceComposition {
  // Tenure buckets
  const tenureDefs = [
    { bucket: '0-1', min: 0, max: 1 },
    { bucket: '1-2', min: 1, max: 2 },
    { bucket: '2-3', min: 2, max: 3 },
    { bucket: '3-5', min: 3, max: 5 },
    { bucket: '5+', min: 5, max: Infinity },
  ];
  const tenureBuckets = tenureDefs.map(({ bucket, min, max }) => ({
    bucket,
    count: employees.filter(e => e.serviceYears >= min && e.serviceYears < max).length,
  }));

  // Age buckets
  const ageDefs = [
    { bucket: '<25', min: 0, max: 25 },
    { bucket: '25-30', min: 25, max: 30 },
    { bucket: '30-35', min: 30, max: 35 },
    { bucket: '35-40', min: 35, max: 40 },
    { bucket: '40+', min: 40, max: Infinity },
  ];
  const ageBuckets = ageDefs.map(({ bucket, min, max }) => ({
    bucket,
    count: employees.filter(e => e.age >= min && e.age < max).length,
  }));

  // Leadership density
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const leadershipDensity = departments.map(dept => {
    const deptEmps = employees.filter(e => e.department === dept);
    const leaderCount = deptEmps.filter(e => e.isLeader).length;
    return {
      dept,
      density: deptEmps.length > 0 ? Math.round((leaderCount / deptEmps.length) * 100) : 0,
      leaders: leaderCount,
      total: deptEmps.length,
    };
  });

  // Work types
  const workTypeMap = new Map<string, number>();
  employees.forEach(e => {
    const t = e.workType || 'غير محدد';
    workTypeMap.set(t, (workTypeMap.get(t) || 0) + 1);
  });
  const workTypes = Array.from(workTypeMap.entries()).map(([type, count]) => ({ type, count }));

  return { tenureBuckets, ageBuckets, leadershipDensity, workTypes };
}
