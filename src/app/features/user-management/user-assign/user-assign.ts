import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

// Services
import { UserService, PropertyUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './user-assign.html',
  styleUrls: ['./user-assign.scss']
})
export class UserAssign implements OnInit {
  users: PropertyUser[] = [];
  isLoading = false;
  propertyCode = localStorage.getItem('propertyCode') || 'PROP0005';
  propertyName = 'Beach Resort Hotel'; // You can fetch this from API

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getPropertyUsers(this.propertyCode).subscribe({
      next: (users) => {
        this.users = users;
        console.log(users[0].firstName + ' users loaded for property ' + this.propertyCode);
        this.isLoading = false;
        console.log('Users loaded:', users);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading users:', error);
        this.showError('Failed to load users');
      }
    });
  }

  getRoleDisplayName(roleName: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Administrator',
      'ROLE_MANAGER': 'Manager',
      'ROLE_FRONT_DESK': 'Front Desk',
      'ROLE_HOUSEKEEPING': 'Housekeeping',
      'ROLE_ACCOUNTANT': 'Accountant',
      'ROLE_SUPER_ADMIN': 'Super Admin'
    };
    return roleMap[roleName] || roleName.replace('ROLE_', '');
  }

  getRoleBadgeClass(roleName: string): string {
    const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ';
    const roleColors: { [key: string]: string } = {
      'ROLE_ADMIN': 'bg-purple-100 text-purple-800',
      'ROLE_MANAGER': 'bg-blue-100 text-blue-800',
      'ROLE_FRONT_DESK': 'bg-green-100 text-green-800',
      'ROLE_HOUSEKEEPING': 'bg-yellow-100 text-yellow-800',
      'ROLE_ACCOUNTANT': 'bg-pink-100 text-pink-800',
      'ROLE_SUPER_ADMIN': 'bg-red-100 text-red-800'
    };
    return baseClass + (roleColors[roleName] || 'bg-gray-100 text-gray-800');
  }

  getRoleIcon(roleName: string): string {
    const roleIcons: { [key: string]: string } = {
      'ROLE_ADMIN': 'admin_panel_settings',
      'ROLE_MANAGER': 'manage_accounts',
      'ROLE_FRONT_DESK': 'desk',
      'ROLE_HOUSEKEEPING': 'cleaning_services',
      'ROLE_ACCOUNTANT': 'account_balance',
      'ROLE_SUPER_ADMIN': 'verified_user'
    };
    return roleIcons[roleName] || 'person';
  }

  openAssignDialog(user: PropertyUser): void {
    // You can implement a dialog for assigning roles
    console.log('Assign role to:', user);
    this.showSuccess(`Assigning role to ${user.firstName} ${user.lastName}`);
    // Implement your assign logic here
  }

openRevokeDialog(user: PropertyUser): void {
    Swal.fire({
      title: 'Revoke Access',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>User:</strong> ${user.firstName} ${user.lastName}</p>
          <p class="mb-2"><strong>Username:</strong> @${user.username}</p>
          <p class="mb-2"><strong>Role:</strong> ${this.getRoleDisplayName(user.roleName)}</p>
          <p class="mb-4"><strong>Property:</strong> ${user.propertyName}</p>
          <p class="text-red-600 font-semibold">Are you sure you want to revoke access for this user?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Revoke Access',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        title: 'text-xl font-bold',
        htmlContainer: 'text-sm',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold',
        cancelButton: 'rounded-lg px-6 py-2 font-semibold'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.revokeUserAccess(user);
      }
    });
  }

  private revokeUserAccess(user: PropertyUser): void {
    // Show loading
    Swal.fire({
      title: 'Revoking Access...',
      html: 'Please wait while we process your request.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.revokeUserAccess(user.userId, user.propertyCode).subscribe({
      next: (response) => {
        console.log('User access revoked successfully:', response);
        
        // Show success message
        Swal.fire({
          title: 'Access Revoked!',
          html: `
            <p>Access has been successfully revoked for:</p>
            <p class="font-semibold mt-2">${user.firstName} ${user.lastName}</p>
          `,
          icon: 'success',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg px-6 py-2 font-semibold'
          }
        }).then(() => {
          // Reload users list
          this.loadUsers();
        });
      },
      error: (error) => {
        console.error('Error revoking user access:', error);
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          html: `
            <p>Failed to revoke access for ${user.firstName} ${user.lastName}</p>
            <p class="text-sm text-gray-600 mt-2">${error.error?.message || 'Please try again later.'}</p>
          `,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Close',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg px-6 py-2 font-semibold'
          }
        });
      }
    });
  }


  editUser(user: PropertyUser): void {
    console.log('Edit user:', user);
    this.router.navigate(['/users/edit', user.userId]);
  }

  viewUser(user: PropertyUser): void {
    console.log('View user details:', user);
    this.router.navigate(['/users/view', user.userId]);
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
