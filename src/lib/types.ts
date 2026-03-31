export interface Employee {
  id: string;
  name: string;
  preferredName: string;
  department: string;
  team: string;
  level: number;
  jobTitleAr: string;
  jobTitleEn: string;
  manager: string;
  office: string;
  startDate: string;
  currentLocation: string;
  workType: string;
  inProbation: boolean;
  lastPromotionDate: string;
  serviceMonths: number;
  serviceYears: number;
  currentContract: string;
  contractDaysRemaining: number;
  contractEndDate: string;
  isLeader: boolean;
  overallRating: string;
  gender: string;
  nationality: string;
  birthDate: string;
  age: number;
  phone: string;
  workEmail: string;
  personalEmail: string;
}

export type EvaluationType = 'first_impression' | 'decision_station';

export interface FirstImpressionScores {
  interaction: number;
  independence: number;
  communication: number;
  teamIntegration: number;
  toolIntegration: number;
  overallImpression: number;
}

export interface DecisionStationScores {
  performance: number;
  independence: number;
  commitment: number;
  collaboration: number;
  values: number;
  learningResponse: number;
  responsibility: number;
  impact: number;
  readiness: number;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  submittedAt: string;
  evaluationType: EvaluationType;
  evaluatorName: string;
  employeeName: string;
  firstImpressionScores?: FirstImpressionScores;
  decisionStationScores?: DecisionStationScores;
  previousTargets: string;
  nextTargets: string;
  startFeedback: string;
  stopFeedback: string;
  continueFeedback: string;
  openComments: string;
  trafficLight: string;
  trafficLightScore: number;
  decisionDirection: string;
  finalDecision: string;
  additionalNotes: string;
}

// ── Ananas Performance Reviews ──

export interface PerformanceScores {
  outputQuality: number;
  timeDiscipline: number;
  basecampUsage: number;
  initiative: number;
  efficiency: number;
  dependability: number;
  professionalDev: number;
  overallTrack: number;
}

export interface LeadershipScores {
  decisionMaking: number;
  teamBuilding: number;
  goalSetting: number;
  teamLeadership: number;
}

export interface PerformanceScoreComment {
  score: number;
  comment: string;
}

export interface PerformanceReview {
  id: string;
  employeeName: string;
  directLeader: string;
  managerOfManager: string;
  employeeNumber: string;
  reviewNumber: string;
  station: string;
  generalTrack: string;
  generalTrackScore: number;
  generalTrackPercent: number;
  leadershipTrack: string;
  leadershipTrackScore: number;
  leadershipPercent: number;
  metExpectations: string;
  performanceScores: PerformanceScores;
  performanceComments: Record<string, string>;
  leadershipScores?: LeadershipScores;
  reviewStatus: string;
  season: string;
  reviewDate: string;
  managerComments: string;
  hrComments: string;
  leadershipPotential: string;
  retainEmployee: string;
  employeeEmail: string;
  isLeader: boolean;
  isHrTeam: boolean;
  inProbation: boolean;
  reviewType: string;
  managerApprovalDate: string;
  hrApprovalDate: string;
  rejectionReason: string;
  reportSentDate: string;
  department: string;
  jobTitle: string;
  team: string;
  level: number;
  office: string;
  currentLocation: string;
  employmentType: string;
  gender: string;
  nationality: string;
  joinDate: string;
  matched: string;
}

export type FileType = 'employees' | 'evaluations' | 'reviews' | 'unknown';

export interface ParseResult {
  type: FileType;
  employees?: Employee[];
  evaluations?: Evaluation[];
  reviews?: PerformanceReview[];
  error?: string;
}

export interface DepartmentStats {
  name: string;
  employeeCount: number;
  avgServiceYears: number;
  avgAge: number;
  leaderCount: number;
  genderDistribution: { male: number; female: number };
  nationalityDistribution: Record<string, number>;
  teams: string[];
  evaluationCount: number;
  avgScore: number;
  probationPassRate: number;
}

export interface PlatformData {
  employees: Employee[];
  evaluations: Evaluation[];
  reviews: PerformanceReview[];
}

// ── Access Control ──

export type UserRole = 'admin' | 'hr' | 'manager' | 'viewer';

export interface UserSession {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  hr: 'الموارد البشرية',
  manager: 'مدير',
  viewer: 'مشاهد',
};

export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewAllEmployees: boolean;
  canViewReviews: boolean;
  canViewHrComments: boolean;
  canViewSalaryInfo: boolean;
  canUploadData: boolean;
  canManageAccess: boolean;
  departmentOnly: boolean;
}> = {
  admin: {
    canViewAllEmployees: true,
    canViewReviews: true,
    canViewHrComments: true,
    canViewSalaryInfo: true,
    canUploadData: true,
    canManageAccess: true,
    departmentOnly: false,
  },
  hr: {
    canViewAllEmployees: true,
    canViewReviews: true,
    canViewHrComments: true,
    canViewSalaryInfo: true,
    canUploadData: true,
    canManageAccess: false,
    departmentOnly: false,
  },
  manager: {
    canViewAllEmployees: false,
    canViewReviews: true,
    canViewHrComments: false,
    canViewSalaryInfo: false,
    canUploadData: false,
    canManageAccess: false,
    departmentOnly: true,
  },
  viewer: {
    canViewAllEmployees: false,
    canViewReviews: false,
    canViewHrComments: false,
    canViewSalaryInfo: false,
    canUploadData: false,
    canManageAccess: false,
    departmentOnly: true,
  },
};
