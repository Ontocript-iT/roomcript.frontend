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

import { HousekeepingService, HousekeepingTask, TaskResponse } from '../../../core/services/housekeeping.service';

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
    MatFormFieldModule
  ],
  templateUrl: './view-all-task.html',
  styleUrls: ['./view-all-task.scss']
})
export class ViewAllTask implements OnInit {
  tasks: HousekeepingTask[] = [];
  allTasks: HousekeepingTask[] = []; // Store all tasks for client-side filtering
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

  constructor(private housekeepingService: HousekeepingService) {}

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

  // Placeholder Actions
  viewTask(task: HousekeepingTask) { console.log('View', task); }
  editTask(task: HousekeepingTask) { console.log('Edit', task); }
  deleteTask(task: HousekeepingTask) { console.log('Delete', task); }
}
