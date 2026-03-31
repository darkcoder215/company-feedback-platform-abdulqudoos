'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  User,
  LinkIcon,
  Unlink,
  Building2,
  Users,
  Briefcase,
  Calendar,
  Target,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Evaluation, Employee } from '@/lib/types';
import {
  calculateAverageScore,
  getScoreColor,
  getScoreLabel,
  getDecisionLabel,
  getDecisionColor,
} from '@/lib/scoring';
import MetricBar from '@/components/charts/MetricBar';
import Badge from '@/components/ui/Badge';

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

const TRAFFIC_COLORS: Record<number, string> = {
  5: '#00C17A',
  4: '#B2E2BA',
  3: '#FFBC0A',
  2: '#FF9172',
  1: '#F24935',
};

interface EvaluationCardProps {
  evaluation: Evaluation;
  employee?: Employee | null;
  delay?: number;
  defaultExpanded?: boolean;
  /** When true, hides the employee header (used inside grouped view) */
  compact?: boolean;
}

export default function EvaluationCard({
  evaluation: ev,
  employee,
  delay = 0,
  defaultExpanded = false,
  compact = false,
}: EvaluationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const scores = ev.decisionStationScores
    ? Object.values(ev.decisionStationScores).filter(s => s > 0)
    : ev.firstImpressionScores
      ? Object.values(ev.firstImpressionScores).filter(s => s > 0)
      : [];
  const avgScore = calculateAverageScore(scores);
  const color = getScoreColor(avgScore);

  const isDecisionStation = ev.evaluationType === 'decision_station';
  const scoreEntries = isDecisionStation && ev.decisionStationScores
    ? Object.entries(ev.decisionStationScores).filter(([, v]) => v > 0)
    : ev.firstImpressionScores
      ? Object.entries(ev.firstImpressionScores).filter(([, v]) => v > 0)
      : [];
  const labels = isDecisionStation ? DS_LABELS : FI_LABELS;

  const hasFeedback = ev.startFeedback || ev.stopFeedback || ev.continueFeedback;
  const hasTargets = ev.previousTargets || ev.nextTargets;
  const hasNotes = ev.openComments || ev.additionalNotes;

  const sectionCount = [
    scoreEntries.length > 0,
    hasFeedback,
    hasNotes,
    hasTargets,
    ev.trafficLight,
    ev.finalDecision,
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-neutral-warm-gray/30"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Employee name + link badge */}
            {!compact && (
              <>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="font-ui font-bold text-[16px] truncate">{ev.employeeName}</h3>
                  {employee ? (
                    <Link href={`/employees/${employee.id}`}>
                      <Badge variant="info" className="cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap">
                        <LinkIcon className="w-3 h-3 ml-1 inline" />
                        مرتبط
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="neutral">
                      <Unlink className="w-3 h-3 ml-1 inline" />
                      غير مرتبط
                    </Badge>
                  )}
                </div>

                {/* Employee info chips */}
                {employee && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.15, duration: 0.3 }}
                    className="flex flex-wrap items-center gap-2 mb-2"
                  >
                    {employee.department && (
                      <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted bg-neutral-cream/60 px-2 py-0.5 rounded-full">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {employee.department}
                      </span>
                    )}
                    {employee.team && (
                      <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted bg-neutral-cream/60 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        {employee.team}
                      </span>
                    )}
                    {employee.jobTitleAr && (
                      <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted bg-neutral-cream/60 px-2 py-0.5 rounded-full">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        {employee.jobTitleAr}
                      </span>
                    )}
                    {employee.startDate && (
                      <span className="flex items-center gap-1 font-ui text-[12px] text-neutral-muted bg-neutral-cream/60 px-2 py-0.5 rounded-full">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {employee.startDate}
                      </span>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Evaluation type + evaluator */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isDecisionStation ? 'warning' : 'info'}>
                {isDecisionStation ? 'محطة القرار' : 'الانطباع الأول'}
              </Badge>
              <span className="font-ui text-[12px] text-neutral-muted">
                المقيّم: {ev.evaluatorName}
              </span>
            </div>
            <p className="font-ui text-[11px] text-neutral-muted mt-1">{ev.submittedAt}</p>
          </div>

          {/* Average score badge */}
          <div className="flex flex-col items-end gap-1.5 mr-4 flex-shrink-0">
            {avgScore > 0 && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
                className="px-3 py-1 rounded-lg font-display font-black text-[22px]"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {avgScore.toFixed(1)}
              </motion.div>
            )}
            {avgScore > 0 && (
              <span className="font-ui font-bold text-[12px]" style={{ color }}>
                {getScoreLabel(avgScore)}
              </span>
            )}
          </div>
        </div>

        {/* Traffic light + decision compact row */}
        <div className="flex flex-wrap items-center gap-3">
          {ev.trafficLight && (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.25, type: 'spring' }}
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: TRAFFIC_COLORS[ev.trafficLightScore] || '#EFEDE2',
                  borderColor: TRAFFIC_COLORS[ev.trafficLightScore] || '#EFEDE2',
                }}
              />
              <Badge variant={ev.trafficLightScore >= 4 ? 'success' : ev.trafficLightScore >= 3 ? 'warning' : 'error'}>
                {ev.trafficLight}
              </Badge>
            </div>
          )}
          {ev.finalDecision && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className="font-ui font-bold text-[13px] px-3 py-1 rounded-full"
              style={{
                backgroundColor: `${getDecisionColor(ev.finalDecision)}15`,
                color: getDecisionColor(ev.finalDecision),
              }}
            >
              {getDecisionLabel(ev.finalDecision)}
            </motion.span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 font-ui text-[13px] text-brand-blue hover:text-brand-blue/80 transition-colors group"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              إخفاء التفاصيل
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              عرض التفاصيل ({sectionCount} أقسام)
            </>
          )}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-6 border-t border-neutral-warm-gray/30 pt-5">

              {/* ── Score breakdown ── */}
              {scoreEntries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-brand-blue" />
                    <h4 className="font-ui font-bold text-[14px] text-brand-black">
                      تفصيل الدرجات
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {scoreEntries.map(([key, value], i) => (
                      <MetricBar
                        key={key}
                        label={labels[key] || key}
                        value={value}
                        delay={i * 0.04}
                      />
                    ))}
                  </div>
                  {/* Average summary */}
                  <div className="mt-4 pt-3 border-t border-dashed border-neutral-warm-gray/40 flex items-center justify-between">
                    <span className="font-ui font-bold text-[13px] text-neutral-muted">المتوسط العام</span>
                    <span className="font-display font-black text-[18px]" style={{ color }}>
                      {avgScore.toFixed(2)} / 5
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── Feedback sections (ابدأ / توقف / استمر) ── */}
              {hasFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-brand-green" />
                    <h4 className="font-ui font-bold text-[14px] text-brand-black">
                      الملاحظات
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {ev.startFeedback && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-brand-green/5 rounded-lg p-4 border-r-4 border-brand-green"
                      >
                        <span className="font-ui font-bold text-[13px] text-brand-green block mb-1">
                          ابدأ
                        </span>
                        <p className="font-body text-[13px] text-brand-black leading-relaxed whitespace-pre-wrap">
                          {ev.startFeedback}
                        </p>
                      </motion.div>
                    )}
                    {ev.stopFeedback && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-brand-red/5 rounded-lg p-4 border-r-4 border-brand-red"
                      >
                        <span className="font-ui font-bold text-[13px] text-brand-red block mb-1">
                          توقف
                        </span>
                        <p className="font-body text-[13px] text-brand-black leading-relaxed whitespace-pre-wrap">
                          {ev.stopFeedback}
                        </p>
                      </motion.div>
                    )}
                    {ev.continueFeedback && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-brand-blue/5 rounded-lg p-4 border-r-4 border-brand-blue"
                      >
                        <span className="font-ui font-bold text-[13px] text-brand-blue block mb-1">
                          استمر
                        </span>
                        <p className="font-body text-[13px] text-brand-black leading-relaxed whitespace-pre-wrap">
                          {ev.continueFeedback}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Open comments ── */}
              {ev.openComments && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-brand-amber" />
                    <h4 className="font-ui font-bold text-[14px] text-brand-black">
                      تعليقات مفتوحة
                    </h4>
                  </div>
                  <p className="font-body text-[13px] text-brand-black bg-neutral-cream/50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap border border-neutral-warm-gray/20">
                    {ev.openComments}
                  </p>
                </motion.div>
              )}

              {/* ── Additional notes ── */}
              {ev.additionalNotes && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.12 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-brand-burgundy" />
                    <h4 className="font-ui font-bold text-[14px] text-brand-black">
                      ملاحظات إضافية
                    </h4>
                  </div>
                  <p className="font-body text-[13px] text-brand-black bg-neutral-cream/50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap border border-neutral-warm-gray/20">
                    {ev.additionalNotes}
                  </p>
                </motion.div>
              )}

              {/* ── Targets ── */}
              {hasTargets && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.14 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-brand-burgundy" />
                    <h4 className="font-ui font-bold text-[14px] text-brand-black">
                      الأهداف
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ev.previousTargets && (
                      <div className="bg-neutral-cream/30 rounded-lg p-4 border border-neutral-warm-gray/30">
                        <h5 className="font-ui font-bold text-[13px] mb-2 text-brand-burgundy flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-burgundy inline-block" />
                          الأهداف السابقة
                        </h5>
                        <p className="font-body text-[13px] text-brand-black leading-relaxed whitespace-pre-wrap">
                          {ev.previousTargets}
                        </p>
                      </div>
                    )}
                    {ev.nextTargets && (
                      <div className="bg-brand-green/5 rounded-lg p-4 border border-brand-green/20">
                        <h5 className="font-ui font-bold text-[13px] mb-2 text-brand-green flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-green inline-block" />
                          الأهداف القادمة
                        </h5>
                        <p className="font-body text-[13px] text-brand-black leading-relaxed whitespace-pre-wrap">
                          {ev.nextTargets}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Traffic light visualization ── */}
              {ev.trafficLight && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.16 }}
                >
                  <h4 className="font-ui font-bold text-[14px] mb-3 text-brand-black">
                    إشارة المرور
                  </h4>
                  <div className="flex items-center gap-4 bg-neutral-cream/30 rounded-lg p-4 border border-neutral-warm-gray/20">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(level => (
                        <motion.div
                          key={level}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.18 + level * 0.06, type: 'spring', stiffness: 300 }}
                          className="w-7 h-7 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: level <= ev.trafficLightScore
                              ? (TRAFFIC_COLORS[ev.trafficLightScore] || '#EFEDE2')
                              : '#EFEDE2',
                            opacity: level <= ev.trafficLightScore ? 1 : 0.25,
                            boxShadow: level <= ev.trafficLightScore
                              ? `0 0 8px ${TRAFFIC_COLORS[ev.trafficLightScore]}40`
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display font-black text-[16px]" style={{ color: TRAFFIC_COLORS[ev.trafficLightScore] || '#999' }}>
                        {ev.trafficLightScore} / 5
                      </span>
                      <span className="font-ui text-[12px] text-neutral-muted">
                        {ev.trafficLight}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Final decision ── */}
              {ev.finalDecision && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 }}
                  className="flex items-center gap-4 rounded-xl p-5 border-2"
                  style={{
                    backgroundColor: `${getDecisionColor(ev.finalDecision)}08`,
                    borderColor: `${getDecisionColor(ev.finalDecision)}30`,
                  }}
                >
                  <motion.div
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring' }}
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getDecisionColor(ev.finalDecision)}20` }}
                  >
                    <User className="w-6 h-6" style={{ color: getDecisionColor(ev.finalDecision) }} />
                  </motion.div>
                  <div>
                    <span className="font-ui text-[12px] text-neutral-muted block">القرار النهائي</span>
                    <span
                      className="font-display font-black text-[20px]"
                      style={{ color: getDecisionColor(ev.finalDecision) }}
                    >
                      {getDecisionLabel(ev.finalDecision)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── Employee profile link ── */}
              {employee && (
                <Link
                  href={`/employees/${employee.id}`}
                  className="block text-center font-ui text-[13px] text-brand-blue hover:text-brand-blue/80 transition-colors py-2 mt-2 border-t border-neutral-warm-gray/20 pt-4"
                >
                  عرض الملف الشخصي للموظف &larr;
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
