import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from "./shared/components/sidebar/sidebar";
import { IdleService } from './core/services/idle.service';
import { AuthService } from './core/services/auth.service';

// @ts-ignore
// @ts-ignore
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  template: `
    <!-- Show sidebar layout for authenticated users -->
    <app-sidebar *ngIf="authService.isAuthenticated()"></app-sidebar>

    <!-- Show plain router outlet for non-authenticated users-->
    <router-outlet *ngIf="!authService.isAuthenticated()"></router-outlet>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'hotel-pms';

  constructor(
    private idleService: IdleService,
    protected authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.idleService.startWatching();
    }
  }

  ngOnDestroy(): void {
    this.idleService.stopWatching();
  }
}
