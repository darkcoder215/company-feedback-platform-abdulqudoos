'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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

export default function EmployeeProfilePage() {
  const params = useParams();
  const { data } = useData();

  const employee = useMemo(
    () => data.employees.find(e => e.id === params?.id),
    [data.employees, params?.id]
  );

  const evaluations = useMemo(
    () => data.evaluations.filter(ev =>
      ev.employeeName === employee?.name || ev.employeeName === employee?.preferredName
    ),
    [data.evaluations, employee]
  );

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

        {/* Evaluations */}
        {evaluations.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="font-display font-bold text-[22px]">التقييمات</h2>

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
                  className="bg-white rounded-lg shadow-sm p-6"
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
                          <MetricBar
                            key={key}
                            label={DS_LABELS[key] || key}
                            value={value}
                            delay={i * 0.05}
                          />
                        )
                      ))}
                      {ev.firstImpressionScores && Object.entries(ev.firstImpressionScores).map(([key, value], i) => (
                        value > 0 && (
                          <MetricBar
                            key={key}
                            label={FI_LABELS[key] || key}
                            value={value}
                            delay={i * 0.05}
                          />
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

                  {/* Open comments */}
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
      </div>
    </div>
  );
}
