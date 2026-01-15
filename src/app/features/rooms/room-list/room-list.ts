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
import {ViewRoomDetailsComponent} from '../view-room-details/view-room-details';
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

    const dialogData = {
      room: {
        ...room,
        propertyName: selectedProperty?.propertyName || 'N/A',
        propertyCode: selectedProperty?.propertyCode || this.selectedPropertyCode || 'N/A'
      }
    };

    const dialogRef = this.dialog.open(ViewRoomDetailsComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: dialogData,
      panelClass: 'room-details-dialog'
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
        <div class="mt-4 text-center">
          Are you sure you want to delete room <strong>${room.roomNumber}</strong> (${room.roomType})?
        </div>
        <div class="text-sm text-center text-gray-600">
          This action cannot be undone.
        </div>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'No',
      customClass: {
        popup: 'text-xs',
        title: 'text-sm font-bold',
        htmlContainer: 'text-xs',
        confirmButton: 'text-xs px-4 py-2 rounded-lg',
        cancelButton: 'text-xs px-4 py-2 rounded-lg'
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
            this.showError('Failed to delete room');
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
