import * as XLSX from 'xlsx';
import { Employee, Evaluation, PerformanceReview, LeaderEvaluation, FileType, ParseResult } from './types';
import { parseScoreFromText, parseTrafficLight, parseFinalDecision } from './scoring';

// ── Column mappings ──

const EMPLOYEE_COLUMN_MAP: Record<string, keyof Employee> = {
  'الاسم': 'name',
  'الاسم المفضّل': 'preferredName',
  'الإدارة': 'department',
  'الفريق': 'team',
  'المستوى': 'level',
  'المسمّى الوظيفي بالعربي': 'jobTitleAr',
  'المسمّى الوظيفي بالإنقليزي': 'jobTitleEn',
  'المدير المباشر': 'manager',
  'المكتب': 'office',
  'تاريخ المباشرة': 'startDate',
  'الموقع الحالي': 'currentLocation',
  'نوع الدوام': 'workType',
  'في الفترة التجريبية؟': 'inProbation',
  'تاريخ آخر ترقية/علاوة': 'lastPromotionDate',
  'عدد أشهر الخدمة': 'serviceMonths',
  'عدد سنوات الخدمة': 'serviceYears',
  'العقد الحالي': 'currentContract',
  'الأيام المتبقية لإنتهاء العقد': 'contractDaysRemaining',
  'تاريخ انتهاء العقد': 'contractEndDate',
  'قائد': 'isLeader',
  'التقييم العام': 'overallRating',
  'الجنس': 'gender',
  'الجنسية': 'nationality',
  'تاريخ الميلاد': 'birthDate',
  'العمر': 'age',
  'رقم الجوال': 'phone',
  'بريد العمل': 'workEmail',
  'البريد الشخصي': 'personalEmail',
};

const EMPLOYEE_KEYWORDS = ['الاسم', 'الإدارة', 'الفريق', 'المستوى', 'المسمّى الوظيفي'];
const EVALUATION_KEYWORDS = ['اسم الموظف', 'النتيجة', 'القرار', 'الانطباع', 'التفاعل والبداية', 'الأداء والجودة'];
const REVIEW_KEYWORDS = ['الدرب العام', 'درجة_الدرب_العام', 'القائد المباشر', 'درب القيادة', 'كيف جودة المخرجات'];
const LEADER_KEYWORDS = ['أود تقييم', 'مُديري فعّال', 'مُديري يحدد الأولويات', 'متوسط التقييم'];

const EVAL_COLUMNS = {
  submissionId: 'Submission ID',
  respondentId: 'Respondent ID',
  submittedAt: 'Submitted at',
  evaluationType: 'اخـتر الــنوع',
  evaluatorName: 'اسمك',
  employeeName: 'اسم الموظف',
  fi_interaction: '1. التفاعل والبداية',
  fi_independence: '2. الاستقلالية والتعلم',
  fi_communication: '3. التواصل والتعاون',
  fi_teamIntegration: '4. الاندماج مع الفريق ورفيق البداية',
  fi_toolIntegration: '4. الاندماج في أدوات العمل والتواصل',
  fi_overallImpression: '5. الانطباع العام',
  ds_performance: '1. الأداء والجودة',
  ds_independence: '2. الاستقلالية والاعتمادية',
  ds_commitment: '3. الالتزام والانضباط',
  ds_collaboration: '4. التفاعل والتعاون',
  ds_values: '5. القيم وثقافة ثمانية',
  ds_learningResponse: '6. التعلّم والاستجابة للملاحظات',
  ds_responsibility: '7. المسؤولية والمبادرة',
  ds_impact: '8. الأثر والإضافة',
  ds_readiness: '9. الجاهزية للمرحلة القادمة',
  mp_performance: '1. التطور في الأداء والمخرجات',
  mp_independence: '2. الاستقلالية والمسؤولية',
  mp_learning: '3. التعلّم والاستجابة للملاحظات',
  mp_interaction: '4. التفاعل والعلاقات داخل الفريق',
  mp_commitment: '5. الالتزام والمسؤولية',
  mp_values: '6. القيم وثقافة ثمانية',
  previousTargets: 'المستهدفات السابقة',
  nextTargets: 'المستهدفات القادمة',
  startFeedback: 'ابدأ',
  stopFeedback: 'توقف',
  continueFeedback: 'استمر',
  openComments: 'مساحة مفتوحة',
  trafficLight: 'النتيجة',
  decisionDirection: 'بوادر القرار',
  finalDecision: 'القرار',
  additionalNotes: 'Untitled long answer field',
};

function detectFileType(headers: string[]): FileType {
  const headerStr = headers.join(' ');

  // Check for leader evaluations first
  const leaderMatches = LEADER_KEYWORDS.filter(kw => headerStr.includes(kw)).length;
  if (leaderMatches >= 2) return 'leaders';

  // Check for Ananas reviews (most specific)
  const reviewMatches = REVIEW_KEYWORDS.filter(kw => headerStr.includes(kw)).length;
  if (reviewMatches >= 2) return 'reviews';

  const employeeMatches = EMPLOYEE_KEYWORDS.filter(kw => headerStr.includes(kw)).length;
  const evalMatches = EVALUATION_KEYWORDS.filter(kw => headerStr.includes(kw)).length;

  if (employeeMatches >= 3) return 'employees';
  if (evalMatches >= 2) return 'evaluations';

  if (headers.some(h => h && h.includes('الإدارة')) && headers.some(h => h && h.includes('الفريق'))) {
    return 'employees';
  }
  if (headers.some(h => h && h.includes('اسم الموظف')) || headers.some(h => h && h.includes('النتيجة'))) {
    return 'evaluations';
  }

  return 'unknown';
}

function findColumnIndex(headers: string[], search: string): number {
  return headers.findIndex(h => h && (h.includes(search) || h.trim() === search.trim()));
}

function getCellValue(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const val = row[index];
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/** Convert Excel serial date number to readable date string (YYYY-MM-DD) */
function excelDateToString(val: string): string {
  if (!val) return '';
  const num = parseFloat(val);
  // Excel serial dates are typically > 30000 and < 60000 for modern dates
  if (!isNaN(num) && num > 25000 && num < 70000) {
    // Excel epoch is 1900-01-01 but has a leap year bug (day 0 = 1899-12-30)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return val;
}

/**
 * Parse Ananas review score cells which may contain "score,comment" format.
 * E.g. "4,الشكل الحالي للمبادرة عندك أحمد رهيب" → { score: 4, comment: "..." }
 */
function parseReviewScoreCell(text: string): { score: number; comment: string } {
  if (!text) return { score: 0, comment: '' };
  const trimmed = text.trim();

  // Check if it's a plain number
  const plainNum = parseInt(trimmed);
  if (!isNaN(plainNum) && String(plainNum) === trimmed) {
    return { score: plainNum, comment: '' };
  }

  // Check for "number,comment" format
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx > 0 && commaIdx <= 2) {
    const numPart = trimmed.substring(0, commaIdx).trim();
    const commentPart = trimmed.substring(commaIdx + 1).trim();
    const num = parseInt(numPart);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      return { score: num, comment: commentPart };
    }
  }

  // Try to extract leading number
  const match = trimmed.match(/^(\d+)/);
  if (match) {
    return { score: parseInt(match[1]), comment: trimmed.substring(match[0].length).replace(/^[,\s]+/, '') };
  }

  return { score: 0, comment: trimmed };
}

/** Parse the track label to a standard name */
function parseTrackLabel(text: string): string {
  if (!text) return '';
  if (text.includes('فخر')) return 'فخر';
  if (text.includes('خضر')) return 'خضر';
  if (text.includes('صفر')) return 'صفر';
  if (text.includes('حمر')) return 'حمر';
  if (text.includes('خطر')) return 'خطر';
  return text;
}

function parseEmployees(data: unknown[][]): Employee[] {
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const employees: Employee[] = [];

  const colMap: Record<string, number> = {};
  for (const [arabic, english] of Object.entries(EMPLOYEE_COLUMN_MAP)) {
    const idx = findColumnIndex(headers, arabic);
    if (idx >= 0) colMap[english] = idx;
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const name = getCellValue(row, colMap['name'] ?? -1);
    if (!name) continue;

    const inProbationVal = getCellValue(row, colMap['inProbation'] ?? -1);
    const isLeaderVal = getCellValue(row, colMap['isLeader'] ?? -1);

    employees.push({
      id: `emp-${i}`,
      name,
      preferredName: getCellValue(row, colMap['preferredName'] ?? -1) || name,
      department: getCellValue(row, colMap['department'] ?? -1),
      team: getCellValue(row, colMap['team'] ?? -1),
      level: parseInt(getCellValue(row, colMap['level'] ?? -1)) || 0,
      jobTitleAr: getCellValue(row, colMap['jobTitleAr'] ?? -1),
      jobTitleEn: getCellValue(row, colMap['jobTitleEn'] ?? -1),
      manager: getCellValue(row, colMap['manager'] ?? -1),
      office: getCellValue(row, colMap['office'] ?? -1),
      startDate: excelDateToString(getCellValue(row, colMap['startDate'] ?? -1)),
      currentLocation: getCellValue(row, colMap['currentLocation'] ?? -1),
      workType: getCellValue(row, colMap['workType'] ?? -1),
      inProbation: inProbationVal === 'نعم' || inProbationVal === 'TRUE' || inProbationVal === 'true',
      lastPromotionDate: excelDateToString(getCellValue(row, colMap['lastPromotionDate'] ?? -1)),
      serviceMonths: parseInt(getCellValue(row, colMap['serviceMonths'] ?? -1)) || 0,
      serviceYears: parseInt(getCellValue(row, colMap['serviceYears'] ?? -1)) || 0,
      currentContract: excelDateToString(getCellValue(row, colMap['currentContract'] ?? -1)),
      contractDaysRemaining: parseInt(getCellValue(row, colMap['contractDaysRemaining'] ?? -1)) || 0,
      contractEndDate: excelDateToString(getCellValue(row, colMap['contractEndDate'] ?? -1)),
      isLeader: isLeaderVal === 'TRUE' || isLeaderVal === 'true',
      overallRating: getCellValue(row, colMap['overallRating'] ?? -1),
      gender: getCellValue(row, colMap['gender'] ?? -1),
      nationality: getCellValue(row, colMap['nationality'] ?? -1),
      birthDate: excelDateToString(getCellValue(row, colMap['birthDate'] ?? -1)),
      age: parseInt(getCellValue(row, colMap['age'] ?? -1)) || 0,
      phone: getCellValue(row, colMap['phone'] ?? -1),
      workEmail: getCellValue(row, colMap['workEmail'] ?? -1),
      personalEmail: getCellValue(row, colMap['personalEmail'] ?? -1),
    });
  }

  return employees;
}

function parseEvaluations(data: unknown[][]): Evaluation[] {
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const evaluations: Evaluation[] = [];

  const colIdx: Record<string, number> = {};
  for (const [key, search] of Object.entries(EVAL_COLUMNS)) {
    const cleanSearch = search.replace(/[🎯🚀🏁🚦✅⚖️]/g, '').trim();
    const idx = headers.findIndex(h => {
      if (!h) return false;
      const cleanH = h.replace(/[🎯🚀🏁🚦✅⚖️]/g, '').trim();
      return cleanH.includes(cleanSearch) || cleanSearch.includes(cleanH);
    });
    colIdx[key] = idx;
  }

  if (colIdx.submissionId < 0) colIdx.submissionId = findColumnIndex(headers, 'Submission ID');
  if (colIdx.submittedAt < 0) colIdx.submittedAt = findColumnIndex(headers, 'Submitted at');
  if (colIdx.evaluatorName < 0) colIdx.evaluatorName = findColumnIndex(headers, 'اسمك');
  if (colIdx.employeeName < 0) colIdx.employeeName = findColumnIndex(headers, 'اسم الموظف');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const employeeName = getCellValue(row, colIdx.employeeName);
    if (!employeeName) continue;

    const typeText = getCellValue(row, colIdx.evaluationType);
    const isFirstImpression = typeText.includes('الانطباع الأول') || typeText.includes('الأسبوعين');
    const evaluationType = isFirstImpression ? 'first_impression' as const : 'decision_station' as const;

    const trafficLightText = getCellValue(row, colIdx.trafficLight);
    const { score: trafficLightScore, label: trafficLightLabel } = parseTrafficLight(trafficLightText);

    const finalDecisionText = getCellValue(row, colIdx.finalDecision);
    const finalDecision = parseFinalDecision(finalDecisionText);

    const evaluation: Evaluation = {
      id: `eval-${i}`,
      submissionId: getCellValue(row, colIdx.submissionId),
      submittedAt: getCellValue(row, colIdx.submittedAt),
      evaluationType,
      evaluatorName: getCellValue(row, colIdx.evaluatorName),
      employeeName,
      previousTargets: getCellValue(row, colIdx.previousTargets),
      nextTargets: getCellValue(row, colIdx.nextTargets),
      startFeedback: getCellValue(row, colIdx.startFeedback),
      stopFeedback: getCellValue(row, colIdx.stopFeedback),
      continueFeedback: getCellValue(row, colIdx.continueFeedback),
      openComments: getCellValue(row, colIdx.openComments),
      trafficLight: trafficLightLabel,
      trafficLightScore,
      decisionDirection: getCellValue(row, colIdx.decisionDirection),
      finalDecision,
      additionalNotes: getCellValue(row, colIdx.additionalNotes),
    };

    if (isFirstImpression) {
      evaluation.firstImpressionScores = {
        interaction: parseScoreFromText(getCellValue(row, colIdx.fi_interaction)),
        independence: parseScoreFromText(getCellValue(row, colIdx.fi_independence)),
        communication: parseScoreFromText(getCellValue(row, colIdx.fi_communication)),
        teamIntegration: parseScoreFromText(getCellValue(row, colIdx.fi_teamIntegration)),
        toolIntegration: parseScoreFromText(getCellValue(row, colIdx.fi_toolIntegration)),
        overallImpression: parseScoreFromText(getCellValue(row, colIdx.fi_overallImpression)),
      };
    } else {
      evaluation.decisionStationScores = {
        performance: parseScoreFromText(getCellValue(row, colIdx.ds_performance)) ||
                     parseScoreFromText(getCellValue(row, colIdx.mp_performance)),
        independence: parseScoreFromText(getCellValue(row, colIdx.ds_independence)) ||
                      parseScoreFromText(getCellValue(row, colIdx.mp_independence)),
        commitment: parseScoreFromText(getCellValue(row, colIdx.ds_commitment)) ||
                    parseScoreFromText(getCellValue(row, colIdx.mp_commitment)),
        collaboration: parseScoreFromText(getCellValue(row, colIdx.ds_collaboration)) ||
                       parseScoreFromText(getCellValue(row, colIdx.mp_interaction)),
        values: parseScoreFromText(getCellValue(row, colIdx.ds_values)) ||
                parseScoreFromText(getCellValue(row, colIdx.mp_values)),
        learningResponse: parseScoreFromText(getCellValue(row, colIdx.ds_learningResponse)) ||
                          parseScoreFromText(getCellValue(row, colIdx.mp_learning)),
        responsibility: parseScoreFromText(getCellValue(row, colIdx.ds_responsibility)),
        impact: parseScoreFromText(getCellValue(row, colIdx.ds_impact)),
        readiness: parseScoreFromText(getCellValue(row, colIdx.ds_readiness)),
      };
    }

    evaluations.push(evaluation);
  }

  return evaluations;
}

function parseReviews(data: unknown[][]): PerformanceReview[] {
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const reviews: PerformanceReview[] = [];

  const col = (search: string) => findColumnIndex(headers, search);

  const c = {
    employeeName: col('اسم الموظف'),
    directLeader: col('القائد المباشر'),
    managerOfManager: col('مدير المدير'),
    employeeNumber: col('رقم_الموظف'),
    reviewNumber: col('رقم التقييم'),
    station: col('المحطة'),
    generalTrack: col('الدرب العام'),
    generalTrackScore: col('درجة_الدرب_العام'),
    generalTrackPercent: col('نسبة الدرب العام'),
    leadershipTrack: col('درب القيادة'),
    leadershipTrackScore: col('درجة_درب_القيادة'),
    leadershipPercent: col('نسبة القيادة'),
    metExpectations: col('حقق التوقعات'),
    outputQuality: col('كيف جودة المخرجات'),
    timeDiscipline: col('كيف الإنضباط مع الوقت'),
    basecampUsage: col('كيفه مع بيسكامب'),
    initiative: col('كيف حس المبادرة'),
    efficiency: col('كيف كفاءة الموظف'),
    dependability: col('كيف تعتمد عليه'),
    professionalDev: col('كيف تطوره المهني'),
    overallTrack: col('كيف تقيم درب الموظف'),
    decisionMaking: col('كيف يتخذ القرارات'),
    teamBuilding: col('كيف يبني الفريق'),
    goalSetting: col('كيف يبني الأهداف'),
    teamLeadership: col('كيف يقود الفريق'),
    reviewStatus: col('حالة_التقييم'),
    season: col('الموسم'),
    reviewDate: col('تاريخ_التقييم'),
    managerComments1: col('تعليقات_المدير'),
    managerComments2: col('تعليقات المدير'),
    hrComments: col('التعليقات للموارد البشرية'),
    leadershipPotential: col('إمكانية القيادة'),
    retainEmployee: col('هل تتمسك بالموظف'),
    employeeEmail: col('بريد الموظف'),
    isLeader: col('هل هو قائد'),
    isHrTeam: col('من_فريق_الموارد_البشرية'),
    inProbation: col('في فترة التجربة'),
    reviewType: col('نوع_التقييم'),
    managerApprovalDate: col('تاريخ اعتماد المدير'),
    hrApprovalDate: col('تاريخ اعتماد الموارد البشرية'),
    rejectionReason: col('سبب الرفض'),
    reportSentDate: col('تاريخ ارسال التقرير'),
    department: col('القسم'),
    jobTitle: col('المسمى الوظيفي'),
    team: col('الفريق'),
    level: col('المستوى'),
    office: col('المكتب'),
    currentLocation: col('الموقع الحالي'),
    employmentType: col('نوع_التوظيف'),
    gender: col('الجنس'),
    nationality: col('الجنسية'),
    joinDate: col('تاريخ_الانضمام'),
    matched: col('متطابق'),
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const employeeName = getCellValue(row, c.employeeName);
    if (!employeeName) continue;

    const oq = parseReviewScoreCell(getCellValue(row, c.outputQuality));
    const td = parseReviewScoreCell(getCellValue(row, c.timeDiscipline));
    const bu = parseReviewScoreCell(getCellValue(row, c.basecampUsage));
    const init = parseReviewScoreCell(getCellValue(row, c.initiative));
    const eff = parseReviewScoreCell(getCellValue(row, c.efficiency));
    const dep = parseReviewScoreCell(getCellValue(row, c.dependability));
    const pd = parseReviewScoreCell(getCellValue(row, c.professionalDev));
    const ot = parseReviewScoreCell(getCellValue(row, c.overallTrack));

    const dm = parseReviewScoreCell(getCellValue(row, c.decisionMaking));
    const tb = parseReviewScoreCell(getCellValue(row, c.teamBuilding));
    const gs = parseReviewScoreCell(getCellValue(row, c.goalSetting));
    const tl = parseReviewScoreCell(getCellValue(row, c.teamLeadership));

    const managerComment1 = getCellValue(row, c.managerComments1);
    const managerComment2 = getCellValue(row, c.managerComments2);

    const isLeaderVal = getCellValue(row, c.isLeader);
    const hasLeadershipScores = dm.score > 0 || tb.score > 0 || gs.score > 0 || tl.score > 0;

    reviews.push({
      id: `rev-${i}`,
      employeeName,
      directLeader: getCellValue(row, c.directLeader),
      managerOfManager: getCellValue(row, c.managerOfManager),
      employeeNumber: getCellValue(row, c.employeeNumber),
      reviewNumber: getCellValue(row, c.reviewNumber),
      station: getCellValue(row, c.station),
      generalTrack: parseTrackLabel(getCellValue(row, c.generalTrack)),
      generalTrackScore: parseInt(getCellValue(row, c.generalTrackScore)) || 0,
      generalTrackPercent: parseFloat(getCellValue(row, c.generalTrackPercent)) || 0,
      leadershipTrack: parseTrackLabel(getCellValue(row, c.leadershipTrack)),
      leadershipTrackScore: parseInt(getCellValue(row, c.leadershipTrackScore)) || 0,
      leadershipPercent: parseFloat(getCellValue(row, c.leadershipPercent)) || 0,
      metExpectations: getCellValue(row, c.metExpectations),
      performanceScores: {
        outputQuality: oq.score,
        timeDiscipline: td.score,
        basecampUsage: bu.score,
        initiative: init.score,
        efficiency: eff.score,
        dependability: dep.score,
        professionalDev: pd.score,
        overallTrack: ot.score,
      },
      performanceComments: {
        outputQuality: oq.comment,
        timeDiscipline: td.comment,
        basecampUsage: bu.comment,
        initiative: init.comment,
        efficiency: eff.comment,
        dependability: dep.comment,
        professionalDev: pd.comment,
        overallTrack: ot.comment,
        decisionMaking: dm.comment,
        teamBuilding: tb.comment,
        goalSetting: gs.comment,
        teamLeadership: tl.comment,
      },
      leadershipScores: hasLeadershipScores ? {
        decisionMaking: dm.score,
        teamBuilding: tb.score,
        goalSetting: gs.score,
        teamLeadership: tl.score,
      } : undefined,
      reviewStatus: getCellValue(row, c.reviewStatus),
      season: getCellValue(row, c.season),
      reviewDate: excelDateToString(getCellValue(row, c.reviewDate)),
      managerComments: managerComment2 || managerComment1,
      hrComments: getCellValue(row, c.hrComments),
      leadershipPotential: getCellValue(row, c.leadershipPotential),
      retainEmployee: getCellValue(row, c.retainEmployee),
      employeeEmail: getCellValue(row, c.employeeEmail),
      isLeader: isLeaderVal === 'نعم' || isLeaderVal === 'TRUE' || isLeaderVal === 'true',
      isHrTeam: getCellValue(row, c.isHrTeam) === 'نعم',
      inProbation: getCellValue(row, c.inProbation) === 'نعم',
      reviewType: getCellValue(row, c.reviewType),
      managerApprovalDate: excelDateToString(getCellValue(row, c.managerApprovalDate)),
      hrApprovalDate: excelDateToString(getCellValue(row, c.hrApprovalDate)),
      rejectionReason: getCellValue(row, c.rejectionReason),
      reportSentDate: excelDateToString(getCellValue(row, c.reportSentDate)),
      department: getCellValue(row, c.department),
      jobTitle: getCellValue(row, c.jobTitle),
      team: getCellValue(row, c.team),
      level: parseInt(getCellValue(row, c.level)) || 0,
      office: getCellValue(row, c.office),
      currentLocation: getCellValue(row, c.currentLocation),
      employmentType: getCellValue(row, c.employmentType),
      gender: getCellValue(row, c.gender),
      nationality: getCellValue(row, c.nationality),
      joinDate: excelDateToString(getCellValue(row, c.joinDate)),
      matched: getCellValue(row, c.matched),
    });
  }

  return reviews;
}

function parseLeaders(data: unknown[][]): LeaderEvaluation[] {
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const leaders: LeaderEvaluation[] = [];

  const col = (search: string) => findColumnIndex(headers, search);

  const c = {
    submissionId: col('Submission ID'),
    submittedAt: col('Submitted at'),
    evaluatorName: col('أنا'),
    leaderName: col('أود تقييم'),
    communication: col('مُديري فعّال في توصيل'),
    prioritization: col('مُديري يحدد الأولويات'),
    decisionMaking: col('مُديري يتخذ قرارات'),
    goalSetting: col('مُديري يبني ويضع أهداف'),
    clarityComments: headers.findIndex(h => h && h.includes('الوضوح والأولويات')),
    empowerment: col('مُديري يُمكّن'),
    delegation: col('مُديري يحسن في تفويض'),
    support: col('مُديري يقدم يد العون'),
    emotionalIntelligence: col('مُديري لديه وعي ذاتي'),
    workMethodComments: headers.findIndex(h => h && h.includes('طريقة العمل')),
    morale: col('مُديري يؤثر في معنويات'),
    collaboration: col('مُديري يشجع ويسهل التعاون'),
    environment: col('مُديري يعمل على تعزيز بيئة'),
    inclusion: col('مُديري يُشرك الفريق'),
    teamLeadershipComments: headers.findIndex(h => h && h.includes('قيادة الفريق')),
    development: col('مُديري يستثمر وقتاً'),
    feedback: col('مُديري يشاركني مرئيات'),
    performance: col('مُديري يساهم في رفع'),
    creativity: col('مُديري يشجع ويدعم التفكير'),
    developmentComments: headers.findIndex(h => h && h.includes('الدعم والتطوير')),
    generalComments: headers.findIndex(h => h && h.includes('تودّ مشاركته مع مديرك')),
    hrComments: headers.findIndex(h => h && h.includes('مع الموارد البشرية')),
    averageScore: col('متوسط التقييم'),
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const leaderName = getCellValue(row, c.leaderName);
    if (!leaderName) continue;

    const getNum = (idx: number) => parseFloat(getCellValue(row, idx)) || 0;

    leaders.push({
      id: `ldr-${i}`,
      submissionId: getCellValue(row, c.submissionId),
      submittedAt: getCellValue(row, c.submittedAt),
      evaluatorName: getCellValue(row, c.evaluatorName),
      leaderName,
      communication: getNum(c.communication),
      prioritization: getNum(c.prioritization),
      decisionMaking: getNum(c.decisionMaking),
      goalSetting: getNum(c.goalSetting),
      clarityComments: getCellValue(row, c.clarityComments),
      empowerment: getNum(c.empowerment),
      delegation: getNum(c.delegation),
      support: getNum(c.support),
      emotionalIntelligence: getNum(c.emotionalIntelligence),
      workMethodComments: getCellValue(row, c.workMethodComments),
      morale: getNum(c.morale),
      collaboration: getNum(c.collaboration),
      environment: getNum(c.environment),
      inclusion: getNum(c.inclusion),
      teamLeadershipComments: getCellValue(row, c.teamLeadershipComments),
      development: getNum(c.development),
      feedback: getNum(c.feedback),
      performance: getNum(c.performance),
      creativity: getNum(c.creativity),
      developmentComments: getCellValue(row, c.developmentComments),
      generalComments: getCellValue(row, c.generalComments),
      hrComments: getCellValue(row, c.hrComments),
      averageScore: getNum(c.averageScore),
    });
  }

  return leaders;
}

export function parseBuffer(buffer: ArrayBuffer): ParseResult {
  try {
    // Detect if this is a CSV/text file (not XLSX/XLS which start with PK or other binary signatures)
    const bytes = new Uint8Array(buffer);
    const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B; // PK signature (ZIP/XLSX)
    const isXls = bytes[0] === 0xD0 && bytes[1] === 0xCF;  // OLE2 signature (XLS)

    let workbook: XLSX.WorkBook;
    if (!isXlsx && !isXls) {
      // CSV/text file — decode as UTF-8 first to preserve Arabic text
      const text = new TextDecoder('utf-8').decode(buffer);
      workbook = XLSX.read(text, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'array' });
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

    if (data.length === 0) {
      return { type: 'unknown', error: 'الملف فارغ' };
    }

    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 5); i++) {
      const row = data[i];
      if (row && row.length > 3 && row.some(c => c && String(c).trim().length > 0)) {
        const rowStr = row.map(c => String(c || '')).join(' ');
        if (rowStr.includes('الاسم') || rowStr.includes('Submission') || rowStr.includes('اسم الموظف')) {
          headerRowIdx = i;
          break;
        }
      }
    }

    const actualData = data.slice(headerRowIdx);
    const headers = actualData[0].map(h => String(h || ''));
    const fileType = detectFileType(headers);

    switch (fileType) {
      case 'employees':
        return { type: 'employees', employees: parseEmployees(actualData) };
      case 'evaluations':
        return { type: 'evaluations', evaluations: parseEvaluations(actualData) };
      case 'reviews':
        return { type: 'reviews', reviews: parseReviews(actualData) };
      case 'leaders':
        return { type: 'leaders', leaders: parseLeaders(actualData) };
      default:
        return { type: 'unknown', error: 'لم يتم التعرف على نوع الملف' };
    }
  } catch {
    return { type: 'unknown', error: 'خطأ في قراءة الملف' };
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

    if (data.length === 0) {
      return { type: 'unknown', error: 'الملف فارغ' };
    }

    // Some files have an empty first row; find the actual header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 5); i++) {
      const row = data[i];
      if (row && row.length > 3 && row.some(c => c && String(c).trim().length > 0)) {
        const rowStr = row.map(c => String(c || '')).join(' ');
        if (rowStr.includes('الاسم') || rowStr.includes('Submission') || rowStr.includes('اسم الموظف')) {
          headerRowIdx = i;
          break;
        }
      }
    }

    const actualData = data.slice(headerRowIdx);
    const headers = actualData[0].map(h => String(h || ''));
    const fileType = detectFileType(headers);

    switch (fileType) {
      case 'employees':
        return { type: 'employees', employees: parseEmployees(actualData) };
      case 'evaluations':
        return { type: 'evaluations', evaluations: parseEvaluations(actualData) };
      case 'reviews':
        return { type: 'reviews', reviews: parseReviews(actualData) };
      case 'leaders':
        return { type: 'leaders', leaders: parseLeaders(actualData) };
      default:
        return { type: 'unknown', error: 'لم يتم التعرف على نوع الملف. تأكد من أن الملف يحتوي على البيانات الصحيحة.' };
    }
  } catch {
    return { type: 'unknown', error: 'حدث خطأ أثناء قراءة الملف. تأكد من صحة الملف.' };
  }
}
