import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {Router, RouterLink} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoomService } from '../../../core/services/room.service';
import { AuthService } from '../../../core/services/auth.service';
import { Room } from '../../../core/models/room.model';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {CommonModule} from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import {PropertyResponse} from '../../../core/models/property.model';
import {PropertyService} from '../../../core/services/property.service';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {map, Observable, startWith} from 'rxjs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import Swal from 'sweetalert2';
import {UpdateRoom} from '../update-room/update-room';

@Component({
  selector: 'app-room-list',
  imports: [
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatTooltipModule,
    RouterLink,
    MatFormFieldModule,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatAutocompleteModule
  ],
  templateUrl: './room-list.html',
  styleUrls: ['./room-list.scss']
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  isLoading = false;
  isSuperAdmin = false;

  propertyControl = new FormControl('');
  properties: PropertyResponse[] = [];
  filteredProperties!: Observable<PropertyResponse[]>;
  selectedPropertyCode: string = '';

  constructor(
    private propertyService: PropertyService,
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadProperties();
  }

  checkUserRole(): void {
    const role = localStorage.getItem('role');
    this.isSuperAdmin = role === 'ROLE_SUPER_ADMIN';
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties = properties;

        if (this.properties.length > 0) {
          const storedPropertyCode = localStorage.getItem('propertyCode');

          if (storedPropertyCode) {
            // Use stored property code
            const stored = this.properties.find(p => p.propertyCode === storedPropertyCode);
            if (stored) {
              this.selectedPropertyCode = stored.propertyCode;
              this.propertyControl.setValue(`${stored.propertyName} (${stored.propertyCode})`);
            } else {
              this.setFirstProperty();
            }
          } else {
            this.setFirstProperty();
          }

          this.loadRooms();
        }

        // Setup autocomplete filtering
        this.filteredProperties = this.propertyControl.valueChanges.pipe(
          startWith(''),
          map(value => this._filterProperties(value || ''))
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading properties:', error);
      }
    });
  }

  // set first property
  private setFirstProperty(): void {
    if (this.properties.length > 0) {
      const firstProperty = this.properties[0];
      this.selectedPropertyCode = firstProperty.propertyCode;
      this.propertyControl.setValue(`${firstProperty.propertyName} (${firstProperty.propertyCode})`);
      localStorage.setItem('propertyCode', firstProperty.propertyCode);

    }
  }

  private _filterProperties(value: string): PropertyResponse[] {
    const filterValue = value.toLowerCase();
    return this.properties.filter(property =>
      property.propertyName.toLowerCase().includes(filterValue) ||
      property.propertyCode.toLowerCase().includes(filterValue)
    );
  }

  onPropertySelected(event: any): void {
    const selectedValue = event.option.value;

    // Extract property code from the selected value "Property Name (CODE)"
    const match = selectedValue.match(/\(([^)]+)\)$/);
    if (match) {
      this.selectedPropertyCode = match[1];
      localStorage.setItem('propertyCode', this.selectedPropertyCode);

      this.loadRooms();
    }
  }

  displayProperty(property: string): string {
    return property;
  }

  loadRooms(): void {
    // Check if property code is set
    if (!this.selectedPropertyCode || this.selectedPropertyCode.trim() === '') {
      this.rooms = [];
      return;
    }

    this.isLoading = true;
    this.roomService.getRoomsByProperty(this.selectedPropertyCode).subscribe({
      next: (rooms: Room[]) => {
        this.rooms = rooms;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading rooms:', error);
        this.showError('Failed to load rooms');
        this.rooms = [];
        this.isLoading = false;
      }
    });
  }

  viewRoom(room: Room): void {
    const selectedProperty = this.properties.find(p => p.propertyCode === this.selectedPropertyCode);
    const propertyName = selectedProperty?.propertyName || 'N/A';
    const propertyCode = selectedProperty?.propertyCode || this.selectedPropertyCode || 'N/A';

    // Helper function for status badge
    const getStatusBadge = (status: string): string => {
      const statusConfig: { [key: string]: { class: string, display: string } } = {
        'AVAILABLE': { class: 'bg-green-100 text-green-800', display: 'Available' },
        'OCCUPIED': { class: 'bg-blue-100 text-blue-800', display: 'Occupied' },
        'MAINTENANCE': { class: 'bg-yellow-100 text-yellow-800', display: 'Maintenance' },
        'CLEANING': { class: 'bg-purple-100 text-purple-800', display: 'Cleaning' },
        'OUT_OF_ORDER': { class: 'bg-red-100 text-red-800', display: 'Out of Order' }
      };
      const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', display: status };
      return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.class}">${config.display}</span>`;
    };

    Swal.fire({
      title: 'Room Details',
      html: `
      <div class="text-left space-y-4" style="font-size: 14px;">
        <!-- Property Information -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 font-medium mb-1">Property Name</span>
              <span class="font-bold text-gray-900">${propertyName}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 font-medium mb-1">Property Code</span>
              <span class="font-bold text-gray-900">${propertyCode}</span>
            </div>
          </div>
        </div>

        <!-- Room Information (Two Columns) -->
        <div class="pt-4">
          <div class="grid grid-cols-2 gap-x-6 gap-y-3">
            <div class="flex">
              <span class="font-semibold w-28">Room Number:</span>
              <span>${room.roomNumber}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Room Type:</span>
              <span>${room.roomType}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Floor:</span>
              <span>${room.floor || 'N/A'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Capacity:</span>
              <span>${room.capacity} guests</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Bed Type:</span>
              <span>${room.bedType || 'N/A'}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Base Price:</span>
              <span class="text-green-600 font-semibold">$${room.basePrice?.toFixed(2)}</span>
            </div>
            <div class="flex">
              <span class="font-semibold w-28">Status:</span>
              <div class="flex items-center">
                ${getStatusBadge(room.status)}
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

  editRoom(room: Room): void {
    console.log('// Opening dialog with room:', room);
    this.openUpdateRoomDialog(room);
  }

  openUpdateRoomDialog(room: Room): void {
    console.log('🔍 Opening dialog with room:', room);

    const dialogRef = this.dialog.open(UpdateRoom, {
      width: '1200px',
      maxWidth: '95vw',
      data: { room: room },
      disableClose: true,
      panelClass: 'swal-style-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRooms();
        this.showSuccess('Room updated successfully!');
      }
    });
  }

  deleteRoom(room: any): void {
    Swal.fire({
      title: 'Delete Room',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <p class="text-sm text-gray-700">
          This action will permanently delete the following room:
        </p>
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-gray-900">Room ${room.roomNumber}</span>
            <span class="text-sm text-gray-600">${room.roomType}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div class="flex items-center">
              <span class="font-medium mr-1">Floor:</span>
              <span>${room.floor}</span>
            </div>
            <div class="flex items-center">
              <span class="font-medium mr-1">Capacity:</span>
              <span>${room.capacity} guests</span>
            </div>
            <div class="flex items-center">
              <span class="font-medium mr-1">Base Price:</span>
              <span>$${room.basePrice?.toFixed(2) || 'N/A'}</span>
            </div>
            <div class="flex items-center">
              <span class="font-medium mr-1">Bed Type:</span>
              <span>${room.bedType || 'N/A'}</span>
            </div>
          </div>
        </div>
        <p class="text-red-600 font-semibold mt-4 text-center">
          This action cannot be undone. Are you sure?
        </p>
      </div>
    `,
      icon: 'warning',
      iconColor: '#f97316',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      width: '500px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-delete-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.roomService.removeRoom(room.id).subscribe({
          next: () => {
            this.showSuccess(`Room ${room.roomNumber} deleted successfully.`);
            this.loadRooms();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Delete room error:', error);
            const errorMessage = error.error?.message || 'Failed to delete room';
            this.showError(errorMessage);
          }
        });
      }
    });
  }

  changeStatus(room: Room): void {
    const statuses = [
      { value: 'AVAILABLE', label: 'Available' },
      { value: 'OCCUPIED', label: 'Occupied' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'CLEANING', label: 'Cleaning' },
      { value: 'OUT_OF_ORDER', label: 'Out of Order' }
    ];

    // Helper function for status display name
    const getStatusDisplayName = (status: string): string => {
      const statusMap: { [key: string]: string } = {
        'AVAILABLE': 'Available',
        'OCCUPIED': 'Occupied',
        'MAINTENANCE': 'Maintenance',
        'CLEANING': 'Cleaning',
        'OUT_OF_ORDER': 'Out of Order'
      };
      return statusMap[status] || status;
    };

    const statusOptionsHtml = statuses
      .map((status) => `
      <option value="${status.value}">
        ${status.label}
      </option>
    `)
      .join('');

    Swal.fire({
      title: 'Change Room Status',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <div class="grid grid-cols-2 gap-y-3">
          <div class="flex">
            <span class="font-semibold w-32">Room Number:</span>
            <span>${room.roomNumber}</span>
          </div>
          <div class="flex">
            <span class="font-semibold w-32">Room Type:</span>
            <span>${room.roomType}</span>
          </div>
          <div class="flex">
            <span class="font-semibold w-32">Floor:</span>
            <span>${room.floor}</span>
          </div>
          <div class="flex mb-4">
            <span class="font-semibold w-32">Current Status:</span>
            <span>${room.status || 'N/A'}</span>
          </div>
        </div>
        <div class="text-left">
          <div class="w-full mb-3">
            <label for="statusSelect" class="block mb-2 font-medium text-gray-700">Select new status</label>
            <select id="statusSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled selected>Select a status</option>
              ${statusOptionsHtml}
            </select>
          </div>
          <div class="w-full">
            <label for="statusReason" class="block mb-2 font-medium text-gray-700">Reason for status change</label>
            <textarea
              id="statusReason"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for status change..."
              rows="3"></textarea>
          </div>
        </div>
      </div>
    `,
      icon: 'info',
      iconColor: '#3b82f6',
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      width: '600px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      },
      preConfirm: () => {
        const selectedStatus = (document.getElementById('statusSelect') as HTMLSelectElement).value;
        const reason = (document.getElementById('statusReason') as HTMLTextAreaElement).value;

        if (!selectedStatus) {
          Swal.showValidationMessage('Please select a status');
          return false;
        }

        if (!reason || reason.trim() === '') {
          Swal.showValidationMessage('Please provide a reason for the status change');
          return false;
        }

        return { selectedStatus, reason };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { selectedStatus, reason } = result.value;

        this.roomService.updateRoomStatus(room.id, selectedStatus, reason).subscribe({
          next: () => {
            this.showSuccess(`Room ${room.roomNumber} status has been successfully updated to "${getStatusDisplayName(selectedStatus)}"`);
            this.loadRooms();
          },
          error: (error: HttpErrorResponse) => {
            const errorMsg = error.error?.message || 'Failed to update room status. Please try again later.';
            console.error('Error updating room status:', error);
            this.showError(`Failed to update room ${room.roomNumber} status. ${errorMsg}`);
          }
        });
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
