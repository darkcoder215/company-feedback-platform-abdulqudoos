'use client';

import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '@/lib/scoring';

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  subtitle?: string;
  delay?: number;
}

export default function ScoreCard({
  title,
  score,
  maxScore = 5,
  subtitle,
  delay = 0,
}: ScoreCardProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg p-6 shadow-sm text-center"
    >
      <h3 className="font-ui text-[13px] text-neutral-muted mb-4">{title}</h3>
      <div className="inline-block px-4 py-2 rounded-lg mb-3" style={{ backgroundColor: `${color}15` }}>
        <span className="font-display font-black text-[40px]" style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className="font-ui text-[16px] text-neutral-muted mr-1">/ {maxScore}</span>
      </div>
      <p className="font-ui font-bold text-[14px]" style={{ color }}>{label}</p>
      {subtitle && (
        <p className="font-ui text-[12px] text-neutral-muted mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
