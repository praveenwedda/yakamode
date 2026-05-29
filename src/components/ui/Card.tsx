import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ glow, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card p-5',
        glow && 'shadow-glow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-2xl text-text-primary">{title}</h3>
        {subtitle && <p className="text-text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
