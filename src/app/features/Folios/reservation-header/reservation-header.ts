import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRoomDetails, RoomDetail } from '../../../core/models/folio.model';
import Swal from 'sweetalert2';
import { RoomService} from '../../../core/services/room.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-reservation-header',
  imports: [
    CommonModule
  ],
  templateUrl: './reservation-header.html',
  styleUrl: './reservation-header.scss'
})

export class ReservationHeader {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;
  @Input() loading: boolean = false;

  @Output() backClick = new EventEmitter<void>();
  @Output() editDeparture = new EventEmitter<void>();
  @Output() roomChange = new EventEmitter<RoomDetail>();
  @Output() statusUpdated = new EventEmitter<void>();

  currentRoomIndex: number = 0;

  constructor(
    private roomService: RoomService,
    private snackBar: MatSnackBar
  ) {}

  onGoBack(): void {
    this.backClick.emit();
  }

  getCurrentRoom(): RoomDetail | null {
    if (!this.reservationDetails?.roomDetails || this.reservationDetails.roomDetails.length === 0) {
      return null;
    }
    return this.reservationDetails.roomDetails[this.currentRoomIndex];
  }

  previousRoom(): void {
    if (this.currentRoomIndex > 0) {
      this.currentRoomIndex--;
      this.roomChange.emit(this.getCurrentRoom()!);
    }
  }

  nextRoom(): void {
    if (this.reservationDetails?.roomDetails && this.currentRoomIndex < this.reservationDetails.roomDetails.length - 1) {
      this.currentRoomIndex++;
      this.roomChange.emit(this.getCurrentRoom()!);
    }
  }

  getRoomStatus(): string | null {
    const currentRoom = this.getCurrentRoom();
    return currentRoom?.checkInCheckOutStatus || null;
  }

  onCheckIn(): void {
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom?.confirmationNumber) return;

    Swal.fire({
      title: 'Check-In Confirmation',
      html: `
        <div class="text-left space-y-3">
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm font-semibold text-green-800 mb-1">Reservation Details</p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Guest:</span> ${this.reservationDetails?.name || 'N/A'}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Room Number:</span> ${currentRoom.roomNumber}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Room Type:</span> ${currentRoom.roomType}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Confirmation No:</span> ${currentRoom.confirmationNumber}
            </p>
          </div>
          <p class="text-sm text-gray-600 text-center">
            Are you sure you want to check in this guest?
          </p>
        </div>
      `,
      icon: 'question',
      iconColor: '#10b981',
      showCancelButton: true,
      confirmButtonText: 'Yes, Check In',
      cancelButtonText: 'Cancel',
      width: '500px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.performCheckIn(currentRoom.confirmationNumber);
      }
    });
  }

  onCheckOut(): void {
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom?.confirmationNumber) return;

    Swal.fire({
      title: 'Check-Out Confirmation',
      html: `
        <div class="text-left space-y-3">
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm font-semibold text-blue-800 mb-1">Reservation Details</p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Guest:</span> ${this.reservationDetails?.name || 'N/A'}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Room Number:</span> ${currentRoom.roomNumber}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Room Type:</span> ${currentRoom.roomType}
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-medium">Confirmation No:</span> ${currentRoom.confirmationNumber}
            </p>
          </div>
          <p class="text-sm text-gray-600 text-center">
            Are you sure you want to check out this guest?
          </p>
        </div>
      `,
      icon: 'question',
      iconColor: '#3b82f6',
      showCancelButton: true,
      confirmButtonText: 'Yes, Check Out',
      cancelButtonText: 'Cancel',
      width: '500px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.performCheckOut(currentRoom.confirmationNumber);
      }
    });
  }

  private performCheckIn(confirmationNumber: string): void {
    this.loading = true;

    this.roomService.updateReservationRoomStatus(confirmationNumber, 'CHECK_IN')
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.showSuccess('Guest checked in successfully!');
          this.statusUpdated.emit();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error message:', error.error);
          const errorMsg = error.error?.message || error.error?.body || 'Failed to check in guest';
          this.showError(errorMsg);
        }
      });
  }

  private performCheckOut(confirmationNumber: string): void {
    this.loading = true;

    this.roomService.updateReservationRoomStatus(confirmationNumber, 'CHECK_OUT')
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.showSuccess('Guest checked out successfully!');
          this.statusUpdated.emit();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error message:', error.error);
          const errorMsg = error.error?.message || error.error?.body || 'Failed to check out guest';
          this.showError(errorMsg);
        }
      });
  }

  formatDateOnly(date: string): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  calculateNights(): number {
    if (!this.reservationDetails?.checkInDate || !this.reservationDetails?.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(this.reservationDetails.checkInDate);
    const checkOut = new Date(this.reservationDetails.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
}
