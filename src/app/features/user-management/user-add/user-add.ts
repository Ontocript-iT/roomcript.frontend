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

  propertyCode = localStorage.getItem("propertyCode") || '';

  availableRoles = [
    { value: 'ROLE_ADMIN', label: 'Administrator', description: 'Full system access and management' },
    { value: 'ROLE_GENERAL_MANAGER', label: 'General Manager', description: 'Property and staff management' },
    { value: ' ROLE_FRONT_DESK_MANAGER', label: 'Front Desk Manager', description: 'Reservations and check-in/out' },
    { value: ' ROLE_HOUSEKEEPING_MANAGER', label: 'Housekeeping', description: 'Room status and maintenance' },
    { value: 'ROLE_ACCOUNTANT', label: 'Accountant', description: 'Financial reports and billing' }
  ];

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
      role: ['ROLE_ADMIN', [Validators.required]]
    });
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

      // Get raw value to include disabled fields
      const formValue = this.userForm.getRawValue();
      const userData: CreateUserRequest = formValue;

      console.log('Submitting user data:', userData);

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('User created successfully:', response);
          this.showSuccess('User created successfully!');

          // Reset form and navigate
          this.userForm.reset({
            propertyCode: this.propertyCode,
            role: 'ROLE_ADMIN'
          });
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.userForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  onCancel(): void {
    if (this.userForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        this.router.navigate(['/users']);
      }
    } else {
      this.router.navigate(['/users']);
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
