'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand-black text-white hover:bg-neutral-charcoal',
  secondary: 'bg-white text-brand-black border border-neutral-warm-gray hover:bg-neutral-cream',
  accent: 'bg-brand-green text-white hover:opacity-90',
  danger: 'bg-brand-red text-white hover:opacity-90',
  ghost: 'bg-transparent text-brand-black hover:bg-neutral-cream',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-6 py-[10px] text-[14px]',
  lg: 'px-8 py-3 text-[16px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          font-ui font-bold rounded-full transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
