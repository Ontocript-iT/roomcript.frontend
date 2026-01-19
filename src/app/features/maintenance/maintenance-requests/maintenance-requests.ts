import { Component, OnInit } from '@angular/core';
import { MaintenanceService} from '../../../core/services/maintenance.service';
import { MaintenanceRequest} from '../../../core/models/maintenance.model';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {CommonModule} from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-maintenance-requests',
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './maintenance-requests.html',
  styleUrl: './maintenance-requests.scss'
})

export class MaintenanceRequests implements OnInit {
  requests: MaintenanceRequest[] = [];
  allRequests: MaintenanceRequest[] = [];
  isLoading = false;
  propertyName = localStorage.getItem('propertyName') ;
  propertyCode = localStorage.getItem('propertyCode') || 'PROP0005';

  selectedStatus = 'ALL';
  selectedType = 'ALL';

  statusOptions = [
    { value: 'ALL', label: 'All Requests' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  typeOptions = [
    { value: 'ALL', label: 'All Types', icon: 'apps' },
    { value: 'PLUMBING', label: 'Plumbing', icon: 'plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical', icon: 'electrical_services' },
    { value: 'HVAC', label: 'HVAC', icon: 'ac_unit' },
    { value: 'CARPENTRY', label: 'Carpentry', icon: 'carpenter' },
    { value: 'PAINTING', label: 'Painting', icon: 'format_paint' },
    { value: 'APPLIANCE', label: 'Appliance', icon: 'kitchen' },
    { value: 'OTHER', label: 'Other', icon: 'build' }
  ];

  constructor(private maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.loadMaintenanceRequests();
  }

  loadMaintenanceRequests(): void {
    this.isLoading = true;

    // Call getAllMaintenanceRequests with propertyCode
    this.maintenanceService.getAllMaintenanceRequests(this.propertyCode).subscribe({
      next: (data: MaintenanceRequest[]) => {
        this.allRequests = data || [];
        this.filterRequests();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching maintenance requests:', error);
        this.requests = [];
        this.allRequests = [];
        this.isLoading = false;
      }
    });
  }

  filterRequests(): void {
    this.requests = this.allRequests.filter(request => {
      const statusMatch = this.selectedStatus === 'ALL' || request.status === this.selectedStatus;
      const typeMatch = this.selectedType === 'ALL' || request.maintenanceType === this.selectedType;
      return statusMatch && typeMatch;
    });
  }

  onFilterChange(): void {
    this.filterRequests();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const priorityClasses: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }

  getMaintenanceTypeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      'PLUMBING': 'bg-blue-100 text-blue-800',
      'ELECTRICAL': 'bg-yellow-100 text-yellow-800',
      'HVAC': 'bg-cyan-100 text-cyan-800',
      'CARPENTRY': 'bg-amber-100 text-amber-800',
      'PAINTING': 'bg-pink-100 text-pink-800',
      'APPLIANCE': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  }

  getMaintenanceTypeIcon(type: string): string {
    const typeIcons: { [key: string]: string } = {
      'PLUMBING': 'plumbing',
      'ELECTRICAL': 'electrical_services',
      'HVAC': 'ac_unit',
      'CARPENTRY': 'carpenter',
      'PAINTING': 'format_paint',
      'APPLIANCE': 'kitchen',
      'OTHER': 'build'
    };
    return typeIcons[type] || 'build';
  }

  createMaintenanceRequest(): void {
    // Navigate to create maintenance request page or open dialog
    console.log('Create new maintenance request');
  }

  viewDetails(request: MaintenanceRequest): void {
    const selectedProperty = this.propertyName;
    const propertyCode = this.propertyCode;

    // Format dates
    const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    Swal.fire({
      title: 'Maintenance Request Details',
      html: `
      <div class="text-left space-y-4" style="font-size: 14px;">

        <!-- Room, Type & Priority -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 font-medium mb-1">Room Number</span>
              <span class="font-bold text-gray-900">${request.roomNumber}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 font-medium mb-1">Maintenance Type</span>
              <span class="font-bold text-gray-900">${request.maintenanceType}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 font-medium mb-1">Priority</span>
              <span class="font-bold text-gray-900">${request.priority}</span>
            </div>
          </div>
        </div>

        <!-- Request Information -->
        <div class="border-b border-gray-200 pb-4 pt-2">
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-3">
            <div class="flex col-span-2">
              <span class="font-semibold w-40">Request Number:</span>
              <span>${request.requestNumber}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-3">
            <div class="flex col-span-2">
              <span class="font-semibold w-40">Issue Description:</span>
              <span class="flex-1">${request.issueDescription || 'N/A'}</span>
            </div>
            ${request.resolutionNotes ? `
            <div class="flex col-span-2">
              <span class="font-semibold w-40">Resolution Notes:</span>
              <span class="flex-1">${request.resolutionNotes}</span>
            </div>
            ` : ''}
            ${request.partsUsed ? `
            <div class="flex col-span-2">
              <span class="font-semibold w-40">Parts Used:</span>
              <span class="flex-1">${request.partsUsed}</span>
            </div>
            ` : ''}
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3">
            <div class="flex">
              <span class="font-semibold w-40">Is Urgent:</span>
              <span>${request.isUrgent ? 'Yes' : 'No'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Status:</span>
              <span>${request.status}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Room Out of Service:</span>
              <span>${request.roomOutOfService ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <!-- Staff Information -->
        <div class="border-b border-gray-200 pb-4">
          <div class="grid grid-cols-2 gap-x-6 gap-y-3">
            <div class="flex">
              <span class="font-semibold w-40">Reported By:</span>
              <span>${request.reportedByName || 'N/A'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Assigned To:</span>
              <span>${request.assignedToName || 'Unassigned'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Reported At:</span>
              <span>${formatDate(request.reportedAt)}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Assigned At:</span>
              <span>${formatDate(request.assignedAt)}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Started At:</span>
              <span>${formatDate(request.startedAt)}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Completed At:</span>
              <span>${formatDate(request.completedAt)}</span>
            </div>
          </div>
        </div>

        <!-- Cost Information -->
        <div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3">
            <div class="flex">
              <span class="font-semibold w-40">Estimated Cost:</span>
              <span>LKR ${request.estimatedCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-40">Actual Cost:</span>
              <span>${request.actualCost ? `LKR ${request.actualCost.toFixed(2)}` : 'N/A'}</span>
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
      width: '750px',
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

  editRequest(request: MaintenanceRequest): void {
    console.log('Edit request:', request);
    // Navigate to edit page or open dialog
  }

}
