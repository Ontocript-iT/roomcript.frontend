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

  availableRoles = [
    { value: 'ROLE_ADMIN', label: 'Administrator', description: 'Full system access and management' },
    { value: 'ROLE_FRONT_DESK_MANAGER', label: 'Front Desk Manager', description: 'Property and staff management' },
    { value: 'ROLE_FRONT_DESK_STAFF', label: 'Front Desk Staff', description: 'Reservations and check-in/out' },
    { value: 'ROLE_HOUSEKEEPING_MANAGER', label: 'Housekeeping Manager', description: 'Room status and maintenance' },
    { value: 'ROLE_ACCOUNTANT', label: 'Accountant', description: 'Financial reports and billing' }
  ];
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
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError('Failed to load users');
      }
    });
  }

  getRolesDisplayString(user: PropertyUser): string {
    if (!user.roles || user.roles.length === 0) {
      return 'No Roles Assigned';
    }
    return user.roles.map(role => this.getRoleDisplayName(role)).join(', ');
  }

  getRolesBadges(user: PropertyUser): Array<{ role: string; displayName: string; class: string; icon: string }> {
    if (!user.roles || user.roles.length === 0) {
      return [];
    }

    return user.roles.map(role => ({
      role: role,
      displayName: this.getRoleDisplayName(role),
      class: this.getRoleBadgeClass(role),
      icon: this.getRoleIcon(role)
    }));
  }

  getRoleDisplayName(roleName: string | null): string {
    if (!roleName || roleName.trim() === '') {
      return 'Unknown Role';
    }

    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Administrator',
      'ROLE_MANAGER': 'Manager',
      'ROLE_FRONT_DESK': 'Front Desk',
      'ROLE_FRONT_DESK_MANAGER': 'Front Desk Manager',
      'ROLE_FRONT_DESK_STAFF': 'Front Desk Staff',
      'ROLE_HOUSEKEEPING': 'Housekeeping',
      'ROLE_HOUSEKEEPING_MANAGER': 'Housekeeping Manager',
      'ROLE_ACCOUNTANT': 'Accountant',
      'ROLE_SUPER_ADMIN': 'Super Admin'
    };
    return roleMap[roleName] || roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  getRoleBadgeClass(roleName: string): string {
    const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ';
    const roleColors: { [key: string]: string } = {
      'ROLE_ADMIN': 'bg-purple-100 text-purple-800',
      'ROLE_MANAGER': 'bg-blue-100 text-blue-800',
      'ROLE_FRONT_DESK': 'bg-green-100 text-green-800',
      'ROLE_FRONT_DESK_MANAGER': 'bg-green-100 text-green-800',
      'ROLE_FRONT_DESK_STAFF': 'bg-blue-100 text-blue-800',
      'ROLE_HOUSEKEEPING': 'bg-yellow-100 text-yellow-800',
      'ROLE_HOUSEKEEPING_MANAGER': 'bg-yellow-100 text-yellow-800',
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
      'ROLE_FRONT_DESK_MANAGER': 'domain',
      'ROLE_FRONT_DESK_STAFF': 'person_outline',
      'ROLE_HOUSEKEEPING': 'cleaning_services',
      'ROLE_HOUSEKEEPING_MANAGER': 'badge',
      'ROLE_ACCOUNTANT': 'account_balance',
      'ROLE_SUPER_ADMIN': 'verified_user'
    };
    return roleIcons[roleName] || 'person';
  }

  openAssignDialog(user: PropertyUser): void {
    this.showSuccess(`Assigning role to ${user.firstName} ${user.lastName}`);
  }

  openRevokeRoleDialog(user: PropertyUser): void {
    const currentRolesHtml = user.roles
      .map((role) => {
        const displayName = this.getRoleDisplayName(role);
        return `<option value="${role}">${displayName}</option>`;
      })
      .join('');

      Swal.fire({
        title: 'Revoke Access',
        html: `
          <div class="text-left space-y-2" style="font-size: 14px;">
            <div class="grid grid-cols-1 gap-y-3">
              <div class="flex">
                <span class="font-semibold w-24">User:</span>
                <span>${user.firstName} ${user.lastName}</span>
              </div>
              <div class="flex">
                <span class="font-semibold w-24">Username:</span>
                <span>@${user.username}</span>
              </div>
              <div class="flex">
                <span class="font-semibold w-24">Property:</span>
                <span> ${user.propertyName}</span>
              </div>
            </div>
            <div class="text-left">
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select role to revoke:</label>
                <select id="roleSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="" disabled selected>Select the role to revoke</option>
                  ${currentRolesHtml}
                </select>
              </div>
            </div>
            <p class="text-red-600 font-semibold">Are you sure you want to revoke access for this user?</p>
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
        },
        preConfirm: () => {
          const selectElement = document.getElementById('roleSelect') as HTMLSelectElement;
          const selectedRole = selectElement?.value;

          if (!selectedRole || selectedRole === '') {
            Swal.showValidationMessage('Please select a role to revoke');
            return false;
          }

          return selectedRole;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.revokeUserRole(user, result.value);
        }
    });
  }

  revokeUserRole(user: PropertyUser, roleToRevoke: string): void {
    this.isLoading = true;
    const displayName = this.getRoleDisplayName(roleToRevoke);

    this.userService.revokeRole(user.userId, user.propertyCode, roleToRevoke).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess(`Role "${displayName}" revoked successfully from ${user.firstName} ${user.lastName}!`);
        this.loadUsers();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error revoking role:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to revoke role';
        this.showError(errorMessage);
      }
    });
  }

  private revokeUserAccess(user: PropertyUser): void {
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

  openAssignRoleDialog(user: PropertyUser): void {
    const roleOptionsHtml = this.availableRoles
      .map((role) => `
      <option value="${role.value}">
        ${role.label}
      </option>
    `)
      .join('');

    Swal.fire({
      title: 'Assign Role',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <div class="grid grid-cols-1 gap-y-3">
          <div class="flex">
            <span class="font-semibold w-24">User:</span>
            <span>${user.firstName} ${user.lastName}</span>
          </div>
          <div class="flex">
            <span class="font-semibold w-24">Username:</span>
            <span>@${user.username}</span>
          </div>
          <div class="flex">
            <span class="font-semibold w-24">Property:</span>
            <span> ${user.propertyName}</span>
          </div>
          <div class="flex mb-4">
            <span class="font-semibold w-24">Current Roles:</span>
            <span>${this.getRolesDisplayString(user)}</span>
          </div>
        </div>
      <div class="text-left">
        <div class="w-full">
          <select id="roleSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="" disabled>Select the new role</option>
            ${roleOptionsHtml}
          </select>
        </div>
      </div>
    `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Assign',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        title: 'text-xl font-bold',
        htmlContainer: 'text-sm',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold',
        cancelButton: 'rounded-lg px-6 py-2 font-semibold'
      },
      preConfirm: () => {
        const selectedRole = (document.getElementById('roleSelect') as HTMLSelectElement).value;
        if (!selectedRole) {
          Swal.showValidationMessage('Please select a role');
          return false;
        }
        return selectedRole;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.assignUserRole(user, result.value);
      }
    });
  }

  private assignUserRole(user: PropertyUser, newRole: string): void {
    Swal.fire({
      title: 'Assigning Role...',
      html: 'Please wait while we process your request.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.assignUserRole(user.userId, user.propertyCode, newRole).subscribe({
      next: (response) => {

        Swal.fire({
          title: 'Role Assigned!',
          html: `
          <p>Role has been successfully assigned to:</p>
          <p class="font-semibold mt-2">${user.firstName} ${user.lastName}</p>
          <p class="text-sm text-gray-600 mt-2">New Role: ${this.getRoleDisplayName(newRole)}</p>
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
        Swal.fire({
          title: 'Error!',
          html: `
          <p>Failed to assign role to ${user.firstName} ${user.lastName}</p>
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

}
