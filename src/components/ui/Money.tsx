import { formatN } from '../../lib/helpers';

interface MoneyProps {
  value: number | null | undefined;
  /** Suffixe affiché (défaut: FCFA) */
  suffix?: string;
  /** Afficher le signe + pour les valeurs positives */
  signed?: boolean;
  className?: string;
  /** Couleur sémantique : pos / neg / info / inherit */
  tone?: 'pos' | 'neg' | 'info' | 'inherit';
}

const toneClass: Record<NonNullable<MoneyProps['tone']>, string> = {
  pos: 'text-gc-pos',
  neg: 'text-gc-neg',
  info: 'text-gc-info',
  inherit: '',
};

/**
 * Affiche un montant monétaire avec alignement tabulaire (Fira Code).
 * Utilise formatN (séparateur de milliers par espace) + suffixe FCFA.
 */
export function Money({ value, suffix = 'FCFA', signed = false, className = '', tone = 'inherit' }: MoneyProps) {
  const n = Number(value ?? 0);
  const sign = signed && n > 0 ? '+' : '';
  return (
    <span className={`num whitespace-nowrap ${toneClass[tone]} ${className}`.trim()}>
      {sign}
      {formatN(n)} {suffix}
    </span>
  );
}

export default Money;
