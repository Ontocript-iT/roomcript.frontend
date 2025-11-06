import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { NAV_ITEMS, NavItem } from '../../../../config/nav-config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  name: string | null = null;
  username: string | null = null;
  role: string | null = null;
  @Input() sidenavOpened = true;
  @Output() toggleSidenav = new EventEmitter<void>();

  constructor(public authService: AuthService) {
    this.loadUserData();
  }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.name = user.name || 'Guest User';
        this.username = user.username || 'guest';
        this.role = user.role || "Guest";

      } else {
        this.loadUserData();
      }
    });
  }

  onToggleSidenav(): void {
    this.toggleSidenav.emit();
  }
  private loadUserData(): void {
    const storedName = localStorage.getItem('name');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');

    if (storedName) {
      this.name = storedName;
    }

    if (storedUsername) {
      this.username = storedUsername;
    }

    if (storedRole) {
      this.role = storedRole;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
