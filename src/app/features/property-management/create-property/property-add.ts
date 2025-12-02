import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model'



@Component({
  selector: 'app-property-add',
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
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './property-add.html',
  styleUrls: ['./property-add.scss']
})
export class PropertyAddComponent implements OnInit {
  propertyForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.propertyForm = this.fb.group({
      propertyName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{4,10}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      totalRooms: [null, [Validators.required, Validators.min(1)]],
      floorCount: [null, [Validators.required, Validators.min(1)]],
      timeZone: ['Asia/Colombo', [Validators.required]],
      currency: ['LKR', [Validators.required]]
    });
  }

  onSubmit(): void {
        if (this.propertyForm.valid) {
      this.isLoading = true;

      const propertyData: Property = this.propertyForm.value;

      this.propertyService.createProperty(propertyData)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.showSuccess('Property created successfully!');

            this.router.navigate(['/properties']);
          },
          error: (error) => {
            this.isLoading = false;
            this.handleError(error);
          }
        });
    } else {
      this.markFormGroupTouched(this.propertyForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.propertyForm.reset();
      this.router.navigate(['/properties']);
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
    let errorMessage = 'An error occurred while creating the property';

    if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
      this.authService.logout();
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to create properties';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    console.error('Error creating property:', error);
  }
}
