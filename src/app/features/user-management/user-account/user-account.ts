import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

// Services and Models
import { UserService, PropertyDetails, UserDetails } from '../../../core/services/user.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './user-account.html',
  styleUrls: ['./user-account.scss']
})
export class UserAccount implements OnInit {
  propertyDetails: PropertyDetails | null = null;
  userDetails: UserDetails | null = null;
  isLoading = false;
  userId: string = '';

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get userId from localStorage or AuthService
    console.log()
    this.userId = localStorage.getItem('userId') || '';
    this.loadAccountDetails();
  }

  loadAccountDetails(): void {
    this.isLoading = true;

    this.userService.getUserAccountDetails(this.userId).subscribe({
      next: (data) => {
        this.propertyDetails = data.propertyDetails;
        this.userDetails = data.userDetails;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError('Failed to load account details');
        console.error('Error loading account details:', error);
      }
    });
  }

  getStatusClass(status: string): string {
    return status.toUpperCase() === 'ACTIVE' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getAccountTypeLabel(isPrivate: boolean): string {
    return isPrivate ? 'Private Account' : 'Public Account';
  }

  getAccountTypeClass(isPrivate: boolean): string {
    return isPrivate ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  editProfile(): void {
    this.showSuccess('Edit profile functionality coming soon!');
    // TODO: Navigate to edit profile page or open dialog
  }

  changePassword(): void {
    this.showSuccess('Change password functionality coming soon!');
    // TODO: Open change password dialog
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
