import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDatepicker } from '@angular/material/datepicker';
import { NgxMaterialTimepickerComponent } from 'ngx-material-timepicker';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { HousekeepingService, Room, CreateTaskRequest } from '../../../core/services/housekeeping.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@Component({
  selector: 'app-housekeeping-add',
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
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    NgxMaterialTimepickerModule
  ],
  templateUrl: './create-task.html',
  styleUrls: ['./create-task.scss']
})
export class CreateTask implements OnInit {
  taskForm!: FormGroup;
  isLoading = false;
  rooms: Room[] = [];

  propertyCode = localStorage.getItem("propertyCode") || 'PROP0005';

  // Template references for date/time pickers
  @ViewChild('scheduledDatePicker') scheduledDatePicker!: MatDatepicker<Date>;
  @ViewChild('scheduledTimePicker') scheduledTimePicker!: NgxMaterialTimepickerComponent;

  // Enums for dropdowns
  taskTypes = [
    { value: 'CHECKOUT_CLEANING', label: 'Checkout Cleaning' },
    { value: 'STAYOVER_CLEANING', label: 'Stayover Cleaning' },
    { value: 'DEEP_CLEANING', label: 'Deep Cleaning' },
    { value: 'TOUCH_UP', label: 'Touch Up' }
  ];

  priorities = [
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  roomConditions = [
    { value: 'DIRTY', label: 'Dirty' },
    { value: 'CLEAN', label: 'Clean' },
    { value: 'DAMAGED', label: 'Damaged' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private housekeepingService: HousekeepingService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadRooms();
  }

  private initializeForm(): void {
    const now = new Date();
    const defaultTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`; // "HH:mm"

    this.taskForm = this.fb.group({
      roomId: [null, [Validators.required]],
      taskType: ['CHECKOUT_CLEANING', [Validators.required]],
      priority: ['MEDIUM', [Validators.required]],
      scheduledDate: [now, [Validators.required]],
      scheduledTime: [defaultTimeStr, [Validators.required]], // <- string, not object
      estimatedDuration: [45, [Validators.required, Validators.min(1)]],
      roomConditionBefore: ['DIRTY', [Validators.required]],
      assignedToId: [null],
      reservationId: [null],
      notes: [''],
      specialInstructions: [''],
      requiresInspection: [true],
      isCheckoutCleaning: [true]
    });
  }

  loadRooms(): void {
    this.housekeepingService.getAllRooms().subscribe({
      next: (data) => {
        this.rooms = data;
      },
      error: (error) => {
        console.error('Failed to load rooms:', error);
        this.showError('Failed to load rooms list');
      }
    });
  }

  // Time picker icon click handler
  onTimePickerIconClick(timepicker: NgxMaterialTimepickerComponent): void {
    timepicker.open();
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isLoading = true;
      const formValue = this.taskForm.value;

      // Combine date + time into "2026-01-06T10:00:00" format
      const scheduledDate = new Date(formValue.scheduledDate);
      const scheduledTime = formValue.scheduledTime;

      // Set time components from time picker
      scheduledDate.setHours(scheduledTime.hour || 0);
      scheduledDate.setMinutes(scheduledTime.minute || 0);
      scheduledDate.setSeconds(0);
      scheduledDate.setMilliseconds(0);

      // Format as ISO string without timezone (matches backend LocalDateTime)
      const formattedScheduledTime = scheduledDate.toISOString().slice(0, 19).replace('Z', '');

      const taskData: CreateTaskRequest = {
        roomId: formValue.roomId,
        taskType: formValue.taskType,
        priority: formValue.priority,
        scheduledTime: formattedScheduledTime, // "2026-01-06T10:00:00"
        notes: formValue.notes,
        specialInstructions: formValue.specialInstructions,
        estimatedDuration: formValue.estimatedDuration,
        roomConditionBefore: formValue.roomConditionBefore,
        requiresInspection: formValue.requiresInspection,
        isCheckoutCleaning: formValue.isCheckoutCleaning,
        assignedToId: formValue.assignedToId || null,
        reservationId: formValue.reservationId || null
      };

      this.housekeepingService.createTask(taskData, this.propertyCode).subscribe({
        next: () => {
          this.isLoading = false;
          this.showSuccess('Task assigned successfully!');
          setTimeout(() => {
            this.router.navigate(['/housekeeping/view-all-task']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    }
  }

  onCancel(): void {
    if (this.taskForm.dirty) {
      if (confirm('Discard changes?')) {
        this.router.navigate(['/housekeeping/dashboard']);
      }
    } else {
      this.router.navigate(['/housekeeping/dashboard']);
    }
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
    let errorMessage = 'An error occurred while creating the task';
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    this.showError(errorMessage);
  }
}
