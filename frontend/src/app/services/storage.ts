/** `localStorage` peut être bloqué (navigation privée, données de site refusées) : on ignore alors l'erreur. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Préférence non mémorisée : elle reste valable jusqu'au rechargement.
  }
}
