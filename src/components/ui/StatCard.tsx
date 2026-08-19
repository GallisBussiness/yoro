import { ReactNode } from 'react';
import { Card } from '../shadcn/card';
import { Money } from './Money';

interface StatCardProps {
  label: string;
  value: number;
  /** Afficher la valeur comme montant FCFA tabulaire (défaut: true) */
  money?: boolean;
  suffix?: string;
  icon?: ReactNode;
  tone?: 'pos' | 'neg' | 'info' | 'neutral';
  /** Variation optionnelle (ex: +12%) */
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  /** Valeur brute affichée à la place du montant (ex: nombre d'articles) */
  rawValue?: string;
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, { chip: string; text: string }> = {
  pos: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', text: 'text-gc-pos' },
  neg: { chip: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', text: 'text-gc-neg' },
  info: { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', text: 'text-gc-info' },
  neutral: { chip: 'bg-muted text-foreground', text: 'text-gc' },
};

/**
 * Carte KPI standard GesCom (shadcn) : icône en chip + libellé + valeur tabulaire + delta.
 */
export function StatCard({ label, value, money = true, suffix, icon, tone = 'neutral', delta, rawValue }: StatCardProps) {
  const ts = toneStyles[tone];
  const deltaColor =
    delta?.direction === 'up' ? 'text-gc-pos' : delta?.direction === 'down' ? 'text-gc-neg' : 'text-gc-muted';

  return (
    <Card className="p-4 md:p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="gc-page-subtitle truncate text-xs font-medium uppercase tracking-wide">{label}</p>
          <div className="mt-2">
            {rawValue != null ? (
              <span className="num text-gc text-xl font-bold md:text-2xl">{rawValue}</span>
            ) : (
              <div className={`text-xl font-bold md:text-2xl ${ts.text}`}>
                <Money value={value} suffix={suffix} tone={tone === 'neutral' ? 'inherit' : tone} />
              </div>
            )}
          </div>
          {delta && <p className={`num mt-1.5 text-xs font-semibold ${deltaColor}`}>{delta.value}</p>}
        </div>
        {icon && <div className={`gc-icon-chip h-10 w-10 shrink-0 ${ts.chip}`}>{icon}</div>}
      </div>
    </Card>
  );
}

export default StatCard;
