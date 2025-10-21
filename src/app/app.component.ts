import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from "./shared/components/sidebar/sidebar";
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  template: `
    <!-- Show sidebar layout for authenticated users -->
    <app-sidebar *ngIf="authService.isAuthenticated()"></app-sidebar>
    
    <!-- Show plain router outlet for non-authenticated users (login/register) -->
    <router-outlet *ngIf="!authService.isAuthenticated()"></router-outlet>
  `
})
export class AppComponent {
  title = 'hotel-pms';
  
  constructor(public authService: AuthService) {}
}
