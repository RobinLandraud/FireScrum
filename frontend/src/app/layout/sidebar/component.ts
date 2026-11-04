// Cadre repris de TailAdmin Angular (MIT, voir THIRD-PARTY-NOTICES.md).
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matCalendarMonthOutline,
  matCategoryOutline,
  matLocalFireDepartmentOutline,
  matViewKanbanOutline,
  matViewListOutline,
} from '@ng-icons/material-icons/outline';
import { filter } from 'rxjs';
import { ProjectApi } from '../../services/project.api';
import { SidebarService } from '../../services/sidebar';

/**
 * Barre latérale : logo, nom du projet et navigation.
 * Grand écran : fixe, repliable en colonne d'icônes. Mobile : cachée, ouverte par-dessus la page.
 */
@Component({
  selector: 'app-sidebar',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  providers: [
    provideIcons({
      matCalendarMonthOutline,
      matCategoryOutline,
      matLocalFireDepartmentOutline,
      matViewKanbanOutline,
      matViewListOutline,
    }),
  ],
  templateUrl: './template.html',
})
export class AppSidebar {
  protected sidebar = inject(SidebarService);
  private projectApi = inject(ProjectApi);
  protected project = rxResource({ stream: () => this.projectApi.get() });

  /** Ajouter une page = ajouter une ligne. */
  protected links = [
    { path: '/backlog', label: 'Backlog', icon: 'matViewListOutline' },
    { path: '/features', label: 'Features', icon: 'matCategoryOutline' },
    { path: '/planning', label: 'Planning', icon: 'matCalendarMonthOutline' },
    { path: '/sprint', label: 'Sprint', icon: 'matViewKanbanOutline' },
  ];

  /** Repliée : seulement sur grand écran, et jamais quand elle est ouverte sur mobile. */
  protected collapsed = computed(() => this.sidebar.collapsed() && !this.sidebar.mobileOpen());

  constructor() {
    // Sur mobile, changer de page referme la barre.
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.sidebar.closeMobile());
  }
}
