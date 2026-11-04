import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

const KEY = 'firescrum.sidebar-collapsed';
/** Au-dessus : barre fixe et repliable. En dessous : barre cachée, ouverte par-dessus la page. */
const DESKTOP = '(min-width: 1024px)';

/** État de la barre latérale, partagé par l'en-tête, la barre et le fond assombri. */
@Service()
export class SidebarService {
  private document = inject(DOCUMENT);

  /** Grand écran : repliée en colonne d'icônes (mémorisé). */
  readonly collapsed = signal(readStorage(KEY) === 'true');
  /** Mobile : ouverte par-dessus la page (jamais mémorisé). */
  readonly mobileOpen = signal(false);

  /** Bouton de l'en-tête : replie / déplie sur grand écran, ouvre / ferme sur mobile. */
  toggle() {
    if (this.document.defaultView?.matchMedia(DESKTOP).matches) {
      this.collapsed.update((c) => !c);
      writeStorage(KEY, String(this.collapsed()));
    } else {
      this.mobileOpen.update((o) => !o);
    }
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
