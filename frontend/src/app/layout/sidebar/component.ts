// Shell taken from TailAdmin Angular (MIT, see THIRD-PARTY-NOTICES.md).
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matCalendarMonthOutline,
  matCategoryOutline,
  matDarkModeOutline,
  matKeyboardDoubleArrowLeftOutline,
  matKeyboardDoubleArrowRightOutline,
  matLightModeOutline,
  matLocalFireDepartmentOutline,
  matViewKanbanOutline,
  matViewListOutline,
} from '@ng-icons/material-icons/outline';
import { filter } from 'rxjs';
import { ProjectApi } from '../../services/project.api';
import { SidebarService } from '../../services/sidebar';
import { ThemeService } from '../../services/theme';

/**
 * Sidebar: logo, project name, collapse toggle, navigation and light / dark toggle (spec 013).
 * Large screen: fixed, collapsible into an icon column. Mobile: hidden, opened over the page.
 */
@Component({
  selector: 'app-sidebar',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  providers: [
    provideIcons({
      matCalendarMonthOutline,
      matCategoryOutline,
      matDarkModeOutline,
      matKeyboardDoubleArrowLeftOutline,
      matKeyboardDoubleArrowRightOutline,
      matLightModeOutline,
      matLocalFireDepartmentOutline,
      matViewKanbanOutline,
      matViewListOutline,
    }),
  ],
  templateUrl: './template.html',
})
export class AppSidebar {
  protected sidebar = inject(SidebarService);
  protected theme = inject(ThemeService);
  private projectApi = inject(ProjectApi);
  protected project = rxResource({ stream: () => this.projectApi.get() });

  /** Adding a page = adding a line. */
  protected links = [
    { path: '/backlog', label: 'Backlog', icon: 'matViewListOutline' },
    { path: '/features', label: 'Features', icon: 'matCategoryOutline' },
    { path: '/planning', label: 'Planning', icon: 'matCalendarMonthOutline' },
    { path: '/sprint', label: 'Sprint', icon: 'matViewKanbanOutline' },
  ];

  /** Collapsed: only on large screens, and never when it is open on mobile. */
  protected collapsed = computed(() => this.sidebar.collapsed() && !this.sidebar.mobileOpen());

  /** The same button collapses / expands on large screens and closes the sidebar opened on mobile. */
  protected toggleLabel = computed(() => {
    if (this.sidebar.mobileOpen()) return 'Fermer le menu';
    return this.collapsed() ? 'Déplier le menu' : 'Réduire le menu';
  });

  constructor() {
    // On mobile, changing page closes the sidebar.
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.sidebar.closeMobile());
  }
}
