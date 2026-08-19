export const formatN = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');

/**
 * Tri stable d'un tableau par une clé de propriété (équivalent à lodash `sortBy`).
 * Renvoie un nouveau tableau, ne mute pas l'original.
 */
export function sortByKey<T>(arr: T[], key: keyof T): T[];
export function sortByKey(arr: any[], key: string): any[];
export function sortByKey(arr: any[], key: any): any[] {
  if (arr == null) return [];
  return [...arr].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vérifie qu'une chaîne est un UUID valide (équivalent à `uuid.validate`).
 */
export const isValidUUID = (value: string): boolean => UUID_RE.test(value);