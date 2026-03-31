'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#00C17A',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-sm text-center relative overflow-hidden group cursor-default"
    >
      {/* Subtle glow indicator */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 0 2px ${color}20` }}
      />

      {/* Icon with pulse */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay + 1 }}
        className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </motion.div>

      <h3 className="font-ui font-bold text-[12px] text-neutral-muted mb-1">{title}</h3>
      <p className="font-display font-black text-[30px] leading-none mb-1">{value}</p>
      {subtitle && (
        <p className="font-ui font-bold text-[11px] text-neutral-muted">{subtitle}</p>
      )}
    </motion.div>
  );
}
