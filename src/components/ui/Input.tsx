import { forwardRef } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

const fieldBase =
  'w-full bg-base/60 border border-border rounded-xl px-4 py-2.5 text-text-primary ' +
  'placeholder:text-text-muted/60 transition-colors focus:border-brand-light/60 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand/30';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-danger mt-1.5">{error}</span>
      ) : (
        hint && <span className="block text-xs text-text-muted mt-1.5">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...rest} />
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, 'appearance-none cursor-pointer', className)}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
