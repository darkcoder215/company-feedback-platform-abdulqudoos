'use client';

import { motion } from 'framer-motion';
import { Evaluation } from '@/lib/types';
import { calculateAverageScore, getScoreColor, getScoreLabel, getDecisionLabel, getDecisionColor } from '@/lib/scoring';
import Badge from '@/components/ui/Badge';

interface EvaluationCardProps {
  evaluation: Evaluation;
  delay?: number;
}

export default function EvaluationCard({ evaluation: ev, delay = 0 }: EvaluationCardProps) {
  const scores = ev.decisionStationScores
    ? Object.values(ev.decisionStationScores).filter(s => s > 0)
    : ev.firstImpressionScores
      ? Object.values(ev.firstImpressionScores).filter(s => s > 0)
      : [];
  const avgScore = calculateAverageScore(scores);
  const color = getScoreColor(avgScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-ui font-bold text-[16px]">{ev.employeeName}</h3>
          <p className="font-ui text-[12px] text-neutral-muted">
            {ev.evaluationType === 'first_impression' ? 'الانطباع الأول' : 'محطة القرار'}
            {' — '}المقيّم: {ev.evaluatorName}
          </p>
          <p className="font-ui text-[11px] text-neutral-muted mt-1">{ev.submittedAt}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {avgScore > 0 && (
            <div
              className="px-3 py-1 rounded-lg font-display font-black text-[20px]"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {avgScore.toFixed(1)}
            </div>
          )}
          {ev.trafficLight && (
            <Badge variant={ev.trafficLightScore >= 4 ? 'success' : ev.trafficLightScore >= 3 ? 'warning' : 'error'}>
              {ev.trafficLight}
            </Badge>
          )}
        </div>
      </div>

      {/* Score label */}
      {avgScore > 0 && (
        <p className="font-ui text-[13px] mb-3" style={{ color }}>
          {getScoreLabel(avgScore)}
        </p>
      )}

      {/* Final decision */}
      {ev.finalDecision && (
        <div className="flex items-center gap-2 mt-2">
          <span className="font-ui text-[12px] text-neutral-muted">القرار:</span>
          <span
            className="font-ui font-bold text-[13px] px-2 py-[2px] rounded"
            style={{
              backgroundColor: `${getDecisionColor(ev.finalDecision)}15`,
              color: getDecisionColor(ev.finalDecision),
            }}
          >
            {getDecisionLabel(ev.finalDecision)}
          </span>
        </div>
      )}

      {/* Brief feedback */}
      {(ev.startFeedback || ev.continueFeedback) && (
        <div className="mt-3 pt-3 border-t border-neutral-warm-gray/50">
          {ev.continueFeedback && (
            <p className="font-body text-[13px] text-neutral-muted line-clamp-2">
              <span className="font-ui font-bold text-brand-blue">استمر: </span>
              {ev.continueFeedback}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
