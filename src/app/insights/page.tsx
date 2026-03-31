'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, TrendingUp, Target, Users, BarChart3, Award, Briefcase, Star, UserCheck, Activity, Layers, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import TopBar from '@/components/layout/TopBar';
import RadialScore from '@/components/charts/RadialScore';
import { useData } from '@/context/DataContext';
import {
  computeOrgHealth,
  computeTalentRisk,
  generateRecommendations,
  computeOnboardingPipeline,
  computeLeadershipEffectiveness,
  computeSkillGaps,
  computeManagerCalibration,
  computeWorkforceComposition,
} from '@/lib/strategic-analytics';

const COLORS = ['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5', '#FF9172', '#D1C4E2'];
const PIE_COLORS = ['#0072F9', '#00C17A', '#FFBC0A', '#F24935', '#82003A', '#84DBE5', '#FF9172', '#D1C4E2'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; dataKey?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-black text-white px-4 py-2 rounded-lg shadow-lg font-ui text-[13px]">
      <p className="font-black">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold">
          {p.name ? `${p.name}: ` : ''}{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

function SectionHeader({ icon: Icon, title, subtitle, color }: { icon: React.ElementType; title: string; subtitle: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h2 className="font-display font-black text-[20px]">{title}</h2>
        <p className="font-ui font-bold text-[13px] text-neutral-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function InsightBox({ text }: { text: string }) {
  return (
    <div className="mt-4 bg-neutral-cream rounded-xl p-4">
      <p className="font-ui font-bold text-[13px] text-neutral-muted">
        <span className="text-brand-green font-black">💡 </span>{text}
      </p>
    </div>
  );
}

function getCalibrationColor(deviation: number): string {
  const abs = Math.abs(deviation);
  if (abs <= 0.5) return '#00C17A';
  if (abs <= 1) return '#FFBC0A';
  return '#F24935';
}

function getHeatmapColor(score: number): string {
  if (score >= 4.5) return '#00C17A';
  if (score >= 3.5) return '#B2E2BA';
  if (score >= 2.5) return '#FFBC0A';
  if (score >= 1.5) return '#FF9172';
  if (score > 0) return '#F24935';
  return '#EFEDE2';
}

export default function InsightsPage() {
  const { data, cleanedData, qualityReport } = useData();
  const activeData = cleanedData || data;

  const health = useMemo(() => computeOrgHealth(activeData), [activeData]);
  const risk = useMemo(() => computeTalentRisk(activeData), [activeData]);
  const recommendations = useMemo(() => generateRecommendations(activeData), [activeData]);
  const pipeline = useMemo(() => computeOnboardingPipeline(activeData), [activeData]);
  const leadership = useMemo(() => computeLeadershipEffectiveness(activeData.employees, activeData.leaders, activeData.reviews, activeData), [activeData]);
  const skills = useMemo(() => computeSkillGaps(activeData.reviews), [activeData]);
  const calibration = useMemo(() => computeManagerCalibration(activeData.reviews, activeData.evaluations), [activeData]);
  const composition = useMemo(() => computeWorkforceComposition(activeData.employees), [activeData]);

  return (
    <div className="min-h-screen bg-neutral-cream" dir="rtl">
      <TopBar title="الرؤى الاستراتيجية" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── 0. Data Quality Summary ── */}
        {qualityReport && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-cream"
          >
            <SectionHeader icon={Shield} title="جودة البيانات" subtitle="نتائج تنظيف وتوحيد البيانات" color="#0072F9" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-cream rounded-xl p-4 text-center">
                <p className="font-display font-black text-[28px] text-brand-blue">{qualityReport.totalEmployees}</p>
                <p className="font-ui font-bold text-[12px] text-neutral-muted">موظف</p>
              </div>
              <div className="bg-neutral-cream rounded-xl p-4 text-center">
                <p className="font-display font-black text-[28px] text-brand-green">
                  {qualityReport.totalEvaluations > 0 ? Math.round((qualityReport.matchedEvaluations / qualityReport.totalEvaluations) * 100) : 0}%
                </p>
                <p className="font-ui font-bold text-[12px] text-neutral-muted">
                  تطابق التقييمات ({qualityReport.matchedEvaluations}/{qualityReport.totalEvaluations})
                </p>
              </div>
              <div className="bg-neutral-cream rounded-xl p-4 text-center">
                <p className="font-display font-black text-[28px] text-brand-green">
                  {qualityReport.totalReviews > 0 ? Math.round((qualityReport.matchedReviews / qualityReport.totalReviews) * 100) : 0}%
                </p>
                <p className="font-ui font-bold text-[12px] text-neutral-muted">
                  تطابق مراجعات الأداء ({qualityReport.matchedReviews}/{qualityReport.totalReviews})
                </p>
              </div>
              <div className="bg-neutral-cream rounded-xl p-4 text-center">
                <p className="font-display font-black text-[28px] text-brand-green">
                  {qualityReport.totalLeaders > 0 ? Math.round((qualityReport.matchedLeaders / qualityReport.totalLeaders) * 100) : 0}%
                </p>
                <p className="font-ui font-bold text-[12px] text-neutral-muted">
                  تطابق تقييمات القيادة ({qualityReport.matchedLeaders}/{qualityReport.totalLeaders})
                </p>
              </div>
            </div>
            {(qualityReport.garbageRemoved > 0 || qualityReport.duplicatesRemoved > 0) && (
              <div className="mt-4 flex gap-4">
                {qualityReport.garbageRemoved > 0 && (
                  <span className="font-ui font-bold text-[12px] bg-red-50 text-red-600 px-3 py-1 rounded-lg">
                    🗑️ تم حذف {qualityReport.garbageRemoved} سجل غير صالح
                  </span>
                )}
                {qualityReport.duplicatesRemoved > 0 && (
                  <span className="font-ui font-bold text-[12px] bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">
                    🔄 تم حذف {qualityReport.duplicatesRemoved} سجل مكرر
                  </span>
                )}
              </div>
            )}
          </motion.section>
        )}

        {/* ── 1. Org Health Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="bg-gradient-to-br from-brand-green/5 via-white to-brand-blue/5 rounded-2xl p-8 shadow-sm"
        >
          <SectionHeader icon={TrendingUp} title="صحة المنظمة" subtitle="مؤشر شامل لأداء المنظمة" color="#00C17A" />

          <div className="flex flex-col items-center mb-8">
            <RadialScore score={health.composite} maxScore={100} size={180} label="المؤشر الشامل" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'تقييم القادة', value: health.leaderScore, color: '#00C17A' },
              { label: 'نجاح التجربة', value: health.probationRate, color: '#0072F9' },
              { label: 'صحة الأداء', value: health.performanceHealth, color: '#FFBC0A' },
              { label: 'معدل الاحتفاظ', value: health.retentionRate, color: '#82003A' },
            ].map((m, i) => (
              <div key={i} className="text-center p-4 bg-white rounded-xl shadow-sm">
                <p className="font-display font-black text-[32px]" style={{ color: m.color }}>{Math.round(m.value)}%</p>
                <p className="font-ui font-bold text-[12px] text-neutral-muted mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {health.byDepartment.length > 0 && (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={health.byDepartment} layout="vertical" margin={{ right: 80, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#00C17A" radius={[0, 6, 6, 0]} name="الصحة" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 bg-neutral-cream rounded-xl p-4">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">
                <span className="text-brand-green font-black">💡 </span>المؤشر الشامل للمنظمة <span className="text-brand-green font-black bg-brand-green/10 px-1.5 py-0.5 rounded">{health.composite}/١٠٠</span> — {health.composite >= 70 ? 'أداء جيد، استمروا بالتحسين' : health.composite >= 50 ? 'أداء متوسط يحتاج انتباه' : 'أداء ضعيف يتطلب تدخل عاجل'}
              </p>
            </div>
        </motion.section>

        {/* ── 2. Talent Risk ── */}
        {(risk.critical.length + risk.high.length + risk.medium.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={AlertTriangle} title="مخاطر المواهب" subtitle="الموظفون المعرضون لخطر المغادرة أو الأداء المنخفض" color="#F24935" />

            <div className="flex gap-4 mb-6">
              {[
                { label: 'حرج', count: risk.critical.length, color: '#F24935' },
                { label: 'مرتفع', count: risk.high.length, color: '#FFBC0A' },
                { label: 'متوسط', count: risk.medium.length, color: '#FFD97A' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                  <span className="font-display font-black text-[24px]" style={{ color: s.color }}>{s.count}</span>
                  <span className="font-ui font-bold text-[13px] text-neutral-muted">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(() => {
                const allRisk = [...risk.critical.map(r => ({ ...r, level: 'critical' as const })), ...risk.high.map(r => ({ ...r, level: 'high' as const })), ...risk.medium.map(r => ({ ...r, level: 'medium' as const }))];
                const shown = allRisk.slice(0, 15);
                const remaining = allRisk.length - shown.length;
                return (
                  <>
                    {shown.map((r, i) => {
                      const bg = r.level === 'critical' ? '#F2493520' : r.level === 'high' ? '#FFBC0A20' : '#FFD97A20';
                      const textColor = r.level === 'critical' ? '#F24935' : r.level === 'high' ? '#FFBC0A' : '#B8860B';
                      return (
                        <div key={i} className="px-3 py-1.5 rounded-lg font-ui font-bold text-[12px]" style={{ backgroundColor: bg, color: textColor }}>
                          {r.employee.preferredName || r.employee.name} ({r.score})
                        </div>
                      );
                    })}
                    {remaining > 0 && (
                      <div className="px-3 py-1.5 rounded-lg font-ui font-bold text-[12px] bg-neutral-cream text-neutral-muted">
                        و{remaining} آخرين
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {risk.byDepartment.length > 0 && (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={risk.byDepartment} layout="vertical" margin={{ right: 80, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="critical" stackId="risk" fill="#F24935" name="حرج" />
                    <Bar dataKey="high" stackId="risk" fill="#FFBC0A" name="مرتفع" />
                    <Bar dataKey="medium" stackId="risk" fill="#FFD97A" name="متوسط" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 bg-neutral-cream rounded-xl p-4">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">
                <span className="text-brand-green font-black">💡 </span><span className="text-brand-green font-black bg-brand-green/10 px-1.5 py-0.5 rounded">{risk.critical.length}</span> موظف في خطر حرج — ركزوا على العقود المنتهية والموظفين غير المُتمسَّك بهم
              </p>
            </div>
          </motion.section>
        )}

        {/* ── 3. Strategic Recommendations ── */}
        {recommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={Target} title="التوصيات الاستراتيجية" subtitle="إجراءات مقترحة بناءً على البيانات" color="#0072F9" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, i) => {
                const borderColor = rec.severity === 'critical' ? '#F24935' : rec.severity === 'warning' ? '#FFBC0A' : '#0072F9';
                const RecIcon = rec.severity === 'critical' ? AlertTriangle : rec.severity === 'warning' ? TrendingUp : BarChart3;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-neutral-cream/50"
                    style={{ borderRight: `4px solid ${borderColor}` }}
                  >
                    <div className="flex items-start gap-3">
                      <RecIcon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: borderColor }} />
                      <div>
                        <p className="font-ui font-black text-[14px] text-brand-black">{rec.title}</p>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted mt-1">{rec.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <InsightBox text={`${recommendations.filter(r => r.severity === 'critical').length} توصية حرجة و${recommendations.filter(r => r.severity === 'warning').length} تحذير يحتاج متابعة`} />
          </motion.section>
        )}

        {/* ── 4. Onboarding Pipeline ── */}
        {pipeline.funnel.some(f => f.count > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={Activity} title="مسار التأهيل" subtitle="من التعيين إلى الترسيم" color="#00C17A" />

            <div className="flex flex-col items-center gap-2 mb-8">
              {pipeline.funnel.map((stage, i) => {
                const widths = [100, 85, 70, 55, 40];
                const colors = ['#0072F9', '#00C17A', '#FFBC0A', '#00C17A', '#F24935'];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg py-3 px-4 flex items-center justify-between font-ui font-bold text-[13px] text-white"
                    style={{ width: `${widths[i]}%`, backgroundColor: colors[i] }}
                  >
                    <span>{stage.stage}</span>
                    <span className="font-display font-black">{stage.count}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pipeline.byDepartment.length > 0 && (
                <div>
                  <h3 className="font-ui font-black text-[14px] mb-3">نسبة النجاح بالإدارات</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipeline.byDepartment} layout="vertical" margin={{ right: 60, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="rate" fill="#00C17A" radius={[0, 6, 6, 0]} name="نسبة النجاح %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {pipeline.byEvaluator.length > 0 && (
                <div>
                  <h3 className="font-ui font-black text-[14px] mb-3">أداء المقيّمين</h3>
                  <div className="space-y-2">
                    {pipeline.byEvaluator.slice(0, 10).map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-cream/50">
                        <span className="font-ui font-bold text-[13px]">{ev.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-ui font-bold text-[12px] text-neutral-muted">{ev.total} تقييم</span>
                          <span className="font-display font-black text-[14px] text-brand-green">{Math.round(ev.rate)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 bg-neutral-cream rounded-xl p-4">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">
                <span className="text-brand-green font-black">💡 </span>{pipeline.funnel[3]?.count || 0} موظف تم ترسيمهم من أصل {pipeline.funnel[0]?.count || 0} — معدل تحويل <span className="text-brand-green font-black bg-brand-green/10 px-1.5 py-0.5 rounded">{pipeline.funnel[0]?.count ? Math.round(((pipeline.funnel[3]?.count || 0) / pipeline.funnel[0].count) * 100) : 0}%</span>
              </p>
            </div>
          </motion.section>
        )}

        {/* ── 5. Leadership Effectiveness ── */}
        {leadership.ranking.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={Shield} title="فعالية القيادة" subtitle="تصنيف القادة ومجالات التطوير" color="#82003A" />

            <div className="mb-6">
              <h3 className="font-ui font-black text-[14px] mb-3">ترتيب القادة (أعلى ١٠)</h3>
              <div className="space-y-2">
                {leadership.ranking.slice(0, 10).map((leader, i) => {
                  const maxScore = Math.max(...leadership.ranking.map(l => l.score360), 10);
                  const barWidth = maxScore > 0 ? (leader.score360 / maxScore) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="font-ui font-bold text-[13px] w-28 shrink-0 truncate">{leader.name}</span>
                      <div className="flex-1 h-7 bg-neutral-cream rounded-full overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: '#82003A' }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${barWidth}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.6 }}
                        />
                        <span className="absolute inset-y-0 flex items-center px-3 font-display font-black text-[12px] text-white">
                          {leader.score360.toFixed(1)}
                        </span>
                      </div>
                      <span className="font-ui font-bold text-[11px] text-neutral-muted shrink-0">فريق: {leader.teamSize}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leadership.topVsBottom.length > 0 && (
                <div>
                  <h3 className="font-ui font-black text-[14px] mb-3">مقارنة الأعلى والأدنى</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={leadership.topVsBottom}>
                        <PolarGrid stroke="#EFEDE2" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar name="الأعلى" dataKey="topScore" stroke="#00C17A" fill="#00C17A" fillOpacity={0.3} />
                        <Radar name="الأدنى" dataKey="bottomScore" stroke="#F24935" fill="#F24935" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {leadership.coachingNeeded.length > 0 && (
                <div>
                  <h3 className="font-ui font-black text-[14px] mb-3">يحتاجون تطوير</h3>
                  <div className="space-y-3">
                    {leadership.coachingNeeded.slice(0, 6).map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-neutral-cream/50 border-r-4 border-brand-amber">
                        <p className="font-ui font-black text-[13px] text-brand-black">{c.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.weakAreas.map((area, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-md bg-brand-amber/10 font-ui font-bold text-[11px] text-brand-amber">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <InsightBox text={`أفضل قائد: ${leadership.ranking[0]?.name || '-'} بدرجة ${leadership.ranking[0]?.score360.toFixed(1) || '0'}/١٠ — ${leadership.coachingNeeded.length} قائد يحتاج خطة تطوير`} />
          </motion.section>
        )}

        {/* ── 6. Skill Gap Analysis ── */}
        {skills.orgRadar.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={Star} title="تحليل فجوات المهارات" subtitle="المعايير الثمانية للأداء" color="#FFBC0A" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skills.orgRadar}>
                    <PolarGrid stroke="#EFEDE2" />
                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name="المتوسط" dataKey="score" stroke="#FFBC0A" fill="#FFBC0A" fillOpacity={0.3} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-ui font-black text-[14px] mb-3">أضعف ٣ معايير</h3>
                <div className="space-y-3">
                  {skills.bottom3.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-neutral-cream/50 border-r-4 border-brand-red">
                      <div className="flex items-center justify-between">
                        <span className="font-ui font-black text-[14px]">{item.label}</span>
                        <span className="font-display font-black text-[20px] text-brand-red">{item.score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-neutral-cream rounded-full h-2 mt-2">
                        <div className="h-2 rounded-full bg-brand-red" style={{ width: `${(item.score / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {skills.heatmap.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="font-ui font-black text-[14px] mb-3">خريطة حرارية بالإدارات</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 font-ui font-black text-[12px] text-right">الإدارة</th>
                      {skills.orgRadar.map((c, i) => (
                        <th key={i} className="p-2 font-ui font-bold text-[10px] text-center">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {skills.heatmap.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 font-ui font-bold text-[12px]">{row.department}</td>
                        {skills.orgRadar.map((c, j) => {
                          const val = row.scores[c.criterion] || 0;
                          return (
                            <td key={j} className="p-1 text-center">
                              <div
                                className="rounded-md py-1 font-display font-black text-[12px] text-white"
                                style={{ backgroundColor: getHeatmapColor(val) }}
                              >
                                {val > 0 ? val.toFixed(1) : '-'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 bg-neutral-cream rounded-xl p-4">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">
                <span className="text-brand-green font-black">💡 </span>أضعف معيار: {skills.bottom3[0]?.label || '-'} بمتوسط <span className="text-brand-green font-black bg-brand-green/10 px-1.5 py-0.5 rounded">{skills.bottom3[0]?.score.toFixed(1) || '0'}/٥</span> — فرصة تدريب مباشرة
              </p>
            </div>
          </motion.section>
        )}

        {/* ── 7. Manager Calibration ── */}
        {calibration.perfCalibration.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={UserCheck} title="معايرة المديرين" subtitle="مقارنة تقييمات المديرين بالمتوسط العام" color="#0072F9" />

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calibration.perfCalibration.slice(0, 15).map(m => ({
                    ...m,
                    fill: getCalibrationColor(m.deviation),
                  }))}
                  layout="vertical"
                  margin={{ right: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="manager" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={calibration.orgAvgPerf} stroke="#2B2D3F" strokeDasharray="3 3" label={{ value: `المتوسط ${calibration.orgAvgPerf.toFixed(1)}`, fontSize: 11, position: 'top' }} />
                  {calibration.perfCalibration.slice(0, 15).map((entry, index) => (
                    <Bar
                      key={index}
                      dataKey="avgGiven"
                      name="المتوسط المُعطى"
                      radius={[0, 6, 6, 0]}
                      fill={getCalibrationColor(entry.deviation)}
                      isAnimationActive={false}
                    />
                  )).slice(0, 1)}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <InsightBox text={`${calibration.perfCalibration.filter(m => Math.abs(m.deviation) > 1).length} مدير انحرافه أكثر من ١ نقطة عن المتوسط — مراجعة المعايرة مطلوبة`} />
          </motion.section>
        )}

        {/* ── 8. Workforce Composition ── */}
        {data.employees.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <SectionHeader icon={Layers} title="تركيبة القوى العاملة" subtitle="توزيع الموظفين حسب الخبرة والعمر ونوع العمل" color="#14B8A6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenure */}
              <div>
                <h3 className="font-ui font-black text-[14px] mb-3">سنوات الخدمة</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={composition.tenureBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} name="العدد" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Age */}
              <div>
                <h3 className="font-ui font-black text-[14px] mb-3">الفئات العمرية</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={composition.ageBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#0072F9" radius={[6, 6, 0, 0]} name="العدد" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leadership density */}
              <div>
                <h3 className="font-ui font-black text-[14px] mb-3">كثافة القيادة</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={composition.leadershipDensity} layout="vertical" margin={{ right: 60, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="dept" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="density" fill="#82003A" radius={[0, 6, 6, 0]} name="النسبة %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Work types */}
              <div>
                <h3 className="font-ui font-black text-[14px] mb-3">نوع العمل</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={composition.workTypes}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }: { name?: string; value?: number }) => `${name || ''}: ${value || 0}`}
                      >
                        {composition.workTypes.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <InsightBox text={`${data.employees.length} موظف — أكبر شريحة عمرية: ${composition.ageBuckets.reduce((a, b) => a.count > b.count ? a : b, { bucket: '-', count: 0 }).bucket} سنة`} />
          </motion.section>
        )}

      </div>
    </div>
  );
}
