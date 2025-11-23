import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateUserRequest, UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AllRoles } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-add.html',
  styleUrls: ['./user-add.scss']
})
export class UserAddComponent implements OnInit {
  userForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  isSuperAdmin = false;
  availableRoles: { role_id: number; value: string; label: string; description: string | null }[] = [];

  propertyCode = localStorage.getItem("propertyCode") || '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if current user is SUPER_ADMIN
    this.isSuperAdmin = this.authService.hasRole('SUPER_ADMIN');
    console.log('Is Super Admin:', this.isSuperAdmin);

    this.initializeForm();
    this.loadAllRoles();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8),this.passwordStrengthValidator.bind(this)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      propertyCode: [
        { value: this.propertyCode, disabled: !this.isSuperAdmin },
        [Validators.required]
      ],
      role: [null, [Validators.required]]
    });
  }

  loadAllRoles(): void {
    this.userService.getAllRoles().subscribe({
      next: (roles: AllRoles[]) => {
        this.availableRoles = roles.map(role => ({
          role_id: role.id,
          label: this.formatRoleLabel(role.name),
          value: role.name,
          description: role.description || 'No description available'
        }));
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
        this.availableRoles = [];
      }
    });
  }

  private formatRoleLabel(name: string): string {
    return name
      .replace('ROLE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  //ghedugweidwu
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar
      ? null
      : { weakPassword: true };
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;

      const formValue = this.userForm.getRawValue();
      const selectedRoleId = formValue.role;

      // Find selected role object
      const selectedRole = this.availableRoles.find(r => r.role_id === selectedRoleId);

      if (!selectedRole) {
        this.showError('Please select a valid role');
        this.isLoading = false;
        return;
      }

      const userData: CreateUserRequest & { roleId: number } = {
        username: formValue.username,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        propertyCode: formValue.propertyCode,
        role: selectedRole.value,
        roleId: selectedRoleId
      };

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccess('User created successfully!');
          this.userForm.reset({ propertyCode: this.propertyCode });
          setTimeout(() => this.router.navigate(['/users/all']), 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    }
  }

  onCancel(): void {
    if (this.userForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        this.router.navigate(['/users/all']);
      }
    } else {
      this.router.navigate(['/users/all']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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

  private handleError(error: any): void {
    let errorMessage = 'An error occurred while creating the user';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 409) {
      errorMessage = 'Username already exists';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid data provided';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    console.error('Error creating user:', error);
  }
}
