'use client';

import { motion } from 'framer-motion';

const pulseKeyframes = {
  scale: [1, 1.05, 1],
  opacity: [0.7, 1, 0.7],
};

export default function LoadingBanner() {
  return (
    <div className="fixed inset-0 z-[100] bg-brand-black flex items-center justify-center" style={{ marginRight: 0 }}>
      <div className="text-center">
        {/* Animated logo circle */}
        <motion.div
          animate={pulseKeyframes}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full bg-brand-green/20 flex items-center justify-center mx-auto mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-brand-green/30 border-t-brand-green"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-black text-[28px] text-white mb-3"
        >
          منصة تقييمات ثمانية
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-ui text-[15px] text-white/50 mb-8"
        >
          جاري تحميل البيانات وتحليلها...
        </motion.p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                backgroundColor: ['rgba(0,193,122,0.3)', 'rgba(0,193,122,1)', 'rgba(0,193,122,0.3)'],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-2.5 h-2.5 rounded-full bg-brand-green/30"
            />
          ))}
        </div>

        {/* Loading file indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['بيانات الموظفين', 'فترات التجربة', 'تقييمات الأداء', 'تقييمات القادة'].map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="font-ui text-[12px] text-white/30 bg-white/5 px-3 py-1.5 rounded-full"
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
