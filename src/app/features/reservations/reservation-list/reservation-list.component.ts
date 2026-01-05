import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {Router, RouterLink} from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UpdateReservation } from '../update-reservation/update-reservation';
import {MatNativeDateModule} from '@angular/material/core';
import {FilterReservation} from '../filter-reservation/filter-reservation';
import {ViewReservation} from '../view-reservation/view-reservation';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    RouterLink,
    MatCard,
    MatCardContent,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatNativeDateModule,
    FilterReservation,
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent implements OnInit {
  reservations: Reservation[] = [];
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || '';
  showFilter = false;
  private style: any;

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;

    this.reservationService.getReservations(this.propertyCode).subscribe({
      next: (data) => {
        this.reservations = this.sortReservations(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading reservations', err);
      }
    });
  }

  fetchFilteredReservations(filterParams: any): void {
    this.isLoading = true;

    this.reservationService.getFilteredReservations(filterParams, this.propertyCode).subscribe({
      next: (data) => {
        this.reservations = this.sortReservations(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching filtered reservations', err);
        this.reservations = [];
      }
    });
  }

  private sortReservations(reservations: Reservation[]): Reservation[] {

    return reservations.sort((a, b) => {
      const statusA = (a.status || '').toUpperCase().trim();
      const statusB = (b.status || '').toUpperCase().trim();

      if (statusA === 'CANCELLED' && statusB !== 'CANCELLED') {
        return 1;
      }
      if (statusB === 'CANCELLED' && statusA !== 'CANCELLED') {
        return -1;
      }

      const statusPriority: { [key: string]: number } = {
        'CONFIRMED': 1,
        'PENDING': 2,
        'CANCELLED': 3
      };

      const priorityA = statusPriority[statusA] || 2;
      const priorityB = statusPriority[statusB] || 2;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = new Date(a.checkInDate).getTime();
      const dateB = new Date(b.checkInDate).getTime();
      return dateA - dateB;
    });
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;

    // Reload all reservations when filter is closed
    if (!this.showFilter) {
      this.loadReservations();
    }
  }

  viewReservation(reservation: Reservation): void {
    this.openViewReservationDialog(reservation);
  }

  openViewReservationDialog(reservation: Reservation): void {
    const dialogRef = this.dialog.open(ViewReservation, {
      width: '60vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      data: { reservation },
      disableClose: false,
      panelClass: 'right-side-panel-dialog',
      position: {
        top: '0',
        right: '0'
      },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop-dark',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      // Optionally handle any actions after the dialog closes
    });
  }

  private printReservationDetails(content: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="">
        <head>
          <title>Reservation Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
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

  editReservation(reservation: Reservation): void {
    if (!reservation.id) {
      this.showError('Invalid reservation ID');
      console.error('Reservation missing ID:', reservation);
      return;
    }

    console.log('Navigating to edit reservation:', reservation.id);

    this.router.navigate(['/reservations/edit', reservation.id], {
      state: { reservation: reservation }
    });

  }


    cancelReservation(reservation: any): void {
    const cancellationReasons = [
      'Guest request',
      'Duplicate reservation',
      'Unconfirmed reservation',
      'Other'
    ];

    // Build the select HTML options
    const optionsHtml = cancellationReasons.map(reason =>
      `<option value="${reason}">${reason}</option>`
    ).join('');

    Swal.fire({
      title: 'Cancel Reservation',
      html: `
    <div class="text-left space-y-2" style="font-size: 14px;">
      <div class="w-full mb-2">
        <label for="cancelReasonSelect" class="block mb-2 font-medium text-gray-700">Cancellation Reason</label>
        <select id="cancelReasonSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="" disabled selected>Select a reason</option>
          ${optionsHtml}
        </select>
      </div>
      <div class="mt-4 text-center">
        Are you sure you want to cancel reservation for <strong>${reservation.name}</strong>?
      </div>
    </div>
  `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
      customClass: {
        popup: 'text-xs',
        title: 'text-sm font-bold',
        htmlContainer: 'text-xs',
        confirmButton: 'text-xs px-4 py-2 rounded-lg',
        cancelButton: 'text-xs px-4 py-2 rounded-lg'
      },
      preConfirm: () => {
        const select = (Swal.getPopup() as HTMLElement).querySelector<HTMLSelectElement>('#cancelReasonSelect');
        if (!select || !select.value) {
          Swal.showValidationMessage('Please select a cancellation reason');
          return null;
        }
        return select.value;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.reservationService.cancelReservation(reservation.id, result.value).subscribe({
          next: () => {
            this.showSuccess(`Reservation for ${reservation.name} cancelled successfully.`);
            this.loadReservations();
          },
          error: (error) => {
            console.error('Cancel reservation error:', error);
            this.showError('Failed to cancel reservation');
          }
        });
      }
    });
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
          true,
          false
        ).subscribe({
          next: () => {
            this.showSuccess(`${reservation.name} checked in successfully`);
            this.loadReservations();
          },
          error: (error) => {
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'primary';
      case 'PENDING': return 'accent';
      case 'CANCELLED': return 'warn';
      default: return '';
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
}
