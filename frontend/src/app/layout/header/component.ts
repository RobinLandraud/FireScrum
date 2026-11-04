// Cadre repris de TailAdmin Angular (MIT, voir THIRD-PARTY-NOTICES.md).
import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matDarkModeOutline, matLightModeOutline, matMenuOutline } from '@ng-icons/material-icons/outline';
import { SidebarService } from '../../services/sidebar';
import { ThemeService } from '../../services/theme';

/** En-tête : bouton de la barre latérale et bascule clair / sombre. */
@Component({
  selector: 'app-header',
  host: { class: 'block' },
  imports: [NgIcon],
  providers: [provideIcons({ matDarkModeOutline, matLightModeOutline, matMenuOutline })],
  templateUrl: './template.html',
})
export class AppHeader {
  protected sidebar = inject(SidebarService);
  protected theme = inject(ThemeService);
}
