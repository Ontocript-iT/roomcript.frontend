import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HousekeepingService} from '../../../core/services/housekeeping.service';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';


@Component({
  selector: 'app-update-task',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  templateUrl: './update-task.html',
  styleUrl: './update-task.scss'
})

export class UpdateTask implements OnInit {
  taskForm: FormGroup;
  isLoading = false;
  isLoadingTask = false; // Used to simulate initial data loading if needed

  constructor(
    private fb: FormBuilder,
    private housekeepingService: HousekeepingService,
    public dialogRef: MatDialogRef<UpdateTask>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      priority: ['', Validators.required],
      scheduledTime: ['', Validators.required],
      estimatedDuration: [0, [Validators.required, Validators.min(1)]],
      notes: [''],
      // Read-only fields for display only
      taskNumber: [{ value: '', disabled: true }],
      roomNumber: [{ value: '', disabled: true }],
      taskType: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.task) {
      // Patch the form with existing data
      this.taskForm.patchValue({
        priority: this.data.task.priority,
        scheduledTime: this.data.task.scheduledTime,
        estimatedDuration: this.data.task.estimatedDuration,
        notes: this.data.task.notes,
        taskNumber: this.data.task.taskNumber,
        roomNumber: this.data.task.roomNumber,
        taskType: this.data.task.taskType
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) return;

    this.isLoading = true;

    // Prepare payload (only editable fields)
    const payload = {
      priority: this.taskForm.get('priority')?.value,
      scheduledTime: this.taskForm.get('scheduledTime')?.value,
      estimatedDuration: this.taskForm.get('estimatedDuration')?.value,
      notes: this.taskForm.get('notes')?.value
    };

    this.housekeepingService.updateTask(this.data.task.id, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error updating task', err);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
