'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Building2,
  Calendar,
  Award,
  ClipboardCheck,
  TrendingUp,
  Star,
  Shield,
  MapPin,
  BarChart3,
  Layers,
  Target,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LabelList,
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import FileUploader from '@/components/upload/FileUploader';
import StatCard from '@/components/dashboard/StatCard';
import WorldMap from '@/components/dashboard/WorldMap';
import OrgChart from '@/components/dashboard/OrgChart';
import { useData } from '@/context/DataContext';
import { getOverallStats, getEvaluationInsights } from '@/lib/analytics';

const TRACK_COLORS: Record<string, string> = {
  'فخر': '#00C17A', 'خضر': '#B2E2BA', 'صفر': '#FFBC0A', 'حمر': '#F24935', 'خطر': '#82003A',
};

export default function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { data, cleanedData, qualityReport, hasData, isLoading } = useData();
  const [activeInsight, setActiveInsight] = useState(0);
  const [magicDeptIndex, setMagicDeptIndex] = useState(0);

  const activeData = cleanedData || data;

  const stats = useMemo(() => getOverallStats(data.employees, data.evaluations), [data.employees, data.evaluations]);
  const insights = useMemo(() => getEvaluationInsights(data.evaluations), [data.evaluations]);

  // ── Department chart ──
  const departmentData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    data.employees.forEach(e => { if (e.department) deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
    return Object.entries(deptMap).sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [data.employees]);

  // ── Track distribution ──
  const trackDistribution = useMemo(() => {
    const m: Record<string, number> = {};
    data.reviews.forEach(r => { if (r.generalTrack) m[r.generalTrack] = (m[r.generalTrack] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: TRACK_COLORS[name] || '#94a3b8' }));
  }, [data.reviews]);

  // ── Leader radar ──
  const leaderCategoryAvgs = useMemo(() => {
    if (data.leaders.length === 0) return [];
    const cats = [
      { label: 'الوضوح', fields: ['communication', 'prioritization', 'decisionMaking', 'goalSetting'] as const },
      { label: 'طريقة العمل', fields: ['empowerment', 'delegation', 'support', 'emotionalIntelligence'] as const },
      { label: 'قيادة الفريق', fields: ['morale', 'collaboration', 'environment', 'inclusion'] as const },
      { label: 'التطوير', fields: ['development', 'feedback', 'performance', 'creativity'] as const },
    ];
    return cats.map(cat => {
      let t = 0, c = 0;
      data.leaders.forEach(l => cat.fields.forEach(f => { const v = l[f]; if (typeof v === 'number' && v > 0) { t += v; c++; } }));
      return { subject: cat.label, score: c > 0 ? Math.round((t / c) * 10) / 10 : 0, fullMark: 10 };
    });
  }, [data.leaders]);

  // ── Performance bar ──
  const perfScoreAvgs = useMemo(() => {
    if (data.reviews.length === 0) return [];
    const labels: Record<string, string> = {
      outputQuality: 'جودة المخرجات', timeDiscipline: 'الانضباط', basecampUsage: 'بيسكامب',
      initiative: 'المبادرة', efficiency: 'الكفاءة', dependability: 'الاعتمادية',
      professionalDev: 'التطور', overallTrack: 'الدرب',
    };
    const sums: Record<string, { total: number; count: number }> = {};
    data.reviews.forEach(r => {
      for (const [k, v] of Object.entries(r.performanceScores)) {
        if (v > 0) { if (!sums[k]) sums[k] = { total: 0, count: 0 }; sums[k].total += v; sums[k].count++; }
      }
    });
    return Object.entries(sums).map(([k, { total, count }]) => ({ name: labels[k] || k, score: Math.round((total / count) * 10) / 10 }));
  }, [data.reviews]);

  // ── Key findings ──
  const keyFindings = useMemo(() => {
    const f: { title: string; subtitle: string }[] = [];
    if (data.employees.length > 0) {
      f.push({ title: `${data.employees.length} موظف في ثمانية`, subtitle: `عبر ${stats.departmentCount} إدارة و ${stats.teamCount} فريق عمل — متوسط الخدمة ${stats.avgServiceYears} سنة` });
      const fp = Math.round((stats.genderDistribution.female / Math.max(data.employees.length, 1)) * 100);
      if (fp > 0) f.push({ title: `التنوع: ${fp}% إناث — ${100 - fp}% ذكور`, subtitle: `${stats.genderDistribution.female} موظفة و ${stats.genderDistribution.male} موظف — ${stats.leaders} قائد في الفريق` });
    }
    if (data.reviews.length > 0) {
      const fakhrs = data.reviews.filter(r => r.generalTrack === 'فخر').length;
      f.push({ title: `${data.reviews.length} تقييم أداء — ${fakhrs} في درب الفخر`, subtitle: `${Math.round((fakhrs / data.reviews.length) * 100)}% حققوا أعلى مستويات الأداء في تقييم أناناس` });
      const ry = data.reviews.filter(r => r.retainEmployee === '✅' || r.retainEmployee === 'نعم').length;
      const rn = data.reviews.filter(r => r.retainEmployee === '❌' || r.retainEmployee === 'لا').length;
      if (ry + rn > 0) f.push({ title: `نسبة التمسك بالموظفين: ${Math.round((ry / (ry + rn)) * 100)}%`, subtitle: `${ry} موظف يتم التمسك بهم من أصل ${ry + rn} — مؤشر إيجابي على استقرار الفريق` });
    }
    if (data.evaluations.length > 0) {
      const c = data.evaluations.filter(e => e.finalDecision === 'confirmed').length;
      const t = data.evaluations.filter(e => e.finalDecision === 'terminated').length;
      if (c + t > 0) f.push({ title: `${Math.round((c / (c + t)) * 100)}% معدل نجاح فترات التجربة`, subtitle: `${c} تم ترسيمهم — ${t} لم يستمروا من أصل ${data.evaluations.length} تقييم` });
    }
    if (data.leaders.length > 0) {
      const ul = new Set(data.leaders.map(l => l.leaderName)).size;
      const avg = (data.leaders.reduce((s, l) => s + l.averageScore, 0) / data.leaders.length).toFixed(1);
      f.push({ title: `${ul} قائد تم تقييمهم ٣٦٠° — المتوسط ${avg}/١٠`, subtitle: `${data.leaders.length} تقييم قيادي شامل يغطي ٤ محاور أساسية` });
    }
    return f.length > 0 ? f : [{ title: 'مرحباً بك في منصة تقييمات ثمانية', subtitle: 'ابدأ برفع ملفات البيانات لعرض التحليلات' }];
  }, [data, stats]);

  useEffect(() => {
    if (keyFindings.length <= 1) return;
    const iv = setInterval(() => setActiveInsight(p => (p + 1) % keyFindings.length), 6000);
    return () => clearInterval(iv);
  }, [keyFindings.length]);

  // ── Station evaluations per department ──
  const stationByDept = useMemo(() => {
    if (data.reviews.length === 0) return [];
    const depts: Record<string, Record<string, number>> = {};
    data.reviews.forEach(r => {
      if (!r.department || !r.station) return;
      if (!depts[r.department]) depts[r.department] = {};
      depts[r.department][r.station] = (depts[r.department][r.station] || 0) + 1;
    });
    return Object.entries(depts).slice(0, 6).map(([dept, stations]) => ({
      name: dept.length > 12 ? dept.slice(0, 12) + '..' : dept,
      ...stations,
    }));
  }, [data.reviews]);

  const stationKeys = useMemo(() => {
    const keys = new Set<string>();
    stationByDept.forEach(d => Object.keys(d).filter(k => k !== 'name').forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [stationByDept]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-brand-black text-white px-4 py-2 rounded-lg shadow-lg font-ui text-[13px]">
        <p className="font-black">{label}</p>
        {payload.map((p, i) => <p key={i} className="font-bold">{p.name ? `${p.name}: ` : ''}{p.value}</p>)}
      </div>
    );
  };

  const goInsight = (dir: number) => setActiveInsight(p => (p + dir + keyFindings.length) % keyFindings.length);

  return (
    <div>
      <TopBar title="لوحة التحكم" />
      <div className="p-8">
        <AnimatePresence>
          {!isLoading && (!hasData || showUpload) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-8">
              <FileUploader onClose={hasData ? () => setShowUpload(false) : undefined} />
            </motion.div>
          )}
        </AnimatePresence>

        {hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {/* ── BIG Sliding Key Findings ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-l from-brand-black via-neutral-dark-slate to-brand-black rounded-2xl p-8 relative overflow-hidden min-h-[140px]"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-48 h-48 bg-brand-green rounded-full blur-[80px]" />
                <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-brand-blue rounded-full blur-[100px]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <button onClick={() => goInsight(-1)} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-brand-green" />
                    <span className="font-ui font-black text-[11px] text-brand-green uppercase tracking-[0.15em]">أبرز النتائج</span>
                  </div>
                  <div className="h-[60px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeInsight} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                        <h2 className="font-display font-black text-[26px] text-white leading-tight">{keyFindings[activeInsight].title}</h2>
                        <p className="font-ui font-bold text-[14px] text-white/50 mt-1">{keyFindings[activeInsight].subtitle}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-1.5 mt-4">
                    {keyFindings.map((_, i) => (
                      <button key={i} onClick={() => setActiveInsight(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === activeInsight ? 'w-8 bg-brand-green' : 'w-2 bg-white/20 hover:bg-white/40'}`} />
                    ))}
                  </div>
                </div>
                <button onClick={() => goInsight(1)} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
            </motion.div>

            {/* ── Row 1: Core Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="إجمالي الموظفين" value={stats.totalEmployees} subtitle={`${stats.departmentCount} إدارة`} icon={Users} color="#0072F9" delay={0} />
              <StatCard title="متوسط الخدمة" value={`${stats.avgServiceYears} سنة`} subtitle={`${stats.inProbation} في تجربة`} icon={Calendar} color="#00C17A" delay={0.05} />
              <StatCard title="القيادات" value={stats.leaders} subtitle={`${Math.round((stats.leaders / Math.max(stats.totalEmployees, 1)) * 100)}% من الفريق`} icon={Award} color="#FFBC0A" delay={0.1} />
              <StatCard title="الفرق" value={stats.teamCount} subtitle="فريق عمل" icon={Layers} color="#84DBE5" delay={0.15} />
            </div>

            {/* ── Row 2: Evaluation stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="تقييمات الأداء" value={data.reviews.length} subtitle="تقييم أناناس" icon={Star} color="#00C17A" delay={0.2} />
              <StatCard title="فترات التجربة" value={data.evaluations.length} subtitle={`${stats.firstImpressions} انطباع — ${stats.decisionStations} قرار`} icon={ClipboardCheck} color="#0072F9" delay={0.25} />
              <StatCard title="تقييمات القادة" value={data.leaders.length} subtitle={`${new Set(data.leaders.map(l => l.leaderName)).size} قائد`} icon={Shield} color="#82003A" delay={0.3} />
              <StatCard title="نسبة الترسيم" value={stats.confirmed + stats.terminated > 0 ? `${Math.round((stats.confirmed / (stats.confirmed + stats.terminated)) * 100)}%` : '-'} subtitle={`${stats.confirmed} ترسيم — ${stats.terminated} لم يستمر`} icon={TrendingUp} color="#F24935" delay={0.35} />
            </div>

            {/* ── Gender Visual (Icons) ── */}
            {(stats.genderDistribution.male > 0 || stats.genderDistribution.female > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm mb-6"
              >
                <h3 className="font-ui font-black text-[15px] mb-4">التوزيع حسب الجنس</h3>
                <div className="flex items-center gap-8">
                  {/* Male */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="14" r="5"/><line x1="14" y1="10" x2="21" y2="3"/><polyline points="15,3 21,3 21,9"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-display font-black text-[28px] text-brand-blue leading-none">{stats.genderDistribution.male}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">ذكور</p>
                      </div>
                    </div>
                    <div className="bg-neutral-cream rounded-full h-4 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((stats.genderDistribution.male / data.employees.length) * 100)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }} className="h-full bg-brand-blue rounded-full" />
                    </div>
                    <p className="font-ui font-black text-[13px] text-brand-blue mt-1">{Math.round((stats.genderDistribution.male / data.employees.length) * 100)}%</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-20 bg-neutral-warm-gray" />

                  {/* Female */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-pink-light/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-brand-pink-light" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#FFA5C6' }}>
                          <circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-display font-black text-[28px] leading-none" style={{ color: '#FFA5C6' }}>{stats.genderDistribution.female}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted">إناث</p>
                      </div>
                    </div>
                    <div className="bg-neutral-cream rounded-full h-4 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((stats.genderDistribution.female / data.employees.length) * 100)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: '#FFA5C6' }} />
                    </div>
                    <p className="font-ui font-black text-[13px] mt-1" style={{ color: '#FFA5C6' }}>{Math.round((stats.genderDistribution.female / data.employees.length) * 100)}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Department bar */}
              {departmentData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 20 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-brand-blue" />
                    <h3 className="font-ui font-black text-[15px]">توزيع الإدارات</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(300, departmentData.length * 38)}>
                    <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 120, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" horizontal={false} />
                      <XAxis type="number" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
                      <YAxis dataKey="name" type="category" tick={false} width={10} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#0072F9" radius={[0, 8, 8, 0]} barSize={20}>
                        <LabelList dataKey="name" position="right" style={{ fontFamily: 'Thmanyah Sans', fontSize: 13, fontWeight: 900, fill: '#2B2D3F' }} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Track pie */}
              {trackDistribution.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-brand-green" />
                    <h3 className="font-ui font-black text-[15px]">توزيع الدروب (أناناس)</h3>
                  </div>
                  <div className="flex items-center">
                    <ResponsiveContainer width="55%" height={280}>
                      <PieChart>
                        <Pie data={trackDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={3}>
                          {trackDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {trackDistribution.map(t => (
                        <div key={t.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="font-ui font-black text-[13px]">{t.name}</span>
                          <span className="font-ui font-bold text-[13px] text-neutral-muted mr-auto">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Performance averages */}
              {perfScoreAvgs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-brand-amber" />
                    <h3 className="font-ui font-black text-[15px]">متوسط درجات الأداء</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={perfScoreAvgs} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis dataKey="name" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 10, fontWeight: 700 }} interval={0} angle={-30} textAnchor="end" height={60} />
                      <YAxis domain={[0, 5]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" fill="#00C17A" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Leader radar */}
              {leaderCategoryAvgs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-brand-burgundy" />
                    <h3 className="font-ui font-black text-[15px]">تقييم القادة — المحاور الأربعة</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={leaderCategoryAvgs}>
                      <PolarGrid stroke="#EFEDE2" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 12, fontWeight: 900, fill: '#2B2D3F' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Radar name="المتوسط" dataKey="score" stroke="#82003A" fill="#82003A" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* ── Station evaluations (تقييمات المحطة) ── */}
            {stationByDept.length > 0 && stationKeys.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl p-6 shadow-sm mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-4 h-4 text-brand-blue" />
                  <h3 className="font-ui font-black text-[15px]">تقييمات المحطات حسب الإدارة</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stationByDept} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                    <XAxis dataKey="name" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 10, fontWeight: 700 }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {stationKeys.map((k, i) => (
                      <Bar key={k} dataKey={k} stackId="a" fill={['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5'][i % 6]} barSize={28} radius={i === stationKeys.length - 1 ? [6, 6, 0, 0] : undefined} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {stationKeys.map((k, i) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: ['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5'][i % 6] }} />
                      <span className="font-ui font-bold text-[12px] text-neutral-muted">{k}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── World Map ── */}
            {(Object.keys(stats.locationDistribution).length > 0 || Object.keys(stats.nationalityDistribution).length > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                className="bg-white rounded-2xl p-6 shadow-sm mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-brand-green" />
                  <h3 className="font-ui font-black text-[15px]">التوزيع الجغرافي للفريق</h3>
                </div>
                <WorldMap locationData={stats.locationDistribution} nationalityData={stats.nationalityDistribution} employees={data.employees} />
              </motion.div>
            )}

            {/* ── Org Chart ── */}
            {data.employees.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl p-6 shadow-sm mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-brand-burgundy" />
                  <h3 className="font-ui font-black text-[15px]">الهيكل التنظيمي</h3>
                </div>
                <OrgChart employees={data.employees} />
              </motion.div>
            )}

            {/* ── Probation summary ── */}
            {stats.totalEvaluations > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="bg-gradient-to-l from-score-excellent/5 via-white to-score-poor/5 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="font-ui font-black text-[15px] mb-4">ملخص فترات التجربة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="font-display font-black text-[40px] text-brand-green">{stats.confirmed}</p>
                    <p className="font-ui font-bold text-[13px] text-neutral-muted">تم ترسيمهم</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[40px] text-brand-red">{stats.terminated}</p>
                    <p className="font-ui font-bold text-[13px] text-neutral-muted">لم يستمروا</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[40px] text-brand-blue">{stats.firstImpressions}</p>
                    <p className="font-ui font-bold text-[13px] text-neutral-muted">انطباع أول</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[40px] text-brand-amber">{stats.decisionStations}</p>
                    <p className="font-ui font-bold text-[13px] text-neutral-muted">محطة قرار</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
