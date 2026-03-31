'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, AlertTriangle, Star, Shield, Award,
  ThumbsUp, ThumbsDown, Clock, Target, Building2, ChevronDown,
  Briefcase, MapPin, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import WorldMap from '@/components/dashboard/WorldMap';
import { useData } from '@/context/DataContext';
import { getOverallStats } from '@/lib/analytics';

const COLORS = ['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5', '#FF9172', '#D1C4E2', '#FFA5C6', '#FFD1C4'];
const TRACK_COLORS: Record<string, string> = { 'فخر': '#00C17A', 'خضر': '#B2E2BA', 'صفر': '#FFBC0A', 'حمر': '#F24935', 'خطر': '#82003A' };

type TabKey = 'overview' | 'departments' | 'leaders';

function Card({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`bg-white rounded-2xl p-6 shadow-sm ${className}`}>{children}</motion.div>
  );
}

function Metric({ value, label, color = '#2B2D3F' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="text-center p-4">
      <p className="font-display font-black text-[36px] leading-none" style={{ color }}>{value}</p>
      <p className="font-ui font-bold text-[12px] text-neutral-muted mt-1">{label}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-black text-white px-4 py-2 rounded-lg shadow-lg font-ui text-[13px]">
      <p className="font-black">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold">{p.name ? `${p.name}: ` : ''}{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  );
};

export default function InsightsPage() {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);

  const stats = useMemo(() => getOverallStats(data.employees, data.evaluations), [data.employees, data.evaluations]);

  // ── Departments list ──
  const departments = useMemo(() => {
    const deptMap: Record<string, { employees: typeof data.employees; reviews: typeof data.reviews; leaders: typeof data.leaders; evaluations: typeof data.evaluations }> = {};
    data.employees.forEach(e => {
      if (!e.department) return;
      if (!deptMap[e.department]) deptMap[e.department] = { employees: [], reviews: [], leaders: [], evaluations: [] };
      deptMap[e.department].employees.push(e);
    });
    // Map reviews to departments
    data.reviews.forEach(r => {
      if (!r.department) return;
      if (!deptMap[r.department]) deptMap[r.department] = { employees: [], reviews: [], leaders: [], evaluations: [] };
      deptMap[r.department].reviews.push(r);
    });
    // Map evaluations by matching employee names to departments
    const empDept = new Map(data.employees.map(e => [e.name, e.department]));
    data.evaluations.forEach(ev => {
      const dept = empDept.get(ev.employeeName);
      if (dept && deptMap[dept]) deptMap[dept].evaluations.push(ev);
    });
    return Object.entries(deptMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.employees.length - a.employees.length);
  }, [data]);

  // ── Leaders list ──
  const leadersList = useMemo(() => {
    const byLeader: Record<string, typeof data.leaders> = {};
    data.leaders.forEach(l => {
      if (!byLeader[l.leaderName]) byLeader[l.leaderName] = [];
      byLeader[l.leaderName].push(l);
    });
    return Object.entries(byLeader)
      .map(([name, evals]) => {
        const avg = evals.reduce((s, e) => s + e.averageScore, 0) / evals.length;
        return { name, evals, avg: Math.round(avg * 10) / 10, count: evals.length };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [data.leaders]);

  // ── Selected department details ──
  const deptDetail = useMemo(() => {
    if (!selectedDept) return null;
    const d = departments.find(x => x.name === selectedDept);
    if (!d) return null;

    const genderM = d.employees.filter(e => e.gender === 'ذكر').length;
    const genderF = d.employees.filter(e => e.gender === 'أنثى').length;
    const avgService = d.employees.length > 0 ? (d.employees.reduce((s, e) => s + e.serviceYears, 0) / d.employees.length).toFixed(1) : '0';
    const leaders = d.employees.filter(e => e.isLeader).length;
    const teams = [...new Set(d.employees.map(e => e.team).filter(Boolean))];
    const tracks: Record<string, number> = {};
    d.reviews.forEach(r => { if (r.generalTrack) tracks[r.generalTrack] = (tracks[r.generalTrack] || 0) + 1; });
    const trackData = Object.entries(tracks).map(([name, value]) => ({ name, value, color: TRACK_COLORS[name] || '#94a3b8' }));
    const confirmed = d.evaluations.filter(e => e.finalDecision === 'confirmed').length;
    const terminated = d.evaluations.filter(e => e.finalDecision === 'terminated').length;

    return { ...d, genderM, genderF, avgService, leaders, teams, trackData, confirmed, terminated };
  }, [selectedDept, departments]);

  // ── Selected leader details ──
  const leaderDetail = useMemo(() => {
    if (!selectedLeader) return null;
    const l = leadersList.find(x => x.name === selectedLeader);
    if (!l) return null;

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
      { label: 'التطوير', fields: ['development'] as const },
      { label: 'الملاحظات', fields: ['feedback'] as const },
      { label: 'الأداء', fields: ['performance'] as const },
      { label: 'الإبداع', fields: ['creativity'] as const },
    ];

    const scoreData = cats.map(cat => {
      let t = 0, c = 0;
      l.evals.forEach(ev => cat.fields.forEach(f => { const v = ev[f]; if (typeof v === 'number' && v > 0) { t += v; c++; } }));
      return { name: cat.label, score: c > 0 ? Math.round((t / c) * 10) / 10 : 0 };
    }).filter(d => d.score > 0);

    const radarCats = [
      { subject: 'الوضوح', fields: ['communication', 'prioritization', 'decisionMaking', 'goalSetting'] as const },
      { subject: 'طريقة العمل', fields: ['empowerment', 'delegation', 'support', 'emotionalIntelligence'] as const },
      { subject: 'قيادة الفريق', fields: ['morale', 'collaboration', 'environment', 'inclusion'] as const },
      { subject: 'التطوير', fields: ['development', 'feedback', 'performance', 'creativity'] as const },
    ];
    const radarData = radarCats.map(cat => {
      let t = 0, c = 0;
      l.evals.forEach(ev => cat.fields.forEach(f => { const v = ev[f]; if (typeof v === 'number' && v > 0) { t += v; c++; } }));
      return { subject: cat.subject, score: c > 0 ? Math.round((t / c) * 10) / 10 : 0, fullMark: 10 };
    });

    const comments = l.evals.map(e => e.generalComments).filter(Boolean);

    return { ...l, scoreData, radarData, comments };
  }, [selectedLeader, leadersList]);

  // ── Overview data ──
  const topPerformers = useMemo(() => {
    const empScores: Record<string, { total: number; count: number }> = {};
    data.reviews.forEach(r => {
      const scores = Object.values(r.performanceScores).filter(s => s > 0);
      if (scores.length === 0) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (!empScores[r.employeeName]) empScores[r.employeeName] = { total: 0, count: 0 };
      empScores[r.employeeName].total += avg;
      empScores[r.employeeName].count++;
    });
    return Object.entries(empScores).map(([name, { total, count }]) => ({ name, avg: Math.round((total / count) * 10) / 10 })).sort((a, b) => b.avg - a.avg);
  }, [data.reviews]);

  const contractExpiring = useMemo(() => data.employees.filter(e => e.contractDaysRemaining > 0 && e.contractDaysRemaining <= 90), [data.employees]);

  const deptPerfData = useMemo(() => {
    const deptScores: Record<string, { total: number; count: number }> = {};
    data.reviews.forEach(r => {
      if (!r.department) return;
      const scores = Object.values(r.performanceScores).filter(s => s > 0);
      if (scores.length === 0) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (!deptScores[r.department]) deptScores[r.department] = { total: 0, count: 0 };
      deptScores[r.department].total += avg;
      deptScores[r.department].count++;
    });
    return Object.entries(deptScores)
      .map(([name, { total, count }]) => ({ name: name.length > 14 ? name.slice(0, 14) + '..' : name, score: Math.round((total / count) * 10) / 10 }))
      .sort((a, b) => b.score - a.score).slice(0, 10);
  }, [data.reviews]);

  const hasAnyData = data.employees.length > 0 || data.reviews.length > 0 || data.evaluations.length > 0 || data.leaders.length > 0;

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: Target },
    { key: 'departments', label: 'حسب الإدارة', icon: Building2 },
    { key: 'leaders', label: 'حسب القائد', icon: Shield },
  ];

  return (
    <div>
      <TopBar title="الرؤى والتحليلات" />
      <div className="p-8">
        {!hasAnyData ? (
          <div className="text-center py-20">
            <Target className="w-16 h-16 mx-auto text-neutral-warm-gray mb-4" />
            <p className="font-display font-black text-[20px]">لا توجد بيانات بعد</p>
          </div>
        ) : (
          <>
            {/* ── Tabs ── */}
            <div className="flex gap-2 mb-8 bg-neutral-cream rounded-xl p-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedDept(null); setSelectedLeader(null); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-ui font-black text-[14px] transition-all flex-1 justify-center ${
                    activeTab === tab.key
                      ? 'bg-white text-brand-black shadow-sm'
                      : 'text-neutral-muted hover:text-brand-black'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ══════ OVERVIEW TAB ══════ */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {/* Key metrics row */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card delay={0}><Metric value={data.employees.length} label="إجمالي الموظفين" color="#0072F9" /></Card>
                    <Card delay={0.05}><Metric value={data.reviews.length} label="تقييم أداء" color="#00C17A" /></Card>
                    <Card delay={0.1}><Metric value={data.evaluations.length} label="تقييم تجربة" color="#FFBC0A" /></Card>
                    <Card delay={0.15}><Metric value={data.leaders.length} label="تقييم قيادة" color="#82003A" /></Card>
                    <Card delay={0.2}><Metric value={`${stats.avgServiceYears}y`} label="متوسط الخدمة" color="#84DBE5" /></Card>
                  </div>

                  {/* Alerts */}
                  {contractExpiring.length > 0 && (
                    <Card delay={0.25} className="border-2 border-brand-red/20">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-brand-red" />
                        <h3 className="font-ui font-black text-[15px] text-brand-red">{contractExpiring.length} عقد ينتهي خلال ٩٠ يوماً</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contractExpiring.slice(0, 10).map(e => (
                          <span key={e.id} className="font-ui font-bold text-[12px] bg-brand-red/5 text-brand-red px-3 py-1.5 rounded-lg">
                            {e.preferredName} — {e.contractDaysRemaining} يوم
                          </span>
                        ))}
                        {contractExpiring.length > 10 && <span className="font-ui font-bold text-[12px] text-neutral-muted px-3 py-1.5">+{contractExpiring.length - 10} آخرين</span>}
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dept performance */}
                    {deptPerfData.length > 0 && (
                      <Card delay={0.3}>
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-4 h-4 text-brand-blue" />
                          <h3 className="font-ui font-black text-[15px]">أداء الإدارات</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={deptPerfData} layout="vertical" margin={{ right: 10, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                            <XAxis type="number" domain={[0, 5]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} width={90} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="score" fill="#0072F9" radius={[0, 8, 8, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {/* Top/Bottom performers */}
                    {topPerformers.length > 0 && (
                      <Card delay={0.35}>
                        <div className="grid grid-cols-2 gap-4 h-full">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="w-4 h-4 text-brand-green" />
                              <h3 className="font-ui font-black text-[14px]">أعلى ٥ أداءً</h3>
                            </div>
                            {topPerformers.slice(0, 5).map((p, i) => (
                              <div key={p.name} className="flex items-center gap-2 py-2 border-b border-neutral-cream last:border-0">
                                <span className="font-display font-black text-[16px] text-brand-green w-6">{i + 1}</span>
                                <span className="font-ui font-bold text-[13px] flex-1 truncate">{p.name}</span>
                                <span className="font-display font-black text-[14px] text-brand-green">{p.avg}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <ThumbsDown className="w-4 h-4 text-brand-red" />
                              <h3 className="font-ui font-black text-[14px]">يحتاجون تطوير</h3>
                            </div>
                            {topPerformers.slice(-5).reverse().map((p, i) => (
                              <div key={p.name} className="flex items-center gap-2 py-2 border-b border-neutral-cream last:border-0">
                                <span className="font-display font-black text-[16px] text-brand-red w-6">{i + 1}</span>
                                <span className="font-ui font-bold text-[13px] flex-1 truncate">{p.name}</span>
                                <span className="font-display font-black text-[14px] text-brand-red">{p.avg}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* World map */}
                  {(Object.keys(stats.locationDistribution).length > 0) && (
                    <Card delay={0.4}>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-brand-green" />
                        <h3 className="font-ui font-black text-[15px]">التوزيع الجغرافي</h3>
                      </div>
                      <WorldMap locationData={stats.locationDistribution} nationalityData={stats.nationalityDistribution} />
                    </Card>
                  )}

                  {/* Leader rankings */}
                  {leadersList.length > 0 && (
                    <Card delay={0.45}>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-brand-burgundy" />
                        <h3 className="font-ui font-black text-[15px]">ترتيب القادة</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {leadersList.map((ldr, i) => (
                          <motion.div key={ldr.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.03 }}
                            className="flex items-center gap-3 bg-neutral-cream rounded-xl p-3 cursor-pointer hover:bg-neutral-warm-gray transition-colors"
                            onClick={() => { setActiveTab('leaders'); setSelectedLeader(ldr.name); }}
                          >
                            <span className="font-display font-black text-[18px] w-7 text-neutral-muted">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-ui font-black text-[13px] truncate">{ldr.name}</p>
                              <p className="font-ui font-bold text-[11px] text-neutral-muted">{ldr.count} تقييم</p>
                            </div>
                            <span className="font-display font-black text-[20px]" style={{ color: ldr.avg >= 7 ? '#00C17A' : ldr.avg >= 5 ? '#FFBC0A' : '#F24935' }}>{ldr.avg}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Company structure */}
                  <Card delay={0.5}>
                    <h3 className="font-ui font-black text-[15px] mb-4">هيكل الشركة</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-brand-blue/5 rounded-xl">
                        <p className="font-display font-black text-[28px] text-brand-blue">{stats.departmentCount}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">إدارة</p>
                      </div>
                      <div className="text-center p-3 bg-brand-green/5 rounded-xl">
                        <p className="font-display font-black text-[28px] text-brand-green">{stats.teamCount}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">فريق</p>
                      </div>
                      <div className="text-center p-3 bg-brand-amber/5 rounded-xl">
                        <p className="font-display font-black text-[28px] text-brand-amber">{stats.leaders}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">قائد</p>
                      </div>
                      <div className="text-center p-3 bg-brand-burgundy/5 rounded-xl">
                        <p className="font-display font-black text-[28px] text-brand-burgundy">{stats.inProbation}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">في فترة تجربة</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ══════ DEPARTMENTS TAB ══════ */}
              {activeTab === 'departments' && (
                <motion.div key="departments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {!selectedDept ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departments.map((dept, i) => (
                        <motion.button
                          key={dept.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedDept(dept.name)}
                          className="bg-white rounded-2xl p-5 shadow-sm text-right hover:shadow-md transition-all border-2 border-transparent hover:border-brand-green/30"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-brand-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-ui font-black text-[15px] truncate">{dept.name}</h3>
                            </div>
                            <ChevronDown className="w-4 h-4 text-neutral-muted -rotate-90" />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <span className="font-ui font-bold text-[12px] text-brand-blue bg-brand-blue/5 px-2 py-1 rounded">{dept.employees.length} موظف</span>
                            {dept.reviews.length > 0 && <span className="font-ui font-bold text-[12px] text-brand-green bg-brand-green/5 px-2 py-1 rounded">{dept.reviews.length} تقييم أداء</span>}
                            {dept.evaluations.length > 0 && <span className="font-ui font-bold text-[12px] text-brand-amber bg-brand-amber/5 px-2 py-1 rounded">{dept.evaluations.length} تجربة</span>}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : deptDetail && (
                    <div className="space-y-6">
                      <button onClick={() => setSelectedDept(null)} className="font-ui font-black text-[14px] text-brand-blue hover:underline">
                        ← العودة لجميع الإدارات
                      </button>

                      <Card delay={0}>
                        <h2 className="font-display font-black text-[24px] mb-4">{deptDetail.name}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <Metric value={deptDetail.employees.length} label="موظف" color="#0072F9" />
                          <Metric value={deptDetail.leaders} label="قائد" color="#FFBC0A" />
                          <Metric value={deptDetail.avgService} label="متوسط الخدمة" color="#00C17A" />
                          <Metric value={deptDetail.teams.length} label="فريق" color="#84DBE5" />
                          <Metric value={`${deptDetail.genderM}/${deptDetail.genderF}`} label="ذكور/إناث" color="#0072F9" />
                          <Metric value={deptDetail.reviews.length} label="تقييم أداء" color="#00C17A" />
                        </div>
                      </Card>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Track distribution */}
                        {deptDetail.trackData.length > 0 && (
                          <Card delay={0.1}>
                            <h3 className="font-ui font-black text-[15px] mb-4">توزيع الدروب</h3>
                            <div className="flex items-center">
                              <ResponsiveContainer width="55%" height={200}>
                                <PieChart>
                                  <Pie data={deptDetail.trackData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                                    {deptDetail.trackData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="flex-1 space-y-2">
                                {deptDetail.trackData.map(t => (
                                  <div key={t.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                    <span className="font-ui font-black text-[13px]">{t.name}</span>
                                    <span className="font-ui font-bold text-[13px] text-neutral-muted mr-auto">{t.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Probation */}
                        {(deptDetail.confirmed > 0 || deptDetail.terminated > 0) && (
                          <Card delay={0.15}>
                            <h3 className="font-ui font-black text-[15px] mb-4">فترات التجربة</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <Metric value={deptDetail.confirmed} label="ترسيم" color="#00C17A" />
                              <Metric value={deptDetail.terminated} label="لم يستمر" color="#F24935" />
                              <Metric value={deptDetail.confirmed + deptDetail.terminated > 0 ? `${Math.round((deptDetail.confirmed / (deptDetail.confirmed + deptDetail.terminated)) * 100)}%` : '-'} label="معدل النجاح" color="#0072F9" />
                            </div>
                          </Card>
                        )}
                      </div>

                      {/* Teams */}
                      {deptDetail.teams.length > 0 && (
                        <Card delay={0.2}>
                          <h3 className="font-ui font-black text-[15px] mb-3">الفرق</h3>
                          <div className="flex flex-wrap gap-2">
                            {deptDetail.teams.map(t => (
                              <span key={t} className="font-ui font-bold text-[13px] bg-neutral-cream px-4 py-2 rounded-xl">{t}</span>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════ LEADERS TAB ══════ */}
              {activeTab === 'leaders' && (
                <motion.div key="leaders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {!selectedLeader ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {leadersList.map((ldr, i) => (
                        <motion.button
                          key={ldr.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedLeader(ldr.name)}
                          className="bg-white rounded-2xl p-5 shadow-sm text-right hover:shadow-md transition-all border-2 border-transparent hover:border-brand-burgundy/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: ldr.avg >= 7 ? '#00C17A15' : ldr.avg >= 5 ? '#FFBC0A15' : '#F2493515' }}>
                              <span className="font-display font-black text-[20px]" style={{ color: ldr.avg >= 7 ? '#00C17A' : ldr.avg >= 5 ? '#FFBC0A' : '#F24935' }}>{ldr.avg}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-ui font-black text-[15px] truncate">{ldr.name}</h3>
                              <p className="font-ui font-bold text-[12px] text-neutral-muted">{ldr.count} تقييم</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-neutral-muted -rotate-90" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : leaderDetail && (
                    <div className="space-y-6">
                      <button onClick={() => setSelectedLeader(null)} className="font-ui font-black text-[14px] text-brand-blue hover:underline">
                        ← العودة لجميع القادة
                      </button>

                      <Card delay={0}>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: leaderDetail.avg >= 7 ? '#00C17A15' : leaderDetail.avg >= 5 ? '#FFBC0A15' : '#F2493515' }}>
                            <span className="font-display font-black text-[28px]" style={{ color: leaderDetail.avg >= 7 ? '#00C17A' : leaderDetail.avg >= 5 ? '#FFBC0A' : '#F24935' }}>{leaderDetail.avg}</span>
                          </div>
                          <div>
                            <h2 className="font-display font-black text-[24px]">{leaderDetail.name}</h2>
                            <p className="font-ui font-bold text-[14px] text-neutral-muted">{leaderDetail.count} تقييم من الفريق</p>
                          </div>
                        </div>
                      </Card>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar */}
                        <Card delay={0.1}>
                          <h3 className="font-ui font-black text-[15px] mb-4">المحاور الأربعة</h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={leaderDetail.radarData}>
                              <PolarGrid stroke="#EFEDE2" />
                              <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 12, fontWeight: 900, fill: '#2B2D3F' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                              <Radar dataKey="score" stroke="#82003A" fill="#82003A" fillOpacity={0.25} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </Card>

                        {/* Score breakdown */}
                        <Card delay={0.15}>
                          <h3 className="font-ui font-black text-[15px] mb-4">تفصيل الدرجات</h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={leaderDetail.scoreData} layout="vertical" margin={{ right: 10, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                              <XAxis type="number" domain={[0, 10]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
                              <YAxis dataKey="name" type="category" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 10, fontWeight: 700 }} width={70} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="score" fill="#82003A" radius={[0, 6, 6, 0]} barSize={14} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card>
                      </div>

                      {/* Comments */}
                      {leaderDetail.comments.length > 0 && (
                        <Card delay={0.2}>
                          <h3 className="font-ui font-black text-[15px] mb-4">ملاحظات الفريق</h3>
                          <div className="space-y-3">
                            {leaderDetail.comments.map((c, i) => (
                              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                                className="bg-neutral-cream rounded-xl p-4">
                                <p className="font-body font-bold text-[14px] leading-relaxed whitespace-pre-wrap">{c}</p>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
