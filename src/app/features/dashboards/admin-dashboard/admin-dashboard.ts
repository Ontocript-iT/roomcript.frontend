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
import { MatBadgeModule } from '@angular/material/badge';

import { DashboardService, GuestCount, DashboardStats, RevenueStats, AuditLog} from '../../../core/services/dashboard.service';
import { AuthService} from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  isLoading = false;
  isAdmin = false;
  propertyCode = '';
  propertyName = '';

  // Dashboard Data
  guestCounts: GuestCount | null = null;
  dashboardStats: DashboardStats | null = null;
  revenueStats: RevenueStats | null = null;
  auditLogs: AuditLog[] = [];

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
    this.isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');

    if (!this.isAdmin) {
      this.showError('Access Denied: Admin privileges required');
    }
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;

    this.dashboardService.getAllDashboardData(this.propertyCode).subscribe({
      next: (data: {
        guestCounts: GuestCount;
        dashboardStats: DashboardStats;
        revenueStats: RevenueStats;
        auditLogs: AuditLog[];
      }) => {
        this.guestCounts = data.guestCounts;
        this.dashboardStats = data.dashboardStats;
        this.revenueStats = data.revenueStats;
        this.auditLogs = data.auditLogs;
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

  /**
   * Format timestamp to readable format
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get action badge class
   */
  getActionBadgeClass(action: string): string {
    const actionMap: { [key: string]: string } = {
      'CANCEL_RESERVATION': 'bg-red-100 text-red-700',
      'CREATE_RESERVATION': 'bg-green-100 text-green-700',
      'UPDATE_RESERVATION': 'bg-blue-100 text-blue-700',
      'CHECK_IN': 'bg-indigo-100 text-indigo-700',
      'CHECK_OUT': 'bg-purple-100 text-purple-700',
      'DELETE': 'bg-gray-100 text-gray-700'
    };
    return actionMap[action] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    return status === 'SUCCESS' ? 'check_circle' : 'error';
  }

  /**
   * Get status color class
   */
  getStatusColorClass(status: string): string {
    return status === 'SUCCESS' ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Format action name for display
   */
  formatActionName(action: string): string {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  viewAllAuditLogs(): void {
    this.router.navigate(['/audit-logs']);
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
