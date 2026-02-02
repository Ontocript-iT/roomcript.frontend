import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UpdateTask} from '../update-task/update-task';

import { HousekeepingService, HousekeepingTask, TaskResponse } from '../../../core/services/housekeeping.service';
import Swal from 'sweetalert2';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-housekeeping-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
  ],
  templateUrl: './view-all-task.html',
  styleUrls: ['./view-all-task.scss']
})
export class ViewAllTask implements OnInit {
  tasks: HousekeepingTask[] = [];
  allTasks: HousekeepingTask[] = [];
  isLoading = true;
  propertyName = 'Ocean View Hotel';
  propertyCode = localStorage.getItem('propertyCode') || 'PROP0005';

  // Filter State
  selectedStatus = 'ALL';

  // Available Statuses
  statusOptions = [
    { value: 'ALL', label: 'All Tasks' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  constructor(
    private housekeepingService: HousekeepingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;

    // Call getAllTasks with propertyCode
    this.housekeepingService.getAllTasks(this.propertyCode).subscribe({
      next: (response: TaskResponse) => {
        this.allTasks = response.result || [];
        this.filterTasks(); // Apply filter after loading
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
        this.tasks = [];
        this.allTasks = [];
        this.isLoading = false;
      }
    });
  }

  // Client-side filtering based on selected status
  filterTasks(): void {
    if (this.selectedStatus === 'ALL') {
      this.tasks = [...this.allTasks];
    } else {
      this.tasks = this.allTasks.filter(task => task.status === this.selectedStatus);
    }
  }

  onFilterChange(): void {
    this.filterTasks(); // Apply filter without reloading from server
  }

  // --- Helper Methods for UI Styling ---

  formatTaskType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase()
      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 border border-red-100';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border border-orange-100';
      case 'LOW': return 'text-green-600 bg-green-50 border border-green-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'VERIFIED': return 'bg-teal-100 text-teal-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  viewTask(task: HousekeepingTask): void {
    const formattedDate = new Date(task.scheduledTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
    });

    const formattedTaskType = this.formatTaskType(task.taskType);
    const assignedName = task.assignedToName || 'Unassigned';

    const getStatusBadge = (status: string): string => {
      const statusConfig: { [key: string]: { class: string, display: string } } = {
        'COMPLETED': { class: 'bg-green-100 text-green-800', display: 'Completed' },
        'ASSIGNED': { class: 'bg-blue-100 text-blue-800', display: 'Assigned' },
        'IN_PROGRESS': { class: 'bg-purple-100 text-purple-800', display: 'In Progress' },
        'PENDING': { class: 'bg-yellow-100 text-yellow-800', display: 'Pending' },
        'VERIFIED': { class: 'bg-teal-100 text-teal-800', display: 'Verified' },
        'REJECTED': { class: 'bg-red-100 text-red-800', display: 'Rejected' },
        'CANCELLED': { class: 'bg-gray-100 text-gray-800', display: 'Cancelled' }
      };
      const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', display: status };
      return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.class}">${config.display}</span>`;
    };

    const getPriorityBadge = (priority: string): string => {
      let colorClass = 'text-gray-600 bg-gray-50';
      if (priority === 'HIGH') colorClass = 'text-red-600 bg-red-50';
      if (priority === 'MEDIUM') colorClass = 'text-orange-600 bg-orange-50';
      if (priority === 'LOW') colorClass = 'text-green-600 bg-green-50';

      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${colorClass}">${priority}</span>`;
    };

    Swal.fire({
      title: 'Task Details',
      html: `
    <div class="text-left space-y-4" style="font-size: 14px;">
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 font-medium mb-1">Property Name</span>
            <span class="font-bold text-gray-900">${this.propertyName}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 font-medium mb-1">Property Code</span>
            <span class="font-bold text-gray-900">${this.propertyCode}</span>
          </div>
        </div>
      </div>

      <div class="pt-4">
        <div class="grid grid-cols-2 gap-x-6 gap-y-3">

          <div class="flex">
            <span class="font-semibold w-28">Room Number:</span>
            <span>${task.roomNumber}</span>
          </div>

          <div class="flex">
            <span class="font-semibold w-28">Room Type:</span>
            <span>${task.roomType}</span>
          </div>

          <div class="flex">
            <span class="font-semibold w-28">Task Type:</span>
            <span>${formattedTaskType}</span>
          </div>

          <div class="flex">
            <span class="font-semibold w-28">Priority:</span>
            <span>${getPriorityBadge(task.priority)}</span>
          </div>

          <div class="flex">
            <span class="font-semibold w-28">Scheduled:</span>
            <span>${formattedDate}</span>
          </div>

          <div class="flex">
            <span class="font-semibold w-28">Assigned To:</span>
            <span class="${!task.assignedToName ? 'text-gray-400 italic' : ''}">${assignedName}</span>
          </div>

          <div class="flex col-span-2 mt-2">
            <span class="font-semibold w-28">Status:</span>
            <div class="flex items-center">
              ${getStatusBadge(task.status)}
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
      icon: 'info',
      iconColor: '#3b82f6',
      showCancelButton: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      cancelButtonText: 'Close',
      width: '650px',
      padding: '1.75rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-user-details-popup',
        title: 'swal-large-title',
        htmlContainer: 'swal-user-details-content',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    });
  }

  editTask(task: any): void {
    this.openUpdateTaskDialog(task);
  }

  openUpdateTaskDialog(task: any): void {
    const dialogRef = this.dialog.open(UpdateTask, {
      width: '800px',
      maxWidth: '95vw',
      data: { task: task },
      disableClose: true,
      panelClass: 'swal-style-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks(); // Refresh your table
        this.showSuccess('Task updated successfully!');
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
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
