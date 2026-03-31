'use client';

import { useData } from '@/context/DataContext';
import Badge from '@/components/ui/Badge';

export default function TopBar({ title }: { title: string }) {
  const { data } = useData();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-warm-gray px-8 py-4 flex items-center justify-between">
      <h1 className="font-display font-bold text-[24px] text-brand-black">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {data.employees.length > 0 && (
          <Badge variant="success">{data.employees.length} موظف</Badge>
        )}
        {data.evaluations.length > 0 && (
          <Badge variant="info">{data.evaluations.length} تقييم</Badge>
        )}
      </div>
    </header>
  );
}
