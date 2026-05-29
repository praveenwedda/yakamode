import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="mb-5 grid place-items-center h-20 w-20 rounded-2xl bg-brand/10 border border-brand/20 text-brand-light">
        {icon}
      </div>
      <h3 className="text-2xl text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}
