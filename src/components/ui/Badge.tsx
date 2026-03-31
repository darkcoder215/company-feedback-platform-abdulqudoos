'use client';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-score-excellent/15 text-score-excellent',
  warning: 'bg-score-average/15 text-amber-700',
  error: 'bg-score-poor/15 text-score-poor',
  info: 'bg-brand-blue/15 text-brand-blue',
  neutral: 'bg-neutral-warm-gray text-neutral-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-[12px] font-ui font-medium
        ${variantStyles[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}
