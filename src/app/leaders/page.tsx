'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';

const SCORE_CATEGORIES = [
  { key: 'clarity', label: 'الوضوح والأولويات', fields: ['communication', 'prioritization', 'decisionMaking', 'goalSetting'] as const, commentField: 'clarityComments' as const },
  { key: 'workMethod', label: 'طريقة العمل', fields: ['empowerment', 'delegation', 'support', 'emotionalIntelligence'] as const, commentField: 'workMethodComments' as const },
  { key: 'teamLeadership', label: 'قيادة الفريق', fields: ['morale', 'collaboration', 'environment', 'inclusion'] as const, commentField: 'teamLeadershipComments' as const },
  { key: 'development', label: 'الدعم والتطوير', fields: ['development', 'feedback', 'performance', 'creativity'] as const, commentField: 'developmentComments' as const },
];

const FIELD_LABELS: Record<string, string> = {
  communication: 'توصيل المعلومة',
  prioritization: 'تحديد الأولويات',
  decisionMaking: 'اتخاذ القرارات',
  goalSetting: 'بناء الأهداف',
  empowerment: 'التمكين والاستقلالية',
  delegation: 'التفويض',
  support: 'تقديم العون',
  emotionalIntelligence: 'الوعي الذاتي',
  morale: 'المعنويات',
  collaboration: 'التعاون',
  environment: 'البيئة الإيجابية',
  inclusion: 'إشراك الفريق',
  development: 'التطوير المهني',
  feedback: 'المرئيات البناءة',
  performance: 'رفع الأداء',
  creativity: 'التفكير الإبداعي',
};

function getScoreColor(score: number): string {
  if (score >= 8) return '#00C17A';
  if (score >= 6) return '#B2E2BA';
  if (score >= 4) return '#FFBC0A';
  if (score >= 2) return '#FF9172';
  return '#F24935';
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-warm-gray/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ backgroundColor: getScoreColor(score) }}
        />
      </div>
      <span className="font-ui font-bold text-[13px] w-8 text-left" dir="ltr">{score.toFixed(1)}</span>
    </div>
  );
}

export default function LeadersPage() {
  const { data, isLoading } = useData();
  const { canViewReviews, canViewHrComments } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);
  const [expandedEval, setExpandedEval] = useState<string | null>(null);

  // Group evaluations by leader
  const leaderGroups = useMemo(() => {
    const groups: Record<string, typeof data.leaders> = {};
    for (const eval_ of data.leaders) {
      if (!groups[eval_.leaderName]) groups[eval_.leaderName] = [];
      groups[eval_.leaderName].push(eval_);
    }
    return groups;
  }, [data.leaders]);

  // Calculate averages per leader
  const leaderSummaries = useMemo(() => {
    return Object.entries(leaderGroups).map(([name, evals]) => {
      const avgScore = evals.reduce((sum, e) => sum + e.averageScore, 0) / evals.length;
      const categoryAvgs = SCORE_CATEGORIES.map(cat => {
        const avg = evals.reduce((sum, e) => {
          const catSum = cat.fields.reduce((s, f) => s + (e[f] as number), 0);
          return sum + catSum / cat.fields.length;
        }, 0) / evals.length;
        return { ...cat, avg };
      });
      return { name, evals, avgScore, categoryAvgs, evalCount: evals.length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [leaderGroups]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return leaderSummaries;
    const q = search.toLowerCase();
    return leaderSummaries.filter(l => l.name.toLowerCase().includes(q));
  }, [leaderSummaries, search]);

  if (!canViewReviews) {
    return (
      <div>
        <TopBar title="تقييمات القادة" />
        <div className="p-8 text-center py-20">
          <Shield className="w-16 h-16 text-neutral-muted mx-auto mb-4" />
          <h2 className="font-display font-bold text-[24px] mb-2">غير مصرّح</h2>
          <p className="font-ui text-neutral-muted">ليس لديك صلاحية لعرض تقييمات القادة</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <TopBar title="تقييمات القادة" />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="تقييمات القادة" />
      <div className="p-8">
        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="font-ui text-[13px] text-neutral-muted font-bold mb-1">إجمالي التقييمات</p>
            <p className="font-display font-black text-[28px]">{data.leaders.length}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="font-ui text-[13px] text-neutral-muted font-bold mb-1">عدد القادة</p>
            <p className="font-display font-black text-[28px]">{leaderSummaries.length}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="font-ui text-[13px] text-neutral-muted font-bold mb-1">المتوسط العام</p>
            <p className="font-display font-black text-[28px]" style={{ color: getScoreColor(leaderSummaries.reduce((s, l) => s + l.avgScore, 0) / (leaderSummaries.length || 1)) }}>
              {(leaderSummaries.reduce((s, l) => s + l.avgScore, 0) / (leaderSummaries.length || 1)).toFixed(1)}
              <span className="text-[16px] text-neutral-muted font-bold"> / ١٠</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن قائد..."
            className="w-full pr-12 pl-4 py-3 rounded-lg border border-neutral-warm-gray font-ui font-bold text-[14px] focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white"
          />
        </div>

        {/* Leader cards */}
        <div className="space-y-4">
          {filtered.map((leader) => {
            const isExpanded = expandedLeader === leader.name;
            return (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Leader header */}
                <button
                  onClick={() => setExpandedLeader(isExpanded ? null : leader.name)}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-white text-[16px]"
                      style={{ backgroundColor: getScoreColor(leader.avgScore) }}
                    >
                      {leader.avgScore.toFixed(1)}
                    </div>
                    <div className="text-right">
                      <h3 className="font-ui font-bold text-[16px]">{leader.name}</h3>
                      <p className="font-ui text-[13px] text-neutral-muted font-bold">
                        {leader.evalCount} تقييم
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                      {leader.categoryAvgs.map(cat => (
                        <Badge
                          key={cat.key}
                          variant={cat.avg >= 7 ? 'success' : cat.avg >= 5 ? 'warning' : 'error'}
                        >
                          {cat.label}: {cat.avg.toFixed(1)}
                        </Badge>
                      ))}
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-neutral-warm-gray/30"
                    >
                      <div className="p-5">
                        {/* Category scores */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {leader.categoryAvgs.map(cat => (
                            <div key={cat.key} className="bg-neutral-cream/50 rounded-lg p-4">
                              <h4 className="font-ui font-bold text-[14px] mb-3">{cat.label}</h4>
                              <div className="space-y-2">
                                {cat.fields.map(field => {
                                  const avg = leader.evals.reduce((s, e) => s + (e[field] as number), 0) / leader.evals.length;
                                  return (
                                    <div key={field}>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-ui text-[12px] text-neutral-muted font-bold">{FIELD_LABELS[field]}</span>
                                      </div>
                                      <ScoreBar score={avg} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Individual evaluations */}
                        <h4 className="font-ui font-bold text-[14px] mb-3">التقييمات الفردية ({leader.evalCount})</h4>
                        <div className="space-y-2">
                          {leader.evals.map((eval_) => {
                            const isEvalExpanded = expandedEval === eval_.id;
                            return (
                              <div key={eval_.id} className="bg-neutral-cream/30 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => setExpandedEval(isEvalExpanded ? null : eval_.id)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-cream/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-ui font-bold text-[13px]">{eval_.evaluatorName}</span>
                                    <Badge variant={eval_.averageScore >= 7 ? 'success' : eval_.averageScore >= 5 ? 'warning' : 'error'}>
                                      {eval_.averageScore.toFixed(1)}
                                    </Badge>
                                  </div>
                                  {isEvalExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <AnimatePresence>
                                  {isEvalExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="px-4 pb-4"
                                    >
                                      {/* Comments */}
                                      <div className="space-y-3 mt-2">
                                        {SCORE_CATEGORIES.map(cat => {
                                          const comment = eval_[cat.commentField];
                                          if (!comment) return null;
                                          return (
                                            <div key={cat.key} className="bg-white rounded-lg p-3">
                                              <p className="font-ui font-bold text-[12px] text-neutral-muted mb-1">
                                                <MessageSquare className="w-3 h-3 inline-block ml-1" />
                                                {cat.label}
                                              </p>
                                              <p className="font-ui text-[13px] leading-relaxed font-bold">{comment}</p>
                                            </div>
                                          );
                                        })}
                                        {eval_.generalComments && (
                                          <div className="bg-white rounded-lg p-3">
                                            <p className="font-ui font-bold text-[12px] text-neutral-muted mb-1">تعليقات عامة للمدير</p>
                                            <p className="font-ui text-[13px] leading-relaxed font-bold">{eval_.generalComments}</p>
                                          </div>
                                        )}
                                        {canViewHrComments && eval_.hrComments && (
                                          <div className="bg-brand-red/5 rounded-lg p-3 border border-brand-red/20">
                                            <p className="font-ui font-bold text-[12px] text-brand-red mb-1">تعليقات للموارد البشرية</p>
                                            <p className="font-ui text-[13px] leading-relaxed font-bold">{eval_.hrComments}</p>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-neutral-muted mx-auto mb-3" />
            <p className="font-ui font-bold text-[16px] text-neutral-muted">
              {data.leaders.length === 0 ? 'لا توجد تقييمات قادة' : 'لا توجد نتائج'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
