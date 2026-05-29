import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-4xl sm:text-5xl text-text-primary uppercase tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-text-muted mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
