import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

const KEY = 'firescrum.sidebar-collapsed';
/** Above: fixed, collapsible sidebar. Below: hidden sidebar, opened over the page. */
const DESKTOP = '(min-width: 1024px)';

/** Sidebar state, shared by the header, the sidebar and the dimmed backdrop. */
@Service()
export class SidebarService {
  private document = inject(DOCUMENT);

  /** Large screen: collapsed into an icon column (remembered). */
  readonly collapsed = signal(readStorage(KEY) === 'true');
  /** Mobile: opened over the page (never remembered). */
  readonly mobileOpen = signal(false);

  /** Sidebar and mobile bar buttons: collapses / expands on large screens, opens / closes on mobile. */
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
