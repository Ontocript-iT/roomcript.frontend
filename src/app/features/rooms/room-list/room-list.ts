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
import {UpdateRoomComponent} from '../update-room/update-room';

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
    this.loadProperties();
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
    this.openUpdateRoomDialog(room);
  }

  openUpdateRoomDialog(room: Room): void {
    const dialogRef = this.dialog.open(UpdateRoomComponent, {
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
