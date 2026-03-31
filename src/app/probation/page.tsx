'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { getEvaluationInsights } from '@/lib/analytics';
import EvaluationCard from '@/components/probation/EvaluationCard';
import MetricBar from '@/components/charts/MetricBar';
import RadialScore from '@/components/charts/RadialScore';
import ScoreCard from '@/components/dashboard/ScoreCard';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import { calculateAverageScore } from '@/lib/scoring';
import { EvaluationType } from '@/lib/types';

export default function ProbationPage() {
  const { data } = useData();
  const [typeFilter, setTypeFilter] = useState<EvaluationType | ''>('');
  const [search, setSearch] = useState('');

  const insights = useMemo(
    () => getEvaluationInsights(data.evaluations),
    [data.evaluations]
  );

  const filtered = useMemo(() => {
    return data.evaluations.filter(ev => {
      const matchType = !typeFilter || ev.evaluationType === typeFilter;
      const matchSearch = !search ||
        ev.employeeName.includes(search) ||
        ev.evaluatorName.includes(search);
      return matchType && matchSearch;
    });
  }, [data.evaluations, typeFilter, search]);

  // Calculate overall average from all decision station scores
  const overallAvg = useMemo(() => {
    const allScores: number[] = [];
    for (const ev of data.evaluations) {
      if (ev.decisionStationScores) {
        allScores.push(...Object.values(ev.decisionStationScores).filter(s => s > 0));
      }
      if (ev.firstImpressionScores) {
        allScores.push(...Object.values(ev.firstImpressionScores).filter(s => s > 0));
      }
    }
    return calculateAverageScore(allScores);
  }, [data.evaluations]);

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
        {/* Overview scores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            subtitle={`${data.evaluations.filter(e => e.evaluationType === 'first_impression').length} انطباع أول`}
            delay={0.3}
          />
        </div>

        {/* Criteria breakdown */}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="ابحث بالاسم..."
            className="w-[280px]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EvaluationType | '')}
            className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui text-[14px] focus:outline-none focus:border-brand-green"
          >
            <option value="">جميع التقييمات</option>
            <option value="first_impression">الانطباع الأول</option>
            <option value="decision_station">محطة القرار</option>
          </select>
          <span className="flex items-center font-ui text-[13px] text-neutral-muted">
            {filtered.length} تقييم
          </span>
        </div>

        {/* Evaluation cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ev, i) => (
            <EvaluationCard
              key={ev.id}
              evaluation={ev}
              delay={Math.min(i * 0.05, 0.3)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
