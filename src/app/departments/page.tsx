'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  Users,
  Clock,
  Award,
  TrendingUp,
  Star,
  Shield,
  BarChart3,
  Globe,
  CalendarDays,
  UserCheck,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { getDepartmentStats } from '@/lib/analytics';
import DepartmentChart from '@/components/charts/DepartmentChart';
import MetricBar from '@/components/charts/MetricBar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { calculateAverageScore, getScoreColor, getTrafficLightColor } from '@/lib/scoring';

interface DeptInsights {
  name: string;
  employeeCount: number;
  leaderCount: number;
  teams: string[];
  avgServiceYears: number;
  avgAge: number;
  ageMin: number;
  ageMax: number;
  genderDistribution: { male: number; female: number };
  nationalityDistribution: Record<string, number>;
  // Performance reviews
  perfAvgScore: number;
  perfReviewCount: number;
  trackDistribution: { فخر: number; خضر: number; صفر: number; حمر: number };
  topPerformer: { name: string; score: number } | null;
  retentionRate: number;
  retentionTotal: number;
  // Leader evaluations
  leaderAvgScore: number;
  leaderEvalCount: number;
  // Probation evaluations
  probationPassRate: number;
  probationTotal: number;
  // Existing eval score
  avgEvalScore: number;
  evalCount: number;
}

export default function DepartmentsPage() {
  const { data } = useData();

  const deptStats = useMemo(
    () => getDepartmentStats(data.employees, data.evaluations),
    [data.employees, data.evaluations]
  );

  const deptInsights = useMemo<DeptInsights[]>(() => {
    const deptMap = new Map<string, typeof data.employees>();
    for (const emp of data.employees) {
      if (!emp.department) continue;
      const existing = deptMap.get(emp.department) || [];
      existing.push(emp);
      deptMap.set(emp.department, existing);
    }

    const results: DeptInsights[] = [];

    for (const [deptName, emps] of deptMap) {
      const empNames = new Set(emps.map(e => e.name));
      const leaderNames = new Set(emps.filter(e => e.isLeader).map(e => e.name));

      // --- Performance Reviews ---
      const deptReviews = data.reviews.filter(r => r.department === deptName || empNames.has(r.employeeName));
      const perfScores = deptReviews.map(r => r.generalTrackScore).filter(s => s > 0);
      const perfAvgScore = calculateAverageScore(perfScores);

      // Track distribution
      const trackDist = { فخر: 0, خضر: 0, صفر: 0, حمر: 0 };
      for (const r of deptReviews) {
        const track = r.generalTrack;
        if (track && track.includes('فخر')) trackDist['فخر']++;
        else if (track && track.includes('خضر')) trackDist['خضر']++;
        else if (track && track.includes('صفر')) trackDist['صفر']++;
        else if (track && track.includes('حمر')) trackDist['حمر']++;
      }

      // Top performer
      let topPerformer: { name: string; score: number } | null = null;
      for (const r of deptReviews) {
        if (r.generalTrackScore > 0) {
          if (!topPerformer || r.generalTrackScore > topPerformer.score) {
            topPerformer = { name: r.employeeName, score: r.generalTrackScore };
          }
        }
      }

      // Retention rate from reviews
      const retainReviews = deptReviews.filter(r => r.retainEmployee);
      const retainYes = retainReviews.filter(r =>
        r.retainEmployee.includes('نعم') || r.retainEmployee.toLowerCase().includes('yes')
      ).length;

      // --- Leader Evaluations ---
      const deptLeaderEvals = data.leaders.filter(le => leaderNames.has(le.leaderName));
      const leaderScores = deptLeaderEvals.map(le => le.averageScore).filter(s => s > 0);
      const leaderAvgScore = calculateAverageScore(leaderScores);

      // --- Probation Evaluations ---
      const deptEvals = data.evaluations.filter(ev => empNames.has(ev.employeeName));
      const decisionEvals = deptEvals.filter(ev => ev.finalDecision);
      const passCount = decisionEvals.filter(ev => ev.finalDecision === 'confirmed').length;

      // Eval average score
      const allEvalScores: number[] = [];
      for (const ev of deptEvals) {
        if (ev.decisionStationScores) {
          allEvalScores.push(...Object.values(ev.decisionStationScores).filter(s => s > 0));
        }
        if (ev.firstImpressionScores) {
          allEvalScores.push(...Object.values(ev.firstImpressionScores).filter(s => s > 0));
        }
      }

      // Age stats
      const ages = emps.map(e => e.age).filter(a => a > 0);
      const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
      const ageMin = ages.length > 0 ? Math.min(...ages) : 0;
      const ageMax = ages.length > 0 ? Math.max(...ages) : 0;

      const males = emps.filter(e => e.gender === 'ذكر').length;
      const females = emps.filter(e => e.gender === 'أنثى').length;

      const nationalityDist: Record<string, number> = {};
      for (const emp of emps) {
        if (emp.nationality) {
          nationalityDist[emp.nationality] = (nationalityDist[emp.nationality] || 0) + 1;
        }
      }

      const teams = [...new Set(emps.map(e => e.team).filter(Boolean))];

      results.push({
        name: deptName,
        employeeCount: emps.length,
        leaderCount: emps.filter(e => e.isLeader).length,
        teams,
        avgServiceYears: emps.reduce((s, e) => s + e.serviceYears, 0) / emps.length,
        avgAge,
        ageMin,
        ageMax,
        genderDistribution: { male: males, female: females },
        nationalityDistribution: nationalityDist,
        perfAvgScore: perfAvgScore,
        perfReviewCount: deptReviews.length,
        trackDistribution: trackDist,
        topPerformer,
        retentionRate: retainReviews.length > 0 ? (retainYes / retainReviews.length) * 100 : -1,
        retentionTotal: retainReviews.length,
        leaderAvgScore,
        leaderEvalCount: deptLeaderEvals.length,
        probationPassRate: decisionEvals.length > 0 ? (passCount / decisionEvals.length) * 100 : -1,
        probationTotal: decisionEvals.length,
        avgEvalScore: calculateAverageScore(allEvalScores),
        evalCount: deptEvals.length,
      });
    }

    return results.sort((a, b) => b.employeeCount - a.employeeCount);
  }, [data.employees, data.reviews, data.leaders, data.evaluations]);

  if (data.employees.length === 0) {
    return (
      <div>
        <TopBar title="الإدارات" />
        <div className="p-8 text-center py-20">
          <p className="font-body text-[16px] text-neutral-muted mb-4">
            لم يتم رفع بيانات الموظفين بعد
          </p>
          <Link href="/dashboard?upload=true">
            <Button variant="accent" className="flex items-center gap-2 mx-auto">
              <Upload className="w-4 h-4" />
              رفع ملف بيانات الموظفين
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const chartData = deptStats.map(d => ({
    name: d.name,
    value: d.employeeCount,
  }));

  const trackColors: Record<string, string> = {
    فخر: '#00C17A',
    خضر: '#B2E2BA',
    صفر: '#FFBC0A',
    حمر: '#F24935',
  };

  return (
    <div>
      <TopBar title="الإدارات" />
      <div className="p-8">
        {/* Department size chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <h3 className="font-ui font-black text-[16px] mb-4">حجم الإدارات</h3>
          <DepartmentChart data={chartData} height={Math.max(200, deptStats.length * 40)} />
        </motion.div>

        {/* Department cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deptInsights.map((dept, i) => {
            const totalTracks = dept.trackDistribution.فخر + dept.trackDistribution.خضر + dept.trackDistribution.صفر + dept.trackDistribution.حمر;

            return (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow duration-300"
              >
                {/* Header */}
                <div className="bg-brand-black p-4">
                  <h3 className="font-display font-black text-[18px] text-white">{dept.name}</h3>
                  <p className="font-ui font-black text-[13px] text-white/60 mt-1">
                    {dept.teams.length} فريق
                  </p>
                </div>

                <div className="p-5 space-y-5">
                  {/* Key stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.1 }}
                      className="text-center bg-blue-50/60 rounded-lg py-3"
                    >
                      <Users className="w-4 h-4 text-brand-blue mx-auto mb-1" />
                      <p className="font-display font-black text-[20px]">{dept.employeeCount}</p>
                      <p className="font-ui font-black text-[10px] text-neutral-muted">موظف</p>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.15 }}
                      className="text-center bg-green-50/60 rounded-lg py-3"
                    >
                      <Clock className="w-4 h-4 text-brand-green mx-auto mb-1" />
                      <p className="font-display font-black text-[20px]">{dept.avgServiceYears.toFixed(1)}</p>
                      <p className="font-ui font-black text-[10px] text-neutral-muted">سنة خدمة</p>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.2 }}
                      className="text-center bg-amber-50/60 rounded-lg py-3"
                    >
                      <Award className="w-4 h-4 text-brand-amber mx-auto mb-1" />
                      <p className="font-display font-black text-[20px]">{dept.leaderCount}</p>
                      <p className="font-ui font-black text-[10px] text-neutral-muted">قائد</p>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.25 }}
                      className="text-center bg-purple-50/60 rounded-lg py-3"
                    >
                      <CalendarDays className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <p className="font-display font-black text-[20px]">{dept.avgAge > 0 ? dept.avgAge.toFixed(0) : '—'}</p>
                      <p className="font-ui font-black text-[10px] text-neutral-muted">متوسط العمر</p>
                    </motion.div>
                  </div>

                  {/* Age range */}
                  {dept.ageMin > 0 && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-ui font-black text-neutral-muted">نطاق العمر:</span>
                      <span className="font-ui font-black text-brand-black">{dept.ageMin} — {dept.ageMax} سنة</span>
                    </div>
                  )}

                  {/* Gender distribution */}
                  <div className="flex items-center gap-3">
                    <span className="font-ui font-black text-[12px] text-neutral-muted">الجنس:</span>
                    <div className="flex-1 flex gap-1">
                      {dept.genderDistribution.male > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dept.genderDistribution.male / dept.employeeCount) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 + 0.3 }}
                          className="h-3 rounded-full bg-brand-blue"
                          title={`ذكر: ${dept.genderDistribution.male}`}
                        />
                      )}
                      {dept.genderDistribution.female > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dept.genderDistribution.female / dept.employeeCount) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 + 0.3 }}
                          className="h-3 rounded-full bg-brand-pink-light"
                          title={`أنثى: ${dept.genderDistribution.female}`}
                        />
                      )}
                    </div>
                    <span className="font-ui font-black text-[11px] text-neutral-muted">
                      {dept.genderDistribution.male}ذ / {dept.genderDistribution.female}أ
                    </span>
                  </div>

                  {/* Performance Track Distribution */}
                  {totalTracks > 0 && (
                    <div>
                      <p className="font-ui font-black text-[12px] text-neutral-muted mb-2">
                        <BarChart3 className="w-3.5 h-3.5 inline-block ml-1" />
                        توزيع المسارات ({totalTracks} تقييم)
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(['فخر', 'خضر', 'صفر', 'حمر'] as const).map(track => {
                          const count = dept.trackDistribution[track];
                          if (count === 0) return null;
                          return (
                            <motion.span
                              key={track}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.08 + 0.35 }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-ui font-black"
                              style={{
                                backgroundColor: trackColors[track] + '20',
                                color: trackColors[track],
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: trackColors[track] }}
                              />
                              {track} ({count})
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Performance Score */}
                  {dept.perfAvgScore > 0 && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui font-black text-[12px] text-neutral-muted">
                          <Star className="w-3.5 h-3.5 inline-block ml-1" />
                          متوسط الأداء
                        </span>
                        <span
                          className="font-display font-black text-[18px]"
                          style={{ color: getScoreColor(dept.perfAvgScore) }}
                        >
                          {dept.perfAvgScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dept.perfAvgScore / 5) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.08 + 0.4 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getScoreColor(dept.perfAvgScore) }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Evaluation Score (Probation) */}
                  {dept.avgEvalScore > 0 && (
                    <MetricBar
                      label="متوسط تقييم الفترة"
                      value={dept.avgEvalScore}
                    />
                  )}

                  {/* Top Performer */}
                  {dept.topPerformer && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 + 0.5 }}
                      className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2"
                    >
                      <Star className="w-4 h-4 text-brand-green" />
                      <span className="font-ui font-black text-[12px] text-neutral-muted">الأعلى أداءً:</span>
                      <span className="font-ui font-black text-[13px] text-brand-black">{dept.topPerformer.name}</span>
                      <span
                        className="font-display font-black text-[14px] mr-auto"
                        style={{ color: getScoreColor(dept.topPerformer.score) }}
                      >
                        {dept.topPerformer.score.toFixed(2)}
                      </span>
                    </motion.div>
                  )}

                  {/* Leader Evaluation Average */}
                  {dept.leaderEvalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-blue" />
                      <span className="font-ui font-black text-[12px] text-neutral-muted">تقييم القادة:</span>
                      <span
                        className="font-display font-black text-[15px]"
                        style={{ color: getScoreColor(dept.leaderAvgScore) }}
                      >
                        {dept.leaderAvgScore.toFixed(2)}
                      </span>
                      <span className="font-ui font-black text-[11px] text-neutral-muted">
                        ({dept.leaderEvalCount} تقييم)
                      </span>
                    </div>
                  )}

                  {/* Probation Pass Rate + Retention */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {dept.probationPassRate >= 0 && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" style={{ color: getScoreColor(dept.probationPassRate / 20) }} />
                        <span className="font-ui font-black text-[12px] text-neutral-muted">نسبة الترسيم:</span>
                        <span
                          className="font-ui font-black text-[14px]"
                          style={{ color: getScoreColor(dept.probationPassRate / 20) }}
                        >
                          {dept.probationPassRate.toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {dept.retentionRate >= 0 && (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-brand-green" />
                        <span className="font-ui font-black text-[12px] text-neutral-muted">الاستبقاء:</span>
                        <span
                          className="font-ui font-black text-[14px]"
                          style={{ color: getScoreColor(dept.retentionRate / 20) }}
                        >
                          {dept.retentionRate.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Teams */}
                  {dept.teams.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dept.teams.map(team => (
                        <Badge key={team} variant="neutral">{team}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Top nationalities */}
                  {Object.keys(dept.nationalityDistribution).length > 0 && (
                    <div>
                      <p className="font-ui font-black text-[12px] text-neutral-muted mb-1.5">
                        <Globe className="w-3.5 h-3.5 inline-block ml-1" />
                        الجنسيات الأبرز
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dept.nationalityDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([nat, count]) => (
                            <span
                              key={nat}
                              className="font-ui font-black text-[11px] bg-neutral-100 px-2 py-0.5 rounded-full text-brand-black"
                            >
                              {nat} <span className="text-neutral-muted">({count})</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
