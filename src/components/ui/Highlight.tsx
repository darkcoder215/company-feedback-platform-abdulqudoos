'use client';

type HighlightColor = 'green' | 'yellow' | 'pink' | 'blush' | 'blue' | 'red';

const colorMap: Record<HighlightColor, string> = {
  green: 'bg-brand-green-light',
  yellow: 'bg-brand-yellow-pale',
  pink: 'bg-brand-pink-light',
  blush: 'bg-brand-blush',
  blue: 'bg-brand-sky-light',
  red: 'bg-brand-salmon',
};

interface HighlightProps {
  color?: HighlightColor;
  children: React.ReactNode;
  className?: string;
}

export default function Highlight({ color = 'green', children, className = '' }: HighlightProps) {
  return (
    <span className={`inline px-2 py-[2px] rounded ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
