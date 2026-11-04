import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { AppHeader } from './layout/header/component';
import { AppSidebar } from './layout/sidebar/component';
import { SidebarService } from './services/sidebar';
import { ThemeService } from './services/theme';

/** Cadre de l'app : barre latérale, en-tête, page. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToasterImports, AppHeader, AppSidebar],
  template: `
    <app-sidebar />
    <div class="min-h-screen transition-[margin] duration-300" [class]="sidebar.collapsed() ? 'lg:ms-[90px]' : 'lg:ms-[290px]'">
      <app-header />
      <main class="mx-auto max-w-7xl p-4 md:p-6">
        <router-outlet />
      </main>
    </div>
    <hlm-toaster />
  `,
})
export class App {
  protected sidebar = inject(SidebarService);
  constructor() {
    // Instancié au démarrage pour appliquer le thème avant le premier affichage.
    inject(ThemeService);
  }
}
