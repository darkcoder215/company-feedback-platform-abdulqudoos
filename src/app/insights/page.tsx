'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, AlertTriangle, Star, Shield, Award,
  ThumbsUp, ThumbsDown, Clock, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';

const COLORS = ['#00C17A', '#0072F9', '#FFBC0A', '#F24935', '#82003A', '#84DBE5', '#FF9172', '#D1C4E2'];
const TRACK_COLORS: Record<string, string> = { 'فخر': '#00C17A', 'خضر': '#B2E2BA', 'صفر': '#FFBC0A', 'حمر': '#F24935', 'خطر': '#82003A' };

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-xl p-6 shadow-sm">{children}</motion.div>
  );
}

function InsightBadge({ icon: Icon, text, color }: { icon: React.ElementType; text: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="font-ui font-bold text-[14px] flex-1">{text}</p>
    </div>
  );
}

export default function InsightsPage() {
  const { data } = useData();

  // ── Workforce insights ──
  const workforce = useMemo(() => {
    const emps = data.employees;
    if (emps.length === 0) return null;
    const avgAge = emps.filter(e => e.age > 0).reduce((s, e) => s + e.age, 0) / Math.max(emps.filter(e => e.age > 0).length, 1);
    const avgService = emps.reduce((s, e) => s + e.serviceYears, 0) / emps.length;
    const probCount = emps.filter(e => e.inProbation).length;
    const leaderCount = emps.filter(e => e.isLeader).length;
    const deptSizes: Record<string, number> = {};
    emps.forEach(e => { if (e.department) deptSizes[e.department] = (deptSizes[e.department] || 0) + 1; });
    const biggestDept = Object.entries(deptSizes).sort(([, a], [, b]) => b - a)[0];
    const smallestDept = Object.entries(deptSizes).sort(([, a], [, b]) => a - b)[0];
    const contractExpiring = emps.filter(e => e.contractDaysRemaining > 0 && e.contractDaysRemaining <= 90).length;
    return { avgAge: avgAge.toFixed(0), avgService: avgService.toFixed(1), probCount, leaderCount, biggestDept, smallestDept, contractExpiring, total: emps.length };
  }, [data.employees]);

  // ── Performance insights ──
  const performance = useMemo(() => {
    const revs = data.reviews;
    if (revs.length === 0) return null;
    const tracks: Record<string, number> = {};
    revs.forEach(r => { if (r.generalTrack) tracks[r.generalTrack] = (tracks[r.generalTrack] || 0) + 1; });
    const trackData = Object.entries(tracks).map(([name, value]) => ({ name, value, color: TRACK_COLORS[name] || '#94a3b8' }));
    const retainYes = revs.filter(r => r.retainEmployee === '✅' || r.retainEmployee === 'نعم').length;
    const retainNo = revs.filter(r => r.retainEmployee === '❌' || r.retainEmployee === 'لا').length;
    const retainRate = retainYes + retainNo > 0 ? Math.round((retainYes / (retainYes + retainNo)) * 100) : 0;

    // Dept performance
    const deptScores: Record<string, { total: number; count: number }> = {};
    revs.forEach(r => {
      if (!r.department) return;
      const scores = Object.values(r.performanceScores).filter(s => s > 0);
      if (scores.length === 0) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (!deptScores[r.department]) deptScores[r.department] = { total: 0, count: 0 };
      deptScores[r.department].total += avg;
      deptScores[r.department].count++;
    });
    const deptPerfData = Object.entries(deptScores)
      .map(([name, { total, count }]) => ({ name: name.length > 12 ? name.slice(0, 12) + '..' : name, score: Math.round((total / count) * 10) / 10 }))
      .sort((a, b) => b.score - a.score).slice(0, 8);

    // Top & bottom performers
    const empScores: Record<string, { total: number; count: number }> = {};
    revs.forEach(r => {
      const scores = Object.values(r.performanceScores).filter(s => s > 0);
      if (scores.length === 0) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (!empScores[r.employeeName]) empScores[r.employeeName] = { total: 0, count: 0 };
      empScores[r.employeeName].total += avg;
      empScores[r.employeeName].count++;
    });
    const ranked = Object.entries(empScores).map(([name, { total, count }]) => ({ name, avg: total / count })).sort((a, b) => b.avg - a.avg);
    const top5 = ranked.slice(0, 5);
    const bottom5 = ranked.slice(-5).reverse();

    return { trackData, retainRate, retainYes, retainNo, deptPerfData, top5, bottom5, total: revs.length };
  }, [data.reviews]);

  // ── Probation insights ──
  const probation = useMemo(() => {
    const evals = data.evaluations;
    if (evals.length === 0) return null;
    const confirmed = evals.filter(e => e.finalDecision === 'confirmed').length;
    const terminated = evals.filter(e => e.finalDecision === 'terminated').length;
    const passRate = confirmed + terminated > 0 ? Math.round((confirmed / (confirmed + terminated)) * 100) : 0;
    return { confirmed, terminated, passRate, total: evals.length };
  }, [data.evaluations]);

  // ── Leadership insights ──
  const leadership = useMemo(() => {
    const ldrs = data.leaders;
    if (ldrs.length === 0) return null;
    const byLeader: Record<string, { total: number; count: number }> = {};
    ldrs.forEach(l => {
      if (!byLeader[l.leaderName]) byLeader[l.leaderName] = { total: 0, count: 0 };
      byLeader[l.leaderName].total += l.averageScore;
      byLeader[l.leaderName].count++;
    });
    const ranked = Object.entries(byLeader).map(([name, { total, count }]) => ({ name, avg: Math.round((total / count) * 10) / 10, count })).sort((a, b) => b.avg - a.avg);
    const overallAvg = ldrs.reduce((s, l) => s + l.averageScore, 0) / ldrs.length;
    return { ranked, overallAvg: overallAvg.toFixed(1), total: ldrs.length, uniqueLeaders: ranked.length };
  }, [data.leaders]);

  const hasAnyData = data.employees.length > 0 || data.reviews.length > 0 || data.evaluations.length > 0 || data.leaders.length > 0;

  return (
    <div>
      <TopBar title="الرؤى والتحليلات" />
      <div className="p-8">
        {!hasAnyData ? (
          <div className="text-center py-20">
            <Target className="w-16 h-16 mx-auto text-neutral-warm-gray mb-4" />
            <p className="font-display font-bold text-[20px]">لا توجد بيانات بعد</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Key Insights Badges ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workforce && (
                <InsightBadge icon={Users} color="#0072F9"
                  text={`${workforce.total} موظف — متوسط العمر ${workforce.avgAge} سنة — متوسط الخدمة ${workforce.avgService} سنة`} />
              )}
              {workforce && workforce.contractExpiring > 0 && (
                <InsightBadge icon={AlertTriangle} color="#F24935"
                  text={`${workforce.contractExpiring} موظف تنتهي عقودهم خلال ٩٠ يوماً`} />
              )}
              {performance && (
                <InsightBadge icon={ThumbsUp} color="#00C17A"
                  text={`نسبة التمسك بالموظفين ${performance.retainRate}% (${performance.retainYes} من ${performance.retainYes + performance.retainNo})`} />
              )}
              {probation && (
                <InsightBadge icon={Award} color="#FFBC0A"
                  text={`معدل نجاح فترات التجربة ${probation.passRate}% — ${probation.confirmed} ترسيم — ${probation.terminated} لم يستمر`} />
              )}
              {leadership && (
                <InsightBadge icon={Shield} color="#82003A"
                  text={`${leadership.uniqueLeaders} قائد — المتوسط العام ${leadership.overallAvg}/١٠ من ${leadership.total} تقييم`} />
              )}
              {workforce && (
                <InsightBadge icon={Clock} color="#84DBE5"
                  text={`${workforce.probCount} موظف في فترة التجربة — ${workforce.leaderCount} قائد في الفريق`} />
              )}
            </div>

            {/* ── Performance: Track + Dept Charts ── */}
            {performance && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card delay={0.1}>
                  <h3 className="font-ui font-bold text-[15px] mb-4">توزيع الدروب (أناناس) — {performance.total} تقييم</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={performance.trackData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}
                        label={({ name, value }) => `${name} (${value})`}>
                        {performance.trackData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card delay={0.15}>
                  <h3 className="font-ui font-bold text-[15px] mb-4">متوسط الأداء حسب الإدارة</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performance.deptPerfData} layout="vertical" margin={{ right: 80, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none' }} />
                      <Bar dataKey="score" fill="#0072F9" radius={[0, 6, 6, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* ── Top & Bottom Performers ── */}
            {performance && (performance.top5.length > 0 || performance.bottom5.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card delay={0.2}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-brand-green" />
                    <h3 className="font-ui font-bold text-[15px]">أعلى ٥ أداءً</h3>
                  </div>
                  <div className="space-y-3">
                    {performance.top5.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="font-display font-black text-[18px] text-brand-green w-8">{i + 1}</span>
                        <span className="font-ui font-bold text-[14px] flex-1">{p.name}</span>
                        <span className="font-display font-black text-[16px] text-brand-green">{p.avg.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card delay={0.25}>
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsDown className="w-4 h-4 text-brand-red" />
                    <h3 className="font-ui font-bold text-[15px]">يحتاجون تطوير</h3>
                  </div>
                  <div className="space-y-3">
                    {performance.bottom5.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="font-display font-black text-[18px] text-brand-red w-8">{i + 1}</span>
                        <span className="font-ui font-bold text-[14px] flex-1">{p.name}</span>
                        <span className="font-display font-black text-[16px] text-brand-red">{p.avg.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── Leader Rankings ── */}
            {leadership && leadership.ranked.length > 0 && (
              <Card delay={0.3}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-brand-burgundy" />
                  <h3 className="font-ui font-bold text-[15px]">ترتيب القادة حسب التقييم ٣٦٠°</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leadership.ranked.map((ldr, i) => (
                    <div key={ldr.name} className="flex items-center gap-3 bg-neutral-cream rounded-lg p-3">
                      <span className="font-display font-black text-[16px] w-7 text-neutral-muted">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-ui font-bold text-[13px] truncate">{ldr.name}</p>
                        <p className="font-ui text-[11px] text-neutral-muted">{ldr.count} تقييم</p>
                      </div>
                      <span className="font-display font-black text-[18px]" style={{ color: ldr.avg >= 7 ? '#00C17A' : ldr.avg >= 5 ? '#FFBC0A' : '#F24935' }}>
                        {ldr.avg}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Biggest & Smallest dept ── */}
            {workforce && (
              <Card delay={0.35}>
                <h3 className="font-ui font-bold text-[15px] mb-4">هيكل الشركة</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workforce.biggestDept && (
                    <div className="text-center p-4 bg-brand-blue/5 rounded-lg">
                      <p className="font-ui text-[12px] text-neutral-muted mb-1">أكبر إدارة</p>
                      <p className="font-display font-black text-[18px] text-brand-blue">{workforce.biggestDept[0]}</p>
                      <p className="font-ui font-bold text-[14px] text-neutral-muted">{workforce.biggestDept[1]} موظف</p>
                    </div>
                  )}
                  {workforce.smallestDept && (
                    <div className="text-center p-4 bg-brand-amber/5 rounded-lg">
                      <p className="font-ui text-[12px] text-neutral-muted mb-1">أصغر إدارة</p>
                      <p className="font-display font-black text-[18px] text-brand-amber">{workforce.smallestDept[0]}</p>
                      <p className="font-ui font-bold text-[14px] text-neutral-muted">{workforce.smallestDept[1]} موظف</p>
                    </div>
                  )}
                  <div className="text-center p-4 bg-brand-green/5 rounded-lg">
                    <p className="font-ui text-[12px] text-neutral-muted mb-1">نسبة القادة</p>
                    <p className="font-display font-black text-[18px] text-brand-green">
                      {Math.round((workforce.leaderCount / workforce.total) * 100)}%
                    </p>
                    <p className="font-ui font-bold text-[14px] text-neutral-muted">{workforce.leaderCount} من {workforce.total}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
