import { Component, OnInit, ViewChild } from '@angular/core';
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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRoles = this.authService.getUserRoles();
    this.navItems = this.getAuthorizedNavItems();
    console.log(this.navItems);
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

  toggleSidenav(): void {
    this.sidenav.toggle();
  }
}
