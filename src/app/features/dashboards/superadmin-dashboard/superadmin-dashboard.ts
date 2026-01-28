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
import { MatChipsModule } from '@angular/material/chips';

import { DashboardService} from '../../../core/services/dashboard.service';
import { Property, PropertyResponse} from '../../../core/models/dashboard.model'
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-superadmin-dashboard',
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
    MatChipsModule
  ],
  templateUrl: './superadmin-dashboard.html',
  styleUrl: './superadmin-dashboard.scss'
})
export class SuperadminDashboard implements OnInit {
  isLoading = false;
  properties: Property[] = [];

  // Computed Stats
  stats = {
    totalProperties: 0,
    activeProperties: 0,
    totalRoomsNetwork: 0,
    totalCities: 0
  };

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.dashboardService.getAllProperties().subscribe({
      next: (data: PropertyResponse) => {
        this.properties = data.body || [];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.showError('Failed to load property data');
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.totalProperties = this.properties.length;
    this.stats.activeProperties = this.properties.filter(p => p.status === 'ACTIVE').length;
    this.stats.totalRoomsNetwork = this.properties.reduce((sum, current) => sum + (current.totalRooms || 0), 0);

    // Count unique cities
    const cities = new Set(this.properties.map(p => p.city).filter(c => !!c));
    this.stats.totalCities = cities.size;
  }

  refreshData(): void {
    this.loadProperties();
    this.showSuccess('System data refreshed');
  }

  navigateToProperty(propertyCode: string): void {
    // Logic to switch context to this property or view details
    this.router.navigate(['/property-details', propertyCode]);
  }

  createNewProperty(): void {
    this.router.navigate(['/properties/create']);
  }

  getStatusColorClass(status: string): string {
    const map: { [key: string]: string } = {
      'ACTIVE': 'text-green-600 bg-green-50 border-green-200',
      'INACTIVE': 'text-red-600 bg-red-50 border-red-200',
      'MAINTENANCE': 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return map[status] || 'text-gray-600 bg-gray-50 border-gray-200';
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
