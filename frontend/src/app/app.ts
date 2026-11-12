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
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected sidebar = inject(SidebarService);
  constructor() {
    // Instancié au démarrage pour appliquer le thème avant le premier affichage.
    inject(ThemeService);
  }
}
