// Shell taken from TailAdmin Angular (MIT, see THIRD-PARTY-NOTICES.md).
import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMenuOutline } from '@ng-icons/material-icons/outline';
import { SidebarService } from '../../services/sidebar';

/** Mobile top bar: the button that opens the sidebar over the page (hidden on large screens, spec 013). */
@Component({
  selector: 'app-header',
  host: { class: 'block' },
  imports: [NgIcon],
  providers: [provideIcons({ matMenuOutline })],
  templateUrl: './template.html',
})
export class AppHeader {
  protected sidebar = inject(SidebarService);
}
