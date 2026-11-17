import { DOCUMENT, Service, effect, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export type Theme = 'light' | 'dark';
const KEY = 'firescrum.theme';

/**
 * Light / dark theme (`.dark` class on the page): the system preference as long as nothing is remembered,
 * then the choice made with the toggle. The system is not listened to live.
 */
@Service()
export class ThemeService {
  private document = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => this.document.documentElement.classList.toggle('dark', this.theme() === 'dark'));
  }

  toggle() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    writeStorage(KEY, next);
  }

  private initial(): Theme {
    const saved = readStorage(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
