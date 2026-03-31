'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  LinkIcon,
  Unlink,
  Users,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Calendar,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { getEvaluationInsights } from '@/lib/analytics';
import EvaluationCard from '@/components/probation/EvaluationCard';
import MetricBar from '@/components/charts/MetricBar';
import RadialScore from '@/components/charts/RadialScore';
import ScoreCard from '@/components/dashboard/ScoreCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import { calculateAverageScore, getScoreColor } from '@/lib/scoring';
import { Evaluation, Employee, EvaluationType } from '@/lib/types';

type LinkFilter = 'all' | 'linked' | 'unlinked';
type ViewMode = 'grouped' | 'flat';

/** Match an evaluation to an employee by name or preferredName */
function findEmployeeForEvaluation(
  employeeName: string,
  employees: Employee[],
): Employee | null {
  if (!employeeName) return null;
  const normalized = employeeName.trim();
  return (
    employees.find(
      (emp) =>
        emp.name === normalized ||
        emp.preferredName === normalized ||
        (emp.name && normalized.includes(emp.name)) ||
        (emp.preferredName && normalized.includes(emp.preferredName)) ||
        (emp.name && emp.name.includes(normalized)) ||
        (emp.preferredName && emp.preferredName && emp.preferredName.includes(normalized)),
    ) ?? null
  );
}

interface EmployeeGroup {
  key: string;
  employeeName: string;
  employee: Employee | null;
  evaluations: Evaluation[];
  avgScore: number;
}

export default function ProbationPage() {
  const { data } = useData();
  const [typeFilter, setTypeFilter] = useState<EvaluationType | ''>('');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const insights = useMemo(
    () => getEvaluationInsights(data.evaluations),
    [data.evaluations],
  );

  // Build employee lookup map
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee | null>();
    for (const ev of data.evaluations) {
      if (!map.has(ev.employeeName)) {
        map.set(ev.employeeName, findEmployeeForEvaluation(ev.employeeName, data.employees));
      }
    }
    return map;
  }, [data.evaluations, data.employees]);

  // Linking stats
  const linkingStats = useMemo(() => {
    const uniqueNames = new Set(data.evaluations.map((ev) => ev.employeeName));
    let linked = 0;
    let unlinked = 0;
    for (const name of uniqueNames) {
      if (employeeMap.get(name)) linked++;
      else unlinked++;
    }
    return { total: uniqueNames.size, linked, unlinked };
  }, [data.evaluations, employeeMap]);

  // Filtered evaluations
  const filtered = useMemo(() => {
    return data.evaluations.filter((ev) => {
      const matchType = !typeFilter || ev.evaluationType === typeFilter;
      const matchSearch =
        !search ||
        ev.employeeName.includes(search) ||
        ev.evaluatorName.includes(search);
      const emp = employeeMap.get(ev.employeeName);
      const matchLink =
        linkFilter === 'all' ||
        (linkFilter === 'linked' && emp) ||
        (linkFilter === 'unlinked' && !emp);
      return matchType && matchSearch && matchLink;
    });
  }, [data.evaluations, typeFilter, search, linkFilter, employeeMap]);

  // Group evaluations by employee
  const grouped = useMemo((): EmployeeGroup[] => {
    const map = new Map<string, Evaluation[]>();
    for (const ev of filtered) {
      const key = ev.employeeName;
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    }
    const groups: EmployeeGroup[] = [];
    for (const [name, evals] of map) {
      const allScores: number[] = [];
      for (const ev of evals) {
        if (ev.decisionStationScores) {
          allScores.push(...Object.values(ev.decisionStationScores).filter((s) => s > 0));
        }
        if (ev.firstImpressionScores) {
          allScores.push(...Object.values(ev.firstImpressionScores).filter((s) => s > 0));
        }
      }
      groups.push({
        key: name,
        employeeName: name,
        employee: employeeMap.get(name) ?? null,
        evaluations: evals.sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1)),
        avgScore: calculateAverageScore(allScores),
      });
    }
    // Sort: linked first, then by average score descending
    return groups.sort((a, b) => {
      if (a.employee && !b.employee) return -1;
      if (!a.employee && b.employee) return 1;
      return b.avgScore - a.avgScore;
    });
  }, [filtered, employeeMap]);

  // Overall average
  const overallAvg = useMemo(() => {
    const allScores: number[] = [];
    for (const ev of data.evaluations) {
      if (ev.decisionStationScores) {
        allScores.push(...Object.values(ev.decisionStationScores).filter((s) => s > 0));
      }
      if (ev.firstImpressionScores) {
        allScores.push(...Object.values(ev.firstImpressionScores).filter((s) => s > 0));
      }
    }
    return calculateAverageScore(allScores);
  }, [data.evaluations]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(grouped.map((g) => g.key)));
  }, [grouped]);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // ── Empty state ──
  if (data.evaluations.length === 0) {
    return (
      <div>
        <TopBar title="فترات التجربة" />
        <div className="p-8 text-center py-20">
          <p className="font-body text-[16px] text-neutral-muted mb-4">
            لم يتم رفع تقييمات فترة التجربة بعد
          </p>
          <Link href="/dashboard?upload=true">
            <Button variant="accent" className="flex items-center gap-2 mx-auto">
              <Upload className="w-4 h-4" />
              رفع ملف التقييمات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="فترات التجربة" />
      <div className="p-8">

        {/* ── Overview scores ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center"
          >
            <RadialScore score={overallAvg} label="المعدل العام" size={140} />
          </motion.div>

          <ScoreCard
            title="تم ترسيمهم"
            score={insights.decisionDist.confirmed}
            maxScore={insights.totalDecisionEvals || 1}
            subtitle={`من أصل ${insights.totalDecisionEvals} تقييم`}
            delay={0.1}
          />
          <ScoreCard
            title="لم يستمروا"
            score={insights.decisionDist.terminated}
            maxScore={insights.totalDecisionEvals || 1}
            subtitle={`من أصل ${insights.totalDecisionEvals} تقييم`}
            delay={0.2}
          />
          <ScoreCard
            title="إجمالي التقييمات"
            score={data.evaluations.length}
            maxScore={data.evaluations.length}
            subtitle={`${data.evaluations.filter((e) => e.evaluationType === 'first_impression').length} انطباع أول`}
            delay={0.3}
          />

          {/* Linking stats card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <h3 className="font-ui text-[13px] text-neutral-muted mb-3 text-center">نسبة الربط</h3>
            <div className="flex items-center justify-center gap-1 mb-3">
              <span className="font-display font-black text-[36px] text-brand-green">
                {linkingStats.total > 0
                  ? Math.round((linkingStats.linked / linkingStats.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 text-[12px] font-ui">
              <span className="flex items-center gap-1 text-brand-green">
                <LinkIcon className="w-3 h-3" />
                {linkingStats.linked} مرتبط
              </span>
              <span className="flex items-center gap-1 text-neutral-muted">
                <Unlink className="w-3 h-3" />
                {linkingStats.unlinked} غير مرتبط
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="mt-3 h-2 bg-neutral-warm-gray rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${linkingStats.total > 0 ? (linkingStats.linked / linkingStats.total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full bg-brand-green rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* ── Criteria breakdown ── */}
        {insights.criteriaBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
          >
            <h3 className="font-ui font-bold text-[16px] mb-6">متوسط التقييم حسب المعيار</h3>
            <div className="space-y-4">
              {insights.criteriaBreakdown.map((criteria, i) => (
                <MetricBar
                  key={criteria.key}
                  label={criteria.label}
                  value={criteria.average}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Filters toolbar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-neutral-warm-gray/20"
        >
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="ابحث بالاسم..."
              className="w-[260px]"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EvaluationType | '')}
              className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui text-[14px] focus:outline-none focus:border-brand-green transition-colors"
            >
              <option value="">جميع التقييمات</option>
              <option value="first_impression">الانطباع الأول</option>
              <option value="decision_station">محطة القرار</option>
            </select>

            {/* Link filter */}
            <div className="flex rounded-lg border border-neutral-warm-gray overflow-hidden">
              {([
                { value: 'all', label: 'الكل', icon: Users },
                { value: 'linked', label: 'مرتبط', icon: LinkIcon },
                { value: 'unlinked', label: 'غير مرتبط', icon: Unlink },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setLinkFilter(value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-[9px] font-ui text-[13px] transition-all
                    ${linkFilter === value
                      ? 'bg-brand-blue text-white'
                      : 'bg-white text-neutral-muted hover:bg-neutral-cream/50'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <div className="flex rounded-lg border border-neutral-warm-gray overflow-hidden mr-auto">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-[9px] font-ui text-[13px] transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-brand-green text-white'
                    : 'bg-white text-neutral-muted hover:bg-neutral-cream/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                مجمّع
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-[9px] font-ui text-[13px] transition-all ${
                  viewMode === 'flat'
                    ? 'bg-brand-green text-white'
                    : 'bg-white text-neutral-muted hover:bg-neutral-cream/50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                قائمة
              </button>
            </div>

            {/* Counts */}
            <span className="flex items-center font-ui text-[13px] text-neutral-muted">
              {filtered.length} تقييم
              {viewMode === 'grouped' && ` / ${grouped.length} موظف`}
            </span>
          </div>

          {/* Expand/collapse all in grouped mode */}
          {viewMode === 'grouped' && grouped.length > 0 && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-warm-gray/20">
              <button
                onClick={expandAll}
                className="font-ui text-[12px] text-brand-blue hover:text-brand-blue/80 transition-colors"
              >
                توسيع الكل
              </button>
              <span className="text-neutral-warm-gray">|</span>
              <button
                onClick={collapseAll}
                className="font-ui text-[12px] text-brand-blue hover:text-brand-blue/80 transition-colors"
              >
                طي الكل
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Grouped view ── */}
        {viewMode === 'grouped' && (
          <div className="space-y-4">
            {grouped.map((group, gi) => {
              const isOpen = expandedGroups.has(group.key);
              const scoreColor = getScoreColor(group.avgScore);

              return (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(gi * 0.04, 0.4), duration: 0.4 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-warm-gray/30 overflow-hidden"
                >
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full p-5 flex items-center gap-4 text-right hover:bg-neutral-cream/20 transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-neutral-muted flex-shrink-0" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-ui font-bold text-[16px] truncate">
                          {group.employeeName}
                        </h3>
                        {group.employee ? (
                          <Badge variant="info">
                            <LinkIcon className="w-3 h-3 ml-1 inline" />
                            مرتبط
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            <Unlink className="w-3 h-3 ml-1 inline" />
                            غير مرتبط
                          </Badge>
                        )}
                        <Badge variant={group.evaluations.length > 1 ? 'warning' : 'neutral'}>
                          {group.evaluations.length} تقييم
                        </Badge>
                      </div>

                      {/* Employee details */}
                      {group.employee && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {group.employee.department && (
                            <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted">
                              <Building2 className="w-3 h-3" />
                              {group.employee.department}
                            </span>
                          )}
                          {group.employee.team && (
                            <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted">
                              <Users className="w-3 h-3" />
                              {group.employee.team}
                            </span>
                          )}
                          {group.employee.jobTitleAr && (
                            <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted">
                              <Briefcase className="w-3 h-3" />
                              {group.employee.jobTitleAr}
                            </span>
                          )}
                          {group.employee.startDate && (
                            <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted">
                              <Calendar className="w-3 h-3" />
                              {group.employee.startDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    {group.avgScore > 0 && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div
                          className="px-3 py-1 rounded-lg font-display font-black text-[20px]"
                          style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}
                        >
                          {group.avgScore.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Group content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-neutral-warm-gray/20 pt-4">
                          {/* Employee profile link */}
                          {group.employee && (
                            <Link
                              href={`/employees/${group.employee.id}`}
                              className="inline-flex items-center gap-2 font-ui text-[13px] text-brand-blue hover:text-brand-blue/80 transition-colors bg-brand-blue/5 px-4 py-2 rounded-lg"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              عرض الملف الشخصي للموظف
                            </Link>
                          )}

                          {/* Evaluation cards */}
                          {group.evaluations.map((ev, ei) => (
                            <EvaluationCard
                              key={ev.id}
                              evaluation={ev}
                              employee={group.employee}
                              delay={Math.min(ei * 0.05, 0.2)}
                              compact
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Flat view ── */}
        {viewMode === 'flat' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ev, i) => (
              <EvaluationCard
                key={ev.id}
                evaluation={ev}
                employee={employeeMap.get(ev.employeeName) ?? null}
                delay={Math.min(i * 0.05, 0.3)}
              />
            ))}
          </div>
        )}

        {/* Empty filtered state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="font-body text-[16px] text-neutral-muted">
              لا توجد تقييمات مطابقة للبحث
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
