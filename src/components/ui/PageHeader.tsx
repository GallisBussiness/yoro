import { ReactNode } from 'react';
import { Button } from '../shadcn/button';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Boutons / actions alignés à droite */
  actions?: ReactNode;
  /** Icône optionnelle affichée à gauche du titre */
  icon?: ReactNode;
}

/**
 * En-tête de page standard GesCom (shadcn) : titre + sous-titre + zone d'actions.
 */
export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="gc-icon-chip h-11 w-11 border border-border bg-muted text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="gc-page-title text-xl md:text-2xl">{title}</h1>
          {subtitle && <p className="gc-page-subtitle mt-0.5 text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
