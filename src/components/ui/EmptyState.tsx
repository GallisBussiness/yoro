import { ReactNode } from 'react';
import { Card } from '../shadcn/card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}

/**
 * État vide standard pour les tables et listes (shadcn).
 */
export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="gc-icon-chip mb-4 h-14 w-14 bg-muted text-muted-foreground">{icon}</div>}
      <p className="gc-page-title text-sm">{title}</p>
      {hint && <p className="gc-page-subtitle mt-1 max-w-sm text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
