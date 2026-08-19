import { isSameDay, parseISO } from 'date-fns';

/**
 * Vérifie si une vente (date ISO) a été enregistrée aujourd'hui.
 * Utilisé pour verrouiller l'édition/suppression des ventes antérieures.
 *
 * NOTE: Fonction pure (pas un hook React) — peut être appelée dans une boucle/map.
 */
export function isVenteDuJour(dateISO: string): boolean {
  try {
    return isSameDay(parseISO(dateISO), new Date());
  } catch {
    return false;
  }
}

// Alias rétro-compatible si quelqu'un l'utilise comme hook
export const useIsVenteDuJour = isVenteDuJour;
