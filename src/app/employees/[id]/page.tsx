'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, ClipboardCheck, Users, TrendingUp } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useData } from '@/context/DataContext';
import TopBar from '@/components/layout/TopBar';
import EmployeeCard from '@/components/employees/EmployeeCard';
import MetricBar from '@/components/charts/MetricBar';
import RadialScore from '@/components/charts/RadialScore';
import Badge from '@/components/ui/Badge';
import { calculateAverageScore, getDecisionLabel, getDecisionColor } from '@/lib/scoring';

const DS_LABELS: Record<string, string> = {
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

const FI_LABELS: Record<string, string> = {
  interaction: 'التفاعل والبداية',
  independence: 'الاستقلالية والتعلم',
  communication: 'التواصل والتعاون',
  teamIntegration: 'الاندماج مع الفريق',
  toolIntegration: 'الاندماج في أدوات العمل',
  overallImpression: 'الانطباع العام',
};

const PERF_LABELS: Record<string, string> = {
  outputQuality: 'جودة المخرجات',
  timeDiscipline: 'الانضباط بالوقت',
  basecampUsage: 'بيسكامب',
  initiative: 'حس المبادرة',
  efficiency: 'الكفاءة',
  dependability: 'الاعتمادية',
  professionalDev: 'التطور المهني',
  overallTrack: 'الدرب العام',
};

const TRACK_COLORS: Record<string, string> = {
  'فخر': '#00C17A',
  'خضر': '#B2E2BA',
  'صفر': '#FFBC0A',
  'حمر': '#F24935',
  'خطر': '#82003A',
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const { data } = useData();

  const employee = useMemo(
    () => data.employees.find(e => e.id === params?.id),
    [data.employees, params?.id]
  );

  // Match evaluations by employee name
  const evaluations = useMemo(
    () => data.evaluations.filter(ev =>
      ev.employeeName === employee?.name || ev.employeeName === employee?.preferredName
    ),
    [data.evaluations, employee]
  );

  // Match Ananas performance reviews
  const reviews = useMemo(
    () => data.reviews.filter(rev =>
      rev.employeeName === employee?.name || rev.employeeName === employee?.preferredName
    ),
    [data.reviews, employee]
  );

  // Match leader evaluations (if this employee is a leader, find evaluations about them)
  const leaderEvals = useMemo(
    () => data.leaders.filter(ldr =>
      ldr.leaderName === employee?.name || ldr.leaderName === employee?.preferredName
    ),
    [data.leaders, employee]
  );

  // Find all unique evaluator/manager names
  const evaluatedBy = useMemo(() => {
    const managers = new Set<string>();
    for (const ev of evaluations) if (ev.evaluatorName) managers.add(ev.evaluatorName);
    for (const rev of reviews) if (rev.directLeader) managers.add(rev.directLeader);
    for (const ldr of leaderEvals) if (ldr.evaluatorName) managers.add(ldr.evaluatorName);
    return Array.from(managers);
  }, [evaluations, reviews, leaderEvals]);

  // Average performance radar data
  const perfRadarData = useMemo(() => {
    if (reviews.length === 0) return [];
    const sums: Record<string, { total: number; count: number }> = {};
    for (const rev of reviews) {
      for (const [key, value] of Object.entries(rev.performanceScores)) {
        if (value > 0) {
          if (!sums[key]) sums[key] = { total: 0, count: 0 };
          sums[key].total += value;
          sums[key].count++;
        }
      }
    }
    return Object.entries(sums).map(([key, { total, count }]) => ({
      subject: PERF_LABELS[key] || key,
      score: Math.round((total / count) * 10) / 10,
      fullMark: 5,
    }));
  }, [reviews]);

  // Leader evaluation averages
  const leaderAvgs = useMemo(() => {
    if (leaderEvals.length === 0) return null;
    const cats = [
      { label: 'التواصل', fields: ['communication'] as const },
      { label: 'الأولويات', fields: ['prioritization'] as const },
      { label: 'اتخاذ القرار', fields: ['decisionMaking'] as const },
      { label: 'بناء الأهداف', fields: ['goalSetting'] as const },
      { label: 'التمكين', fields: ['empowerment'] as const },
      { label: 'التفويض', fields: ['delegation'] as const },
      { label: 'الدعم', fields: ['support'] as const },
      { label: 'الذكاء العاطفي', fields: ['emotionalIntelligence'] as const },
      { label: 'المعنويات', fields: ['morale'] as const },
      { label: 'التعاون', fields: ['collaboration'] as const },
      { label: 'البيئة', fields: ['environment'] as const },
      { label: 'الإشراك', fields: ['inclusion'] as const },
    ];
    return cats.map(cat => {
      let total = 0, count = 0;
      for (const ldr of leaderEvals) {
        for (const f of cat.fields) {
          const v = ldr[f];
          if (typeof v === 'number' && v > 0) { total += v; count++; }
        }
      }
      return { name: cat.label, score: count > 0 ? Math.round((total / count) * 10) / 10 : 0 };
    }).filter(d => d.score > 0);
  }, [leaderEvals]);

  const overallLeaderAvg = useMemo(() => {
    if (leaderEvals.length === 0) return 0;
    return Math.round((leaderEvals.reduce((s, l) => s + l.averageScore, 0) / leaderEvals.length) * 10) / 10;
  }, [leaderEvals]);

  if (!employee) {
    return (
      <div>
        <TopBar title="الموظف" />
        <div className="p-8 text-center py-20">
          <p className="font-body text-[16px] text-neutral-muted">لم يتم العثور على الموظف</p>
          <Link href="/employees" className="text-brand-blue font-ui text-[14px] mt-2 inline-block">
            العودة لقائمة الموظفين
          </Link>
        </div>
      </div>
    );
  }

  // ── Overall averages ──
  const overallPerfAvg = useMemo(() => {
    if (reviews.length === 0) return 0;
    const allScores: number[] = [];
    for (const rev of reviews) {
      const s = Object.values(rev.performanceScores).filter(v => v > 0);
      if (s.length > 0) allScores.push(s.reduce((a, b) => a + b, 0) / s.length);
    }
    return allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;
  }, [reviews]);

  const overallProbAvg = useMemo(() => {
    const allScores: number[] = [];
    for (const ev of evaluations) {
      if (ev.decisionStationScores) allScores.push(...Object.values(ev.decisionStationScores).filter(s => s > 0));
      if (ev.firstImpressionScores) allScores.push(...Object.values(ev.firstImpressionScores).filter(s => s > 0));
    }
    return calculateAverageScore(allScores);
  }, [evaluations]);

  const totalFeedbackSources = (evaluations.length > 0 ? 1 : 0) + (reviews.length > 0 ? 1 : 0) + (leaderEvals.length > 0 ? 1 : 0);

  return (
    <div>
      <TopBar title={employee.preferredName} />
      <div className="p-8">
        {/* Back link */}
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-brand-blue font-ui text-[14px] mb-6 hover:underline"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة الموظفين
        </Link>

        <EmployeeCard employee={employee} />

        {/* ── Overall Averages Summary ── */}
        {totalFeedbackSources > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {overallPerfAvg > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm text-center border-2 border-brand-green/10">
                <Star className="w-5 h-5 text-brand-green mx-auto mb-2" />
                <p className="font-display font-black text-[32px] text-brand-green leading-none">{overallPerfAvg}</p>
                <p className="font-ui font-black text-[12px] text-neutral-muted mt-1">متوسط الأداء</p>
                <p className="font-ui font-bold text-[11px] text-neutral-muted">من ٥</p>
              </div>
            )}
            {overallLeaderAvg > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm text-center border-2 border-brand-burgundy/10">
                <Shield className="w-5 h-5 text-brand-burgundy mx-auto mb-2" />
                <p className="font-display font-black text-[32px] text-brand-burgundy leading-none">{overallLeaderAvg}</p>
                <p className="font-ui font-black text-[12px] text-neutral-muted mt-1">تقييم القيادة</p>
                <p className="font-ui font-bold text-[11px] text-neutral-muted">من ١٠</p>
              </div>
            )}
            {overallProbAvg > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm text-center border-2 border-brand-amber/10">
                <ClipboardCheck className="w-5 h-5 text-brand-amber mx-auto mb-2" />
                <p className="font-display font-black text-[32px] text-brand-amber leading-none">{overallProbAvg.toFixed(1)}</p>
                <p className="font-ui font-black text-[12px] text-neutral-muted mt-1">تقييم التجربة</p>
                <p className="font-ui font-bold text-[11px] text-neutral-muted">من ٥</p>
              </div>
            )}
            <div className="bg-white rounded-xl p-5 shadow-sm text-center border-2 border-brand-blue/10">
              <Users className="w-5 h-5 text-brand-blue mx-auto mb-2" />
              <p className="font-display font-black text-[32px] text-brand-blue leading-none">{evaluations.length + reviews.length + leaderEvals.length}</p>
              <p className="font-ui font-black text-[12px] text-neutral-muted mt-1">إجمالي التقييمات</p>
              <p className="font-ui font-bold text-[11px] text-neutral-muted">{evaluatedBy.length} مقيّم</p>
            </div>
          </motion.div>
        )}

        {/* ── Feedback Summary Banner ── */}
        {totalFeedbackSources > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-gradient-to-l from-brand-black to-neutral-dark-slate rounded-xl p-5 flex flex-wrap items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green" />
              <span className="font-ui font-bold text-[13px] text-brand-green">ملخص التقييمات</span>
            </div>
            {evaluations.length > 0 && (
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-brand-amber" />
                <span className="font-ui text-[13px] text-white">{evaluations.length} تقييم فترة تجربة</span>
              </div>
            )}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-brand-green" />
                <span className="font-ui text-[13px] text-white">{reviews.length} تقييم أداء</span>
              </div>
            )}
            {leaderEvals.length > 0 && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-burgundy" />
                <span className="font-ui text-[13px] text-white">{leaderEvals.length} تقييم قيادة ٣٦٠°</span>
              </div>
            )}
            {evaluatedBy.length > 0 && (
              <div className="flex items-center gap-2 mr-auto">
                <Users className="w-4 h-4 text-white/40" />
                <span className="font-ui text-[12px] text-white/50">قيّمه: {evaluatedBy.slice(0, 3).join('، ')}{evaluatedBy.length > 3 ? ` و${evaluatedBy.length - 3} آخرين` : ''}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Ananas Performance Reviews ── */}
        {reviews.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-brand-green" />
              <h2 className="font-display font-bold text-[22px]">تقييمات الأداء (أناناس)</h2>
              <Badge variant="success">{reviews.length}</Badge>
            </div>

            {/* Performance Radar */}
            {perfRadarData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-ui font-bold text-[15px] mb-4">المتوسط العام لدرجات الأداء</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={perfRadarData}>
                    <PolarGrid stroke="#EFEDE2" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fill: '#494C6B' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name="المتوسط" dataKey="score" stroke="#00C17A" fill="#00C17A" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {reviews.map((rev, idx) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-warm-gray">
                  <div>
                    <h3 className="font-ui font-bold text-[16px]">تقييم أداء — {rev.season || rev.reviewDate}</h3>
                    <p className="font-ui text-[13px] text-neutral-muted mt-1">
                      المقيّم: {rev.directLeader} {rev.managerOfManager ? `— مدير المدير: ${rev.managerOfManager}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rev.generalTrack && (
                      <span
                        className="font-ui font-black text-[13px] px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: `${TRACK_COLORS[rev.generalTrack] || '#94a3b8'}15`,
                          color: TRACK_COLORS[rev.generalTrack] || '#494C6B',
                        }}
                      >
                        {rev.generalTrack}
                      </span>
                    )}
                    {rev.retainEmployee && (
                      <span className="font-ui text-[12px] bg-neutral-cream px-2 py-1 rounded">
                        التمسك: {rev.retainEmployee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score bars */}
                <div className="space-y-2">
                  {Object.entries(rev.performanceScores).map(([key, value], i) => (
                    value > 0 && (
                      <MetricBar
                        key={key}
                        label={PERF_LABELS[key] || key}
                        value={value}
                        maxValue={5}
                        delay={i * 0.03}
                      />
                    )
                  ))}
                </div>

                {/* Manager comments */}
                {rev.managerComments && (
                  <div className="mt-4 bg-neutral-cream rounded-lg p-4">
                    <h4 className="font-ui font-bold text-[13px] text-neutral-muted mb-2">تعليقات المدير</h4>
                    <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap">{rev.managerComments}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Leader 360 Evaluations ── */}
        {leaderEvals.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-burgundy" />
              <h2 className="font-display font-bold text-[22px]">تقييمات القيادة ٣٦٠°</h2>
              <Badge variant="info">{leaderEvals.length}</Badge>
              <span className="font-ui text-[14px] text-neutral-muted mr-auto">المتوسط العام: <strong className="text-brand-green">{overallLeaderAvg} / ١٠</strong></span>
            </div>

            {/* Leader scores bar chart */}
            {leaderAvgs && leaderAvgs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-ui font-bold text-[15px] mb-4">متوسط الدرجات حسب المعيار</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leaderAvgs} layout="vertical" margin={{ right: 80, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                    <XAxis type="number" domain={[0, 10]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none' }} />
                    <Bar dataKey="score" fill="#82003A" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {leaderEvals.map((ldr, idx) => (
              <motion.div
                key={ldr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-warm-gray">
                  <div>
                    <h3 className="font-ui font-bold text-[15px]">تقييم من: {ldr.evaluatorName}</h3>
                    <p className="font-ui text-[12px] text-neutral-muted">{ldr.submittedAt}</p>
                  </div>
                  <div className="font-display font-black text-[24px]" style={{ color: ldr.averageScore >= 7 ? '#00C17A' : ldr.averageScore >= 5 ? '#FFBC0A' : '#F24935' }}>
                    {ldr.averageScore.toFixed(1)}
                  </div>
                </div>
                {ldr.generalComments && (
                  <div className="bg-neutral-cream rounded-lg p-4">
                    <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap">{ldr.generalComments}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Probation Evaluations ── */}
        {evaluations.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-brand-amber" />
              <h2 className="font-display font-bold text-[22px]">تقييمات فترة التجربة</h2>
              <Badge variant="warning">{evaluations.length}</Badge>
            </div>

            {evaluations.map((ev, idx) => {
              const scores = ev.decisionStationScores
                ? Object.values(ev.decisionStationScores).filter(s => s > 0)
                : ev.firstImpressionScores
                  ? Object.values(ev.firstImpressionScores).filter(s => s > 0)
                  : [];
              const avgScore = calculateAverageScore(scores);

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-warm-gray">
                    <div>
                      <h3 className="font-ui font-bold text-[16px]">
                        {ev.evaluationType === 'first_impression'
                          ? 'الانطباع الأول: الأسبوعين الأولى'
                          : 'محطة القرار: الأسبوع العاشر'
                        }
                      </h3>
                      <p className="font-ui text-[13px] text-neutral-muted mt-1">
                        المقيّم: {ev.evaluatorName} — {ev.submittedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {ev.trafficLight && (
                        <Badge variant={ev.trafficLightScore >= 4 ? 'success' : ev.trafficLightScore >= 3 ? 'warning' : 'error'}>
                          {ev.trafficLight}
                        </Badge>
                      )}
                      {ev.finalDecision && (
                        <span
                          className="font-ui font-bold text-[13px] px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: `${getDecisionColor(ev.finalDecision)}15`,
                            color: getDecisionColor(ev.finalDecision),
                          }}
                        >
                          {getDecisionLabel(ev.finalDecision)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score Overview + Breakdown */}
                  <div className="flex gap-8">
                    <RadialScore score={avgScore} label="المعدل العام" />

                    <div className="flex-1 space-y-3">
                      {ev.decisionStationScores && Object.entries(ev.decisionStationScores).map(([key, value], i) => (
                        value > 0 && (
                          <MetricBar key={key} label={DS_LABELS[key] || key} value={value} delay={i * 0.05} />
                        )
                      ))}
                      {ev.firstImpressionScores && Object.entries(ev.firstImpressionScores).map(([key, value], i) => (
                        value > 0 && (
                          <MetricBar key={key} label={FI_LABELS[key] || key} value={value} delay={i * 0.05} />
                        )
                      ))}
                    </div>
                  </div>

                  {/* Feedback sections */}
                  {(ev.startFeedback || ev.stopFeedback || ev.continueFeedback) && (
                    <div className="mt-6 pt-4 border-t border-neutral-warm-gray grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ev.startFeedback && (
                        <div className="bg-score-excellent/5 rounded-lg p-4">
                          <h4 className="font-ui font-bold text-[13px] text-score-excellent mb-2">ابدأ</h4>
                          <p className="font-body text-[14px] text-neutral-charcoal leading-relaxed">{ev.startFeedback}</p>
                        </div>
                      )}
                      {ev.stopFeedback && (
                        <div className="bg-score-poor/5 rounded-lg p-4">
                          <h4 className="font-ui font-bold text-[13px] text-score-poor mb-2">توقف</h4>
                          <p className="font-body text-[14px] text-neutral-charcoal leading-relaxed">{ev.stopFeedback}</p>
                        </div>
                      )}
                      {ev.continueFeedback && (
                        <div className="bg-brand-blue/5 rounded-lg p-4">
                          <h4 className="font-ui font-bold text-[13px] text-brand-blue mb-2">استمر</h4>
                          <p className="font-body text-[14px] text-neutral-charcoal leading-relaxed">{ev.continueFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {ev.openComments && (
                    <div className="mt-4 bg-neutral-cream rounded-lg p-4">
                      <h4 className="font-ui font-bold text-[13px] text-neutral-muted mb-2">ملاحظات إضافية</h4>
                      <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap">{ev.openComments}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* No feedback at all */}
        {totalFeedbackSources === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <ClipboardCheck className="w-12 h-12 mx-auto text-neutral-warm-gray mb-3" />
            <p className="font-ui font-bold text-[16px] text-neutral-muted">لا توجد تقييمات مسجلة لهذا الموظف</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
