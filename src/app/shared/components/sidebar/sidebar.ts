import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NavbarComponent } from '../navbar/navbar.component';
import { NAV_ITEMS, NavItem } from '../../../../config/nav-config';
import { AuthService } from '../../../core/services/auth.service';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    NavbarComponent,
    MatExpansionModule,
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar implements OnInit {
  navItems: NavItem[] = [];
  userRoles: string[] = [];
  isAuthenticated = false;
  sidenavOpened = true;
  sidenavWidth = 224; // 56 * 4 = 224px (w-56 in Tailwind)
  minWidth = 180;
  maxWidth = 400;
  isResizing = false;
  startX = 0;
  startWidth = 0;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userRoles = this.authService.getUserRoles();
      this.navItems = this.getAuthorizedNavItems();

         // Load saved sidebar state
      const savedWidth = localStorage.getItem('sidenavWidth');
      const savedState = localStorage.getItem('sidenavOpened');
        if (savedWidth) {
        this.sidenavWidth = parseInt(savedWidth, 10);
      }
      if (savedState !== null) {
        this.sidenavOpened = savedState === 'true';
      }
    }
  }
  @ViewChild('sidenav') sidenav: any;

  private getAuthorizedNavItems(): NavItem[] {
    return NAV_ITEMS.filter((item) => this.hasAccess(item.roles)).map((item) => ({
      ...item,
      subItems: item.subItems?.filter((subItem) => this.hasAccess(subItem.roles)),
    }));
  }

  private hasAccess(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles);
  }

  hasSubItems(item: NavItem): boolean {
    return !!item.subItems && item.subItems.length > 0;
  }

    // Resize functionality
  onResizeStart(event: MouseEvent): void {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.sidenavWidth;
    event.preventDefault();
  }
  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
    localStorage.setItem('sidenavOpened', this.sidenavOpened.toString());
  }

    @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const delta = event.clientX - this.startX;
    const newWidth = this.startWidth + delta;

    if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
      this.sidenavWidth = newWidth;
    }
  }

    @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      localStorage.setItem('sidenavWidth', this.sidenavWidth.toString());
    }
  }

}
