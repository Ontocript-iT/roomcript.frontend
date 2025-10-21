import { Component, OnInit, ViewChild } from '@angular/core';
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

  constructor(public authService: AuthService) {
    this.loadUserData();
  }

  ngOnInit(): void {
    // Subscribe to user changes if using reactive approach
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.name = user.username;
        this.username = user.username;
      }
    });
  }

  private loadUserData(): void {
    this.name = localStorage.getItem('name');
    this.username = localStorage.getItem('username');
    console.log('User roles stored:', localStorage.getItem('userRoles'));
    console.log('Loaded user:', this.name, this.username);
  }

  logout(): void {
    this.authService.logout();
  }
}
