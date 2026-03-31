'use client';

import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '@/lib/scoring';

interface RadialScoreProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
}

export default function RadialScore({
  score,
  maxScore = 5,
  size = 120,
  label,
}: RadialScoreProps) {
  const percent = (score / maxScore) * 100;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EFEDE2"
            strokeWidth={10}
          />
          {/* Score arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-[24px]" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="font-ui text-[11px] text-neutral-muted">/ {maxScore}</span>
        </div>
      </div>
      {label && (
        <span className="font-ui font-medium text-[13px] text-neutral-muted">{label}</span>
      )}
      <span
        className="font-ui font-bold text-[12px] px-2 py-[2px] rounded"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
