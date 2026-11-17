/** `localStorage` can be blocked (private browsing, site data refused): the error is then ignored. */
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
    // Preference not remembered: it stays valid until reload.
  }
}
