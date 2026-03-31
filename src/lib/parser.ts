import * as XLSX from 'xlsx';
import { Employee, Evaluation, FileType, ParseResult } from './types';
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

// Employee detection keywords
const EMPLOYEE_KEYWORDS = ['الاسم', 'الإدارة', 'الفريق', 'المستوى', 'المسمّى الوظيفي'];

// Evaluation detection keywords
const EVALUATION_KEYWORDS = ['اسم الموظف', 'النتيجة', 'القرار', 'الانطباع', 'التفاعل والبداية', 'الأداء والجودة'];

// Evaluation column indices mapping (based on the provided data structure)
const EVAL_COLUMNS = {
  submissionId: 'Submission ID',
  respondentId: 'Respondent ID',
  submittedAt: 'Submitted at',
  evaluationType: 'اخـتر الــنوع',
  evaluatorName: 'اسمك',
  employeeName: 'اسم الموظف',
  // First Impression scores
  fi_interaction: '1. التفاعل والبداية',
  fi_independence: '2. الاستقلالية والتعلم',
  fi_communication: '3. التواصل والتعاون',
  fi_teamIntegration: '4. الاندماج مع الفريق ورفيق البداية',
  fi_toolIntegration: '4. الاندماج في أدوات العمل والتواصل',
  fi_overallImpression: '5. الانطباع العام',
  // Decision Station scores
  ds_performance: '1. الأداء والجودة',
  ds_independence: '2. الاستقلالية والاعتمادية',
  ds_commitment: '3. الالتزام والانضباط',
  ds_collaboration: '4. التفاعل والتعاون',
  ds_values: '5. القيم وثقافة ثمانية',
  ds_learningResponse: '6. التعلّم والاستجابة للملاحظات',
  ds_responsibility: '7. المسؤولية والمبادرة',
  ds_impact: '8. الأثر والإضافة',
  ds_readiness: '9. الجاهزية للمرحلة القادمة',
  // Mid-period scores (alternative column names)
  mp_performance: '1. التطور في الأداء والمخرجات',
  mp_independence: '2. الاستقلالية والمسؤولية',
  mp_learning: '3. التعلّم والاستجابة للملاحظات',
  mp_interaction: '4. التفاعل والعلاقات داخل الفريق',
  mp_commitment: '5. الالتزام والمسؤولية',
  mp_values: '6. القيم وثقافة ثمانية',
  // Feedback
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

  const employeeMatches = EMPLOYEE_KEYWORDS.filter(kw => headerStr.includes(kw)).length;
  const evalMatches = EVALUATION_KEYWORDS.filter(kw => headerStr.includes(kw)).length;

  if (employeeMatches >= 3) return 'employees';
  if (evalMatches >= 2) return 'evaluations';

  // Fallback: check for specific column names
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

function parseEmployees(data: unknown[][]): Employee[] {
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h || '').trim());
  const employees: Employee[] = [];

  // Build column index map
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
      startDate: getCellValue(row, colMap['startDate'] ?? -1),
      currentLocation: getCellValue(row, colMap['currentLocation'] ?? -1),
      workType: getCellValue(row, colMap['workType'] ?? -1),
      inProbation: inProbationVal === 'نعم' || inProbationVal === 'TRUE' || inProbationVal === 'true',
      lastPromotionDate: getCellValue(row, colMap['lastPromotionDate'] ?? -1),
      serviceMonths: parseInt(getCellValue(row, colMap['serviceMonths'] ?? -1)) || 0,
      serviceYears: parseInt(getCellValue(row, colMap['serviceYears'] ?? -1)) || 0,
      currentContract: getCellValue(row, colMap['currentContract'] ?? -1),
      contractDaysRemaining: parseInt(getCellValue(row, colMap['contractDaysRemaining'] ?? -1)) || 0,
      contractEndDate: getCellValue(row, colMap['contractEndDate'] ?? -1),
      isLeader: isLeaderVal === 'TRUE' || isLeaderVal === 'true',
      overallRating: getCellValue(row, colMap['overallRating'] ?? -1),
      gender: getCellValue(row, colMap['gender'] ?? -1),
      nationality: getCellValue(row, colMap['nationality'] ?? -1),
      birthDate: getCellValue(row, colMap['birthDate'] ?? -1),
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

  // Build column index map for evaluations
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

  // Try exact matching for common columns
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
      // Decision station - try both direct and mid-period columns
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

export async function parseFile(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

    if (data.length === 0) {
      return { type: 'unknown', error: 'الملف فارغ' };
    }

    const headers = data[0].map(h => String(h || ''));
    const fileType = detectFileType(headers);

    switch (fileType) {
      case 'employees':
        return { type: 'employees', employees: parseEmployees(data) };
      case 'evaluations':
        return { type: 'evaluations', evaluations: parseEvaluations(data) };
      default:
        return { type: 'unknown', error: 'لم يتم التعرف على نوع الملف. تأكد من أن الملف يحتوي على البيانات الصحيحة.' };
    }
  } catch {
    return { type: 'unknown', error: 'حدث خطأ أثناء قراءة الملف. تأكد من صحة الملف.' };
  }
}
