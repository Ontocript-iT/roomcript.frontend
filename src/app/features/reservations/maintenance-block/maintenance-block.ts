import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReservationService } from '../../../core/services/reservation.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface MaintenanceBlockData {
  roomId: string;
  roomNumber: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-maintenance-block',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './maintenance-block.html',
  styleUrls: ['./maintenance-block.scss']
})
export class MaintenanceBlock implements OnInit {
  maintenanceForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MaintenanceBlock>,
    @Inject(MAT_DIALOG_DATA) public data: MaintenanceBlockData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.maintenanceForm = this.fb.group({
      roomId: [{ value: this.data.roomNumber, disabled: true }],
      startDate: [this.data.startDate, Validators.required],
      endDate: [this.data.endDate, Validators.required],
      reason: ['', Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  // Custom validator to ensure end date is after start date
  dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (startDate && endDate && endDate <= startDate) {
      group.get('endDate')?.setErrors({ endDateBeforeStart: true });
      return { endDateBeforeStart: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.maintenanceForm.valid && !this.isLoading) {
      const formValue = this.maintenanceForm.getRawValue();

      const payload = {
        roomId: this.data.roomId,
        propertyCode: localStorage.getItem('propertyCode') || '',
        startDate: this.formatDateToISO(formValue.startDate),
        endDate: this.formatDateToISO(formValue.endDate),
        reason: formValue.reason
      };

      this.isLoading = true;

      // Call the service method
      this.reservationService.createMaintenanceBlock(payload).subscribe({
        next: (response) => {
          console.log('Maintenance block created successfully:', response);
          this.isLoading = false;

          // Show success message
          this.snackBar.open('Maintenance block created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          // Close dialog and return success response
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          console.error('Error creating maintenance block:', error);
          this.isLoading = false;

          // Show error message
          const errorMessage = error?.error?.message || error?.message || 'Failed to create maintenance block';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  formatDateToISO(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString();
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
