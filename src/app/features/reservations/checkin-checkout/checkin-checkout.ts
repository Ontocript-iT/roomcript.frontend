import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import Swal from 'sweetalert2';
import {RouterLink} from '@angular/router';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

@Component({
  selector: 'app-checkin-checkout',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './checkin-checkout.html',
  styleUrls: ['./checkin-checkout.scss']
})
export class CheckinCheckoutComponent implements OnInit {
  reservations: Reservation[] = [];
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || '';

  constructor(
    private reservationService: ReservationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;

    this.reservationService.getReservations(this.propertyCode).subscribe({
      next: (data) => {
        this.reservations = data;
        console.log('nn:',data);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading reservations', err);
      }
    });
  }

  getRoomNumbers(reservation: Reservation): string {
    if (!reservation.roomDetails || reservation.roomDetails.length === 0) {
      return 'N/A';
    }
    return reservation.roomDetails.map(room => room.roomNumber).join(', ');
  }

  getUniqueRoomTypes(reservation: Reservation): string {
    if (!reservation.roomDetails || reservation.roomDetails.length === 0) {
      return 'N/A';
    }
    const roomTypes = reservation.roomDetails.map(room => room.roomType);
    const uniqueTypes = [...new Set(roomTypes)];

    return uniqueTypes.join(', ');
  }

  onCheckIn(reservation: any): void {
    Swal.fire({
      title: 'Check-In Confirmation',
      html: `Check in ${reservation.name}?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Check In',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'text-sm',
        title: 'text-base font-bold',
        htmlContainer: 'text-xs',
        confirmButton: 'text-xs px-4 py-2 rounded-lg',
        cancelButton: 'text-xs px-4 py-2 rounded-lg'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservationService.updateCheckInAndCheckOutStatus(
          reservation.id,
          true,  // isCheckedIn
          false  // isCheckedOut
        ).subscribe({
          next: () => {
            this.showSuccess(`${reservation.name} checked in successfully`);
            this.loadReservations();
          },
          error: (error) => {
            console.error('Full error response:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.error);

            const errorMsg = error.error?.message || error.error?.body || 'Failed to check in guest';
            this.showError(errorMsg);
          }
        });
      }
    });
  }

  onCheckOut(reservation: any): void {
    Swal.fire({
      title: 'Check-Out Confirmation',
      html: `Check out ${reservation.name}?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Check Out',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservationService.updateCheckInAndCheckOutStatus(
          reservation.id,
          true,  // isCheckedIn (keep as true)
          true   // isCheckedOut
        ).subscribe({
          next: () => {
            this.showSuccess(`${reservation.name} checked out successfully`);
            this.loadReservations();
          },
          error: (error) => {
            this.showError('Failed to check out guest');
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
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
