'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '@/lib/scoring';

interface MetricBarProps {
  label: string;
  value: number;
  maxValue?: number;
  showPercent?: boolean;
  delay?: number;
}

export default function MetricBar({
  label,
  value,
  maxValue = 5,
  showPercent = false,
  delay = 0,
}: MetricBarProps) {
  const percent = (value / maxValue) * 100;
  const color = getScoreColor(value);

  return (
    <div className="flex items-center gap-4">
      <span className="font-ui text-[14px] text-neutral-muted w-[180px] text-right flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-[8px] bg-neutral-warm-gray rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="font-ui font-bold text-[14px] w-[50px] text-left flex-shrink-0">
        {showPercent ? `${Math.round(percent)}%` : value.toFixed(1)}
      </span>
    </div>
  );
}
