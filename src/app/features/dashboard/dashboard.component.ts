import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { DashboardService, GuestCount, DashboardStats, RevenueStats } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  isAdmin = false;
  propertyCode = '';
  propertyName = '';

  // Dashboard Data
  guestCounts: GuestCount | null = null;
  dashboardStats: DashboardStats | null = null;
  revenueStats: RevenueStats | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkAdminRole();
    
    if (this.isAdmin) {
      this.propertyCode = localStorage.getItem('propertyCode') || 'PROP0005';
      this.propertyName = localStorage.getItem('propertyName') || 'Beach Resort Hotel';
      this.loadDashboardData();
    }
  }

  checkAdminRole(): void {
    const userRoles = this.authService.getUserRoles?.() || [];
    this.isAdmin = userRoles.includes('ADMIN');
    // Option 2: If you store roles in localStorage
    // const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    // this.isAdmin = roles.includes('ROLE_ADMIN');
    
    if (!this.isAdmin) {
      this.showError('Access Denied: Admin privileges required');
      // Uncomment to redirect
      // this.router.navigate(['/unauthorized']);
    }
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;

    this.dashboardService.getAllDashboardData(this.propertyCode).subscribe({
      next: (data: { guestCounts: GuestCount; dashboardStats: DashboardStats; revenueStats: RevenueStats }) => {
        this.guestCounts = data.guestCounts;
        this.dashboardStats = data.dashboardStats;
        this.revenueStats = data.revenueStats;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showError('Failed to load dashboard data');
        console.error('Dashboard data loading error:', error);
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
    this.showSuccess('Dashboard data refreshed');
  }


  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
