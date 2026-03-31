'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'بحث...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pr-10 pl-4 py-[10px] rounded-lg
          bg-white border border-neutral-warm-gray
          font-ui text-[14px] text-brand-black
          placeholder:text-neutral-muted
          focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green
          transition-colors duration-200
        "
      />
    </div>
  );
}
