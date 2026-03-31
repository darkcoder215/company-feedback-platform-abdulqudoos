import { Employee, Evaluation, DepartmentStats } from './types';
import { calculateAverageScore } from './scoring';

export function getDepartmentStats(
  employees: Employee[],
  evaluations: Evaluation[]
): DepartmentStats[] {
  const deptMap = new Map<string, Employee[]>();

  for (const emp of employees) {
    if (!emp.department) continue;
    const existing = deptMap.get(emp.department) || [];
    existing.push(emp);
    deptMap.set(emp.department, existing);
  }

  const stats: DepartmentStats[] = [];

  for (const [dept, emps] of deptMap) {
    const males = emps.filter(e => e.gender === 'ذكر').length;
    const females = emps.filter(e => e.gender === 'أنثى').length;

    const nationalityDist: Record<string, number> = {};
    for (const emp of emps) {
      if (emp.nationality) {
        nationalityDist[emp.nationality] = (nationalityDist[emp.nationality] || 0) + 1;
      }
    }

    const teams = [...new Set(emps.map(e => e.team).filter(Boolean))];

    // Find evaluations for this department's employees
    const deptEmployeeNames = new Set(emps.map(e => e.name));
    const deptEvals = evaluations.filter(ev => deptEmployeeNames.has(ev.employeeName));

    // Calculate average score from evaluations
    const allScores: number[] = [];
    for (const ev of deptEvals) {
      if (ev.decisionStationScores) {
        const scores = Object.values(ev.decisionStationScores).filter(s => s > 0);
        allScores.push(...scores);
      }
      if (ev.firstImpressionScores) {
        const scores = Object.values(ev.firstImpressionScores).filter(s => s > 0);
        allScores.push(...scores);
      }
    }

    // Calculate probation pass rate
    const decisionEvals = deptEvals.filter(ev => ev.finalDecision);
    const passCount = decisionEvals.filter(ev => ev.finalDecision === 'confirmed').length;

    stats.push({
      name: dept,
      employeeCount: emps.length,
      avgServiceYears: emps.reduce((s, e) => s + e.serviceYears, 0) / emps.length,
      avgAge: emps.filter(e => e.age > 0).length > 0
        ? emps.filter(e => e.age > 0).reduce((s, e) => s + e.age, 0) / emps.filter(e => e.age > 0).length
        : 0,
      leaderCount: emps.filter(e => e.isLeader).length,
      genderDistribution: { male: males, female: females },
      nationalityDistribution: nationalityDist,
      teams,
      evaluationCount: deptEvals.length,
      avgScore: calculateAverageScore(allScores),
      probationPassRate: decisionEvals.length > 0 ? (passCount / decisionEvals.length) * 100 : 0,
    });
  }

  return stats.sort((a, b) => b.employeeCount - a.employeeCount);
}

export function getOverallStats(employees: Employee[], evaluations: Evaluation[]) {
  const totalEmployees = employees.length;
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const teams = [...new Set(employees.map(e => e.team).filter(Boolean))];
  const avgServiceYears = totalEmployees > 0
    ? employees.reduce((s, e) => s + e.serviceYears, 0) / totalEmployees
    : 0;
  const leaders = employees.filter(e => e.isLeader).length;
  const inProbation = employees.filter(e => e.inProbation).length;
  const totalEvaluations = evaluations.length;

  const firstImpressions = evaluations.filter(e => e.evaluationType === 'first_impression').length;
  const decisionStations = evaluations.filter(e => e.evaluationType === 'decision_station').length;

  const confirmed = evaluations.filter(e => e.finalDecision === 'confirmed').length;
  const terminated = evaluations.filter(e => e.finalDecision === 'terminated').length;

  // Gender distribution
  const males = employees.filter(e => e.gender === 'ذكر').length;
  const females = employees.filter(e => e.gender === 'أنثى').length;

  // Location distribution
  const locationDist: Record<string, number> = {};
  for (const emp of employees) {
    if (emp.currentLocation) {
      locationDist[emp.currentLocation] = (locationDist[emp.currentLocation] || 0) + 1;
    }
  }

  // Nationality distribution
  const nationalityDist: Record<string, number> = {};
  for (const emp of employees) {
    if (emp.nationality) {
      nationalityDist[emp.nationality] = (nationalityDist[emp.nationality] || 0) + 1;
    }
  }

  return {
    totalEmployees,
    departmentCount: departments.length,
    teamCount: teams.length,
    avgServiceYears: Math.round(avgServiceYears * 10) / 10,
    leaders,
    inProbation,
    totalEvaluations,
    firstImpressions,
    decisionStations,
    confirmed,
    terminated,
    genderDistribution: { male: males, female: females },
    locationDistribution: locationDist,
    nationalityDistribution: nationalityDist,
  };
}

export function getEvaluationInsights(evaluations: Evaluation[]) {
  const decisionEvals = evaluations.filter(e => e.evaluationType === 'decision_station');

  // Average scores per criteria
  const criteriaAvgs: Record<string, { total: number; count: number }> = {};
  const criteriaLabels: Record<string, string> = {
    performance: 'الأداء والجودة',
    independence: 'الاستقلالية والاعتمادية',
    commitment: 'الالتزام والانضباط',
    collaboration: 'التفاعل والتعاون',
    values: 'القيم وثقافة ثمانية',
    learningResponse: 'التعلّم والاستجابة',
    responsibility: 'المسؤولية والمبادرة',
    impact: 'الأثر والإضافة',
    readiness: 'الجاهزية للمرحلة القادمة',
  };

  for (const ev of decisionEvals) {
    if (!ev.decisionStationScores) continue;
    for (const [key, value] of Object.entries(ev.decisionStationScores)) {
      if (value > 0) {
        if (!criteriaAvgs[key]) criteriaAvgs[key] = { total: 0, count: 0 };
        criteriaAvgs[key].total += value;
        criteriaAvgs[key].count += 1;
      }
    }
  }

  const criteriaBreakdown = Object.entries(criteriaAvgs).map(([key, { total, count }]) => ({
    key,
    label: criteriaLabels[key] || key,
    average: Math.round((total / count) * 10) / 10,
    count,
  })).sort((a, b) => b.average - a.average);

  // Traffic light distribution
  const trafficLightDist: Record<string, number> = {};
  for (const ev of evaluations) {
    if (ev.trafficLight) {
      trafficLightDist[ev.trafficLight] = (trafficLightDist[ev.trafficLight] || 0) + 1;
    }
  }

  // Decision distribution
  const decisionDist: Record<string, number> = { confirmed: 0, terminated: 0, pending: 0 };
  for (const ev of evaluations) {
    if (ev.finalDecision === 'confirmed') decisionDist.confirmed++;
    else if (ev.finalDecision === 'terminated') decisionDist.terminated++;
    else if (ev.evaluationType === 'decision_station') decisionDist.pending++;
  }

  return {
    criteriaBreakdown,
    trafficLightDist,
    decisionDist,
    totalDecisionEvals: decisionEvals.length,
  };
}
