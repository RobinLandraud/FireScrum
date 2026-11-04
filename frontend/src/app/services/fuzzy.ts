/** Minuscules, sans accents. */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Score de correspondance approximative : toutes les lettres de `query` doivent apparaître dans `text`,
 * dans l'ordre (pas forcément à la suite). Bonus pour les lettres consécutives et les débuts de mot.
 * `null` si pas de correspondance ; plus le score est haut, meilleure est la correspondance.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = normalize(query.trim());
  const t = normalize(text);
  let score = 0;
  let last = -2;
  let from = 0;
  for (const char of q) {
    if (char === ' ') continue;
    const index = t.indexOf(char, from);
    if (index === -1) return null;
    score += 1;
    if (index === last + 1) score += 2;
    if (index === 0 || t[index - 1] === ' ') score += 3;
    last = index;
    from = index + 1;
  }
  return score;
}

/** Éléments correspondant à `query`, du plus pertinent au moins pertinent (tous si `query` est vide). */
export function fuzzyFilter<T>(items: T[], query: string, text: (item: T) => string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, text(item)) }))
    .filter((r): r is { item: T; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
