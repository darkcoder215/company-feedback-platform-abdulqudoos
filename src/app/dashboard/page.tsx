'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Building2,
  Calendar,
  Award,
  ClipboardCheck,
  UserCheck,
  UserX,
  TrendingUp,
  Star,
  Shield,
  MapPin,
  BarChart3,
  Layers,
  Briefcase,
  Target,
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
  Legend,
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import FileUploader from '@/components/upload/FileUploader';
import StatCard from '@/components/dashboard/StatCard';
import { useData } from '@/context/DataContext';
import { getOverallStats, getEvaluationInsights } from '@/lib/analytics';

const TRACK_COLORS: Record<string, string> = {
  'فخر': '#00C17A',
  'خضر': '#B2E2BA',
  'صفر': '#FFBC0A',
  'حمر': '#F24935',
  'خطر': '#82003A',
};

const PIE_COLORS = ['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5', '#FF9172', '#D1C4E2', '#FFA5C6', '#FFD1C4'];

export default function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { data, hasData, isLoading } = useData();
  const [activeInsight, setActiveInsight] = useState(0);

  const stats = useMemo(
    () => getOverallStats(data.employees, data.evaluations),
    [data.employees, data.evaluations]
  );

  const insights = useMemo(
    () => getEvaluationInsights(data.evaluations),
    [data.evaluations]
  );

  // ── Derived chart data ──

  const departmentData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    for (const emp of data.employees) {
      if (emp.department) deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    }
    return Object.entries(deptMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, fullName: name, count }));
  }, [data.employees]);

  const trackDistribution = useMemo(() => {
    const trackMap: Record<string, number> = {};
    for (const rev of data.reviews) {
      if (rev.generalTrack) trackMap[rev.generalTrack] = (trackMap[rev.generalTrack] || 0) + 1;
    }
    return Object.entries(trackMap).map(([name, value]) => ({
      name,
      value,
      color: TRACK_COLORS[name] || '#94a3b8',
    }));
  }, [data.reviews]);

  const leaderCategoryAvgs = useMemo(() => {
    if (data.leaders.length === 0) return [];
    const cats = [
      { key: 'clarity', label: 'الوضوح والأولويات', fields: ['communication', 'prioritization', 'decisionMaking', 'goalSetting'] as const },
      { key: 'workMethod', label: 'طريقة العمل', fields: ['empowerment', 'delegation', 'support', 'emotionalIntelligence'] as const },
      { key: 'teamLead', label: 'قيادة الفريق', fields: ['morale', 'collaboration', 'environment', 'inclusion'] as const },
      { key: 'development', label: 'الدعم والتطوير', fields: ['development', 'feedback', 'performance', 'creativity'] as const },
    ];
    return cats.map(cat => {
      let total = 0, count = 0;
      for (const ldr of data.leaders) {
        for (const f of cat.fields) {
          const v = ldr[f];
          if (typeof v === 'number' && v > 0) { total += v; count++; }
        }
      }
      return { subject: cat.label, score: count > 0 ? Math.round((total / count) * 10) / 10 : 0, fullMark: 10 };
    });
  }, [data.leaders]);

  const genderPieData = useMemo(() => [
    { name: 'ذكر', value: stats.genderDistribution.male, color: '#0072F9' },
    { name: 'أنثى', value: stats.genderDistribution.female, color: '#FFA5C6' },
  ].filter(d => d.value > 0), [stats]);

  const nationalityData = useMemo(() => {
    return Object.entries(stats.nationalityDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [stats]);

  // ── Sliding key findings ──

  const keyFindings = useMemo(() => {
    const findings: string[] = [];
    if (data.employees.length > 0) {
      findings.push(`يضم فريق ثمانية ${data.employees.length} موظفاً عبر ${stats.departmentCount} إدارة و${stats.teamCount} فريق عمل`);
      findings.push(`متوسط سنوات الخدمة ${stats.avgServiceYears} سنة — مع ${stats.leaders} قائداً في الفريق`);
      if (stats.genderDistribution.male > 0 || stats.genderDistribution.female > 0) {
        const femalePercent = Math.round((stats.genderDistribution.female / data.employees.length) * 100);
        findings.push(`نسبة التنوع: ${femalePercent}% إناث — ${100 - femalePercent}% ذكور`);
      }
    }
    if (data.reviews.length > 0) {
      const fakhrs = data.reviews.filter(r => r.generalTrack === 'فخر').length;
      const total = data.reviews.length;
      findings.push(`${total} تقييم أداء (أناناس) — ${fakhrs} موظف في درب الفخر (${Math.round((fakhrs / total) * 100)}%)`);
      const retainYes = data.reviews.filter(r => r.retainEmployee === '✅' || r.retainEmployee === 'نعم').length;
      const retainNo = data.reviews.filter(r => r.retainEmployee === '❌' || r.retainEmployee === 'لا').length;
      if (retainYes + retainNo > 0) {
        findings.push(`نسبة التمسك بالموظفين: ${Math.round((retainYes / (retainYes + retainNo)) * 100)}% — مؤشر إيجابي على استقرار الفريق`);
      }
    }
    if (data.evaluations.length > 0) {
      const confirmed = data.evaluations.filter(e => e.finalDecision === 'confirmed').length;
      const terminated = data.evaluations.filter(e => e.finalDecision === 'terminated').length;
      if (confirmed + terminated > 0) {
        findings.push(`فترات التجربة: ${Math.round((confirmed / (confirmed + terminated)) * 100)}% تم ترسيمهم بنجاح من أصل ${confirmed + terminated} موظف`);
      }
    }
    if (data.leaders.length > 0) {
      const uniqueLeaders = new Set(data.leaders.map(l => l.leaderName)).size;
      const avg = data.leaders.reduce((s, l) => s + l.averageScore, 0) / data.leaders.length;
      findings.push(`${data.leaders.length} تقييم قيادي لـ ${uniqueLeaders} قائداً — المتوسط العام ${avg.toFixed(1)} من ١٠`);
    }
    return findings.length > 0 ? findings : ['مرحباً بك في منصة تقييمات ثمانية'];
  }, [data, stats]);

  // Rotate key findings
  useEffect(() => {
    if (keyFindings.length <= 1) return;
    const interval = setInterval(() => {
      setActiveInsight(prev => (prev + 1) % keyFindings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [keyFindings.length]);

  // Performance score averages for bar chart
  const perfScoreAvgs = useMemo(() => {
    if (data.reviews.length === 0) return [];
    const labels: Record<string, string> = {
      outputQuality: 'جودة المخرجات',
      timeDiscipline: 'الانضباط',
      basecampUsage: 'بيسكامب',
      initiative: 'المبادرة',
      efficiency: 'الكفاءة',
      dependability: 'الاعتمادية',
      professionalDev: 'التطور المهني',
      overallTrack: 'الدرب العام',
    };
    const sums: Record<string, { total: number; count: number }> = {};
    for (const rev of data.reviews) {
      for (const [key, value] of Object.entries(rev.performanceScores)) {
        if (value > 0) {
          if (!sums[key]) sums[key] = { total: 0, count: 0 };
          sums[key].total += value;
          sums[key].count++;
        }
      }
    }
    return Object.entries(sums).map(([key, { total, count }]) => ({
      name: labels[key] || key,
      score: Math.round((total / count) * 10) / 10,
    }));
  }, [data.reviews]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-brand-black text-white px-4 py-2 rounded-lg shadow-lg font-ui text-[13px]">
        <p className="font-bold">{label}</p>
        <p>{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div>
      <TopBar title="لوحة التحكم" />

      <div className="p-8">
        {/* Upload section */}
        <AnimatePresence>
          {!isLoading && (!hasData || showUpload) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-8">
              <FileUploader onClose={hasData ? () => setShowUpload(false) : undefined} />
            </motion.div>
          )}
        </AnimatePresence>

        {hasData && (
          <>
            {/* ── Sliding Key Findings Banner ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-l from-brand-black via-neutral-dark-slate to-brand-black rounded-xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand-green rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-blue rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-brand-green" />
                  <span className="font-ui font-bold text-[12px] text-brand-green uppercase tracking-wider">
                    أبرز النتائج
                  </span>
                </div>
                <div className="h-[32px] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeInsight}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="font-display font-bold text-[18px] text-white absolute inset-0"
                    >
                      {keyFindings[activeInsight]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                {/* Indicator dots */}
                <div className="flex gap-1.5 mt-4">
                  {keyFindings.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveInsight(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeInsight ? 'w-6 bg-brand-green' : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Row 1: Core Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="إجمالي الموظفين" value={stats.totalEmployees} subtitle={`${stats.departmentCount} إدارة`} icon={Users} color="#0072F9" delay={0} />
              <StatCard title="متوسط الخدمة" value={`${stats.avgServiceYears} سنة`} subtitle={`${stats.inProbation} في تجربة`} icon={Calendar} color="#00C17A" delay={0.05} />
              <StatCard title="القيادات" value={stats.leaders} subtitle={`${Math.round((stats.leaders / Math.max(stats.totalEmployees, 1)) * 100)}% من الفريق`} icon={Award} color="#FFBC0A" delay={0.1} />
              <StatCard title="الفرق" value={stats.teamCount} subtitle="فريق عمل" icon={Layers} color="#84DBE5" delay={0.15} />
            </div>

            {/* ── Row 2: Evaluation highlights ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="تقييمات الأداء" value={data.reviews.length} subtitle="تقييم أناناس" icon={Star} color="#00C17A" delay={0.2} />
              <StatCard title="فترات التجربة" value={data.evaluations.length} subtitle={`${stats.firstImpressions} انطباع — ${stats.decisionStations} قرار`} icon={ClipboardCheck} color="#0072F9" delay={0.25} />
              <StatCard title="تقييمات القادة" value={data.leaders.length} subtitle={`${new Set(data.leaders.map(l => l.leaderName)).size} قائد`} icon={Shield} color="#82003A" delay={0.3} />
              <StatCard
                title="نسبة الترسيم"
                value={stats.confirmed + stats.terminated > 0 ? `${Math.round((stats.confirmed / (stats.confirmed + stats.terminated)) * 100)}%` : '-'}
                subtitle={`${stats.confirmed} ترسيم — ${stats.terminated} لم يستمر`}
                icon={TrendingUp}
                color="#F24935"
                delay={0.35}
              />
            </div>

            {/* ── Row 3: Charts Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Department bar chart */}
              {departmentData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-brand-blue" />
                    <h3 className="font-ui font-bold text-[15px]">توزيع الإدارات</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={departmentData} layout="vertical" margin={{ right: 100, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis type="number" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11 }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#0072F9" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Track distribution pie */}
              {trackDistribution.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-brand-green" />
                    <h3 className="font-ui font-bold text-[15px]">توزيع الدروب (أناناس)</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={trackDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} (${value})`}>
                        {trackDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Performance score averages */}
              {perfScoreAvgs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-brand-amber" />
                    <h3 className="font-ui font-bold text-[15px]">متوسط درجات الأداء</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={perfScoreAvgs} margin={{ right: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis dataKey="name" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 10 }} />
                      <YAxis domain={[0, 5]} tick={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" fill="#00C17A" radius={[6, 6, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Leader radar chart */}
              {leaderCategoryAvgs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-brand-burgundy" />
                    <h3 className="font-ui font-bold text-[15px]">تقييم القادة — المحاور الأربعة</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={leaderCategoryAvgs}>
                      <PolarGrid stroke="#EFEDE2" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fill: '#494C6B' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Radar name="المتوسط" dataKey="score" stroke="#82003A" fill="#82003A" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* ── Row 4: Gender + Nationality + Locations ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Gender pie */}
              {genderPieData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <h3 className="font-ui font-bold text-[15px] mb-4">توزيع الجنس</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {genderPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none' }} />
                      <Legend formatter={(v) => <span style={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Nationality distribution */}
              {nationalityData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <h3 className="font-ui font-bold text-[15px] mb-4">الجنسيات الأكثر</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={nationalityData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                        {nationalityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: 'Thmanyah Sans', fontSize: 13, borderRadius: 8, border: 'none' }} />
                      <Legend formatter={(v) => <span style={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Locations */}
              {Object.keys(stats.locationDistribution).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-brand-blue" />
                    <h3 className="font-ui font-bold text-[15px]">المواقع</h3>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(stats.locationDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([location, count]) => {
                        const pct = Math.round((count / data.employees.length) * 100);
                        return (
                          <div key={location} className="flex items-center gap-3">
                            <span className="font-ui font-bold text-[13px] w-[100px] truncate">{location}</span>
                            <div className="flex-1 bg-neutral-cream rounded-full h-5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.8, duration: 0.6 }}
                                className="h-full bg-brand-blue/20 rounded-full flex items-center justify-end px-2"
                              >
                                <span className="font-ui font-bold text-[10px] text-brand-blue">{count}</span>
                              </motion.div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Row 5: Probation Quick Stats ── */}
            {stats.totalEvaluations > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                className="bg-gradient-to-l from-score-excellent/5 via-white to-score-poor/5 rounded-xl p-6 shadow-sm mb-6"
              >
                <h3 className="font-ui font-bold text-[15px] mb-4">ملخص فترات التجربة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="font-display font-black text-[36px] text-brand-green">{stats.confirmed}</p>
                    <p className="font-ui text-[13px] text-neutral-muted">تم ترسيمهم</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[36px] text-brand-red">{stats.terminated}</p>
                    <p className="font-ui text-[13px] text-neutral-muted">لم يستمروا</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[36px] text-brand-blue">{stats.firstImpressions}</p>
                    <p className="font-ui text-[13px] text-neutral-muted">انطباع أول</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-[36px] text-brand-amber">{stats.decisionStations}</p>
                    <p className="font-ui text-[13px] text-neutral-muted">محطة قرار</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
