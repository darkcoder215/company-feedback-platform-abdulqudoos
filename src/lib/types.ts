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

export type FileType = 'employees' | 'evaluations' | 'unknown';

export interface ParseResult {
  type: FileType;
  employees?: Employee[];
  evaluations?: Evaluation[];
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
}
