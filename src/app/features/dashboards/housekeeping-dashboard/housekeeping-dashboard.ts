import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DashboardService } from '../../../core/services/dashboard.service';
import { HousekeepingData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-housekeeping-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './housekeeping-dashboard.html',
  styleUrl: './housekeeping-dashboard.scss'
})
export class HousekeepingDashboard implements OnInit {
  isLoading = false;
  propertyCode = localStorage.getItem('propertyCode') || "";
  data: HousekeepingData | null = null;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getHousekeepingDashboard(this.propertyCode).subscribe({
      next: (result) => {
        this.data = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load housekeeping data');
        this.isLoading = false;
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
    this.showSuccess('Housekeeping status updated');
  }

  // Helper to map room status to colors
  getRoomStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'text-green-600 bg-green-50 border-green-200',
      'CLEANING': 'text-blue-600 bg-blue-50 border-blue-200',
      'OCCUPIED': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'MAINTENANCE': 'text-red-600 bg-red-50 border-red-200',
      'DIRTY': 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return statusMap[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  getRoomStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'AVAILABLE': 'check_circle',
      'CLEANING': 'cleaning_services',
      'OCCUPIED': 'person',
      'MAINTENANCE': 'engineering',
      'DIRTY': 'warning'
    };
    return iconMap[status] || 'help';
  }

  formatTimeAgo(timestamp: string | null): string {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  navigateToTasks(): void {
    this.router.navigate(['/housekeeping/tasks']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
