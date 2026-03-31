import { Employee } from '@/lib/types';

// Column mapping from Arabic headers to Employee fields
const COL_MAP: Record<string, keyof Employee | '_skip'> = {
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

const INT_FIELDS = new Set<string>(['level', 'serviceMonths', 'serviceYears', 'contractDaysRemaining', 'age']);
const BOOL_TRUE_MAP: Record<string, string> = {
  'inProbation': 'نعم',
  'isLeader': 'TRUE',
};

export function parseStaticTSV(tsv: string): Employee[] {
  const lines = tsv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map(h => h.trim());
  const colIndices: Partial<Record<keyof Employee, number>> = {};

  for (const [i, header] of headers.entries()) {
    const field = COL_MAP[header];
    if (field && field !== '_skip') {
      colIndices[field] = i;
    }
  }

  return lines.slice(1).filter(line => line.trim()).map((line, idx) => {
    const cols = line.split('\t');
    const get = (field: keyof Employee): string => {
      const colIdx = colIndices[field];
      if (colIdx === undefined) return '';
      return (cols[colIdx] || '').trim();
    };

    return {
      id: `emp-${idx + 1}`,
      name: get('name'),
      preferredName: get('preferredName') || get('name'),
      department: get('department'),
      team: get('team'),
      level: parseInt(get('level')) || 0,
      jobTitleAr: get('jobTitleAr'),
      jobTitleEn: get('jobTitleEn'),
      manager: get('manager'),
      office: get('office'),
      startDate: get('startDate'),
      currentLocation: get('currentLocation'),
      workType: get('workType'),
      inProbation: get('inProbation') === 'نعم',
      lastPromotionDate: get('lastPromotionDate'),
      serviceMonths: parseInt(get('serviceMonths')) || 0,
      serviceYears: parseInt(get('serviceYears')) || 0,
      currentContract: get('currentContract'),
      contractDaysRemaining: parseInt(get('contractDaysRemaining')) || 0,
      contractEndDate: get('contractEndDate'),
      isLeader: get('isLeader') === 'TRUE',
      overallRating: get('overallRating'),
      gender: get('gender'),
      nationality: get('nationality'),
      birthDate: get('birthDate'),
      age: parseInt(get('age')) || 0,
      phone: get('phone'),
      workEmail: get('workEmail'),
      personalEmail: get('personalEmail'),
    } as Employee;
  }).filter(e => e.name);
}

// TSV data will be added separately
const EMPLOYEE_TSV = ``;

let _cached: Employee[] | null = null;

export function getStaticEmployees(): Employee[] {
  if (_cached) return _cached;
  _cached = parseStaticTSV(EMPLOYEE_TSV);
  return _cached;
}
