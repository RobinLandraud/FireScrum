// Shell taken from TailAdmin Angular (MIT, see THIRD-PARTY-NOTICES.md).
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
 * Sidebar: logo, project name and navigation.
 * Large screen: fixed, collapsible into an icon column. Mobile: hidden, opened over the page.
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

  /** Adding a page = adding a line. */
  protected links = [
    { path: '/backlog', label: 'Backlog', icon: 'matViewListOutline' },
    { path: '/features', label: 'Features', icon: 'matCategoryOutline' },
    { path: '/planning', label: 'Planning', icon: 'matCalendarMonthOutline' },
    { path: '/sprint', label: 'Sprint', icon: 'matViewKanbanOutline' },
  ];

  /** Collapsed: only on large screens, and never when it is open on mobile. */
  protected collapsed = computed(() => this.sidebar.collapsed() && !this.sidebar.mobileOpen());

  constructor() {
    // On mobile, changing page closes the sidebar.
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.sidebar.closeMobile());
  }
}
