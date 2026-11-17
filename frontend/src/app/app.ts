import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { AppHeader } from './layout/header/component';
import { AppSidebar } from './layout/sidebar/component';
import { SidebarService } from './services/sidebar';
import { ThemeService } from './services/theme';

/** App shell: sidebar, header, page. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToasterImports, AppHeader, AppSidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected sidebar = inject(SidebarService);
  constructor() {
    // Instantiated at startup to apply the theme before the first render.
    inject(ThemeService);
  }
}
