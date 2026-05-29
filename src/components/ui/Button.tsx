import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all ' +
  'disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-accent-white shadow-glow hover:bg-brand-light hover:shadow-glow-lg border border-brand-light/30',
  secondary:
    'bg-surface-2 text-text-primary border border-border hover:border-brand-light/50 hover:bg-surface',
  ghost: 'text-text-muted hover:text-text-primary hover:bg-white/5',
  danger:
    'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
  success:
    'bg-success/15 text-success border border-success/40 hover:bg-success/25',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
  xl: 'text-xl px-10 py-5 font-display font-bold tracking-wide uppercase',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', icon, full, className, children, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
