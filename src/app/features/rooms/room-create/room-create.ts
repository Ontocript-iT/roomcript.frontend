import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { RoomService, CreateRoomRequest } from '../../../core/services/room.service';

@Component({
  selector: 'app-room-add',
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
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './room-create.html',
  styleUrls: ['./room-create.scss']
})
export class RoomCreate implements OnInit {
  roomForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.roomForm = this.fb.group({
      roomNumber: ['', [Validators.required]],
      roomType: ['', [Validators.required]],
      basePrice: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required]],
      floor: ['', [Validators.required, Validators.min(0)]],
      capacity: ['', [Validators.required, Validators.min(1)]],
      maxAdults: ['', [Validators.required, Validators.min(0)]],
      maxChildren: ['', [Validators.required, Validators.min(0)]],
      bedType: ['', [Validators.required]],
      smokingAllowed: [false],
      hasBalcony: [false],
      hasSeaView: [false],
      amenities: ['', [Validators.required]],
      remarks: ['']
    });
  }

  toggleCheckbox(controlName: string): void {
    const control = this.roomForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  onSubmit(): void {
    if (this.roomForm.valid) {
      this.isLoading = true;

      const roomData: CreateRoomRequest = this.roomForm.value;

      console.log('Submitting room data:', roomData);

      this.roomService.createRoom(roomData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Room created successfully:', response);
          this.showSuccess('Room created successfully!');

          // Reset form and navigate
          this.roomForm.reset({
            smokingAllowed: false,
            hasBalcony: false,
            hasSeaView: false
          });
          setTimeout(() => {
            this.router.navigate(['/rooms']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.roomForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  onCancel(): void {
    if (this.roomForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        this.router.navigate(['/rooms']);
      }
    } else {
      this.router.navigate(['/rooms']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    console.log('Marking form group as touched');
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
    let errorMessage = 'An error occurred while creating the room';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 409) {
      errorMessage = 'Room number already exists';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid data provided';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    console.error('Error creating room:', error);
  }
}
