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
import {PropertyUser} from '../../../core/services/user.service';
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
        this.reservations = data;
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
        // Ensure filtered data normalized identically in service
        this.reservations = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching filtered reservations', err);
        this.reservations = [];
      }
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
      width: '900px',
      maxWidth: '95vw',
      data: { reservation: reservation },
      disableClose: false,
      panelClass: 'swal-style-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      // Optionally handle any actions after the dialog closes
    });
  }

//   viewReservation(reservation: Reservation): void {
//     const roomsHtml = reservation.roomDetails && reservation.roomDetails.length > 0
//       ? `
//   <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
//     <thead>
//       <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">#</th>
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Number</th>
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Type</th>
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Rate</th>
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Adults</th>
//         <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Children</th>
//       </tr>
//     </thead>
//     <tbody>
//       ${reservation.roomDetails.map((room, index) => `
//         <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
//           <td style="padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">${index + 1}</td>
//           <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111827;">${room.roomNumber}</td>
//           <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${room.roomType}</td>
//           <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">$${room.roomRate?.toFixed(2)}</td>
//           <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfAdults ?? 'N/A'}</td>
//           <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfChildren ?? 'N/A'}</td>
//         </tr>
//       `).join('')}
//     </tbody>
//   </table>
// `
//       : '<p class="text-gray-500 text-sm">No room details available</p>';
//
//     const printContent = `
//     <div style="padding: 20px; font-family: Arial, sans-serif;">
//       <h2 style="text-align: center; margin-bottom: 20px; color: #111827;">Reservation Details</h2>
//       <div style="font-size: 14px;">
//         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; margin-bottom: 20px;">
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 80px;">Name:</span>
//             <span>${reservation.name}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 80px;">Email:</span>
//             <span>${reservation.email}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 80px;">Phone:</span>
//             <span>${reservation.phone || 'N/A'}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 80px;">Address:</span>
//             <span>${reservation.address || 'N/A'}</span>
//           </div>
//         </div>
//
//         <hr style="margin: 1rem 0; border-color: #d1d5db;" />
//
//         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; margin-bottom: 20px;">
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 100px;">Check-In:</span>
//             <span>${new Date(reservation.checkInDate).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     })}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 100px;">Check-Out:</span>
//             <span>${new Date(reservation.checkOutDate).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     })}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 100px;">Total Guests:</span>
//             <span>${reservation.numberOfGuests || 'N/A'}</span>
//           </div>
//           <div style="display: flex; gap: 0.5rem;">
//             <span style="font-weight: 600; min-width: 100px;">Room Count:</span>
//             <span>${reservation.roomCount || reservation.roomDetails?.length || 'N/A'}</span>
//           </div>
//         </div>
//
//         ${roomsHtml}
//
//         <hr style="margin: 1rem 0; border-color: #d1d5db;" />
//
//         <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
//           <span style="font-weight: 600; min-width: 120px;">Total Amount:</span>
//           <span>$${reservation.totalAmount?.toFixed(2)}</span>
//         </div>
//
//         <div style="display: flex; gap: 0.5rem;">
//           <span style="font-weight: 600; min-width: 120px;">Status:</span>
//           <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 12px; font-weight: 600; ${
//       reservation.status === 'CONFIRMED' ? 'background-color: #bbf7d0; color: #166534;' :
//         reservation.status === 'PENDING' ? 'background-color: #fef08a; color: #854d0e;' :
//           'background-color: #fecaca; color: #991b1b;'
//     }">
//             ${reservation.status}
//           </span>
//         </div>
//       </div>
//     </div>
//   `;
//
//     Swal.fire({
//       title: 'Reservation Details',
//       html: `
//     <div class="text-left" style="font-size: 14px;">
//       <div class="grid grid-cols-2" style="gap: 0.5rem 2rem;">
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 80px;">Name:</span>
//           <span>${reservation.name}</span>
//         </div>
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 80px;">Email:</span>
//           <span>${reservation.email}</span>
//         </div>
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 80px;">Phone:</span>
//           <span>${reservation.phone || 'N/A'}</span>
//         </div>
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 80px;">Address:</span>
//           <span>${reservation.address || 'N/A'}</span>
//         </div>
//       </div>
//
//       <hr style="margin: 1rem 0; border-color: #d1d5db;" />
//
//       <div class="grid grid-cols-2" style="gap: 0.5rem 2rem;">
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 100px;">Check-In:</span>
//           <span>${new Date(reservation.checkInDate).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       })}
//           </span>
//         </div>
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 100px;">Check-Out:</span>
//           <span>${new Date(reservation.checkOutDate).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       })}
//           </span>
//         </div>
//
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 100px;">Total Guests:</span>
//           <span>${reservation.numberOfGuests || 'N/A'}</span>
//         </div>
//
//         <div class="flex" style="gap: 0.5rem;">
//           <span class="font-semibold" style="min-width: 100px;">Room Count:</span>
//           <span>${reservation.roomCount || reservation.roomDetails?.length || 'N/A'}</span>
//         </div>
//       </div>
//
//       <div style="margin-top: 1rem;">
//         ${roomsHtml}
//       </div>
//
//       <br>
//
//       <div class="flex" style="gap: 0.5rem; margin-bottom: 0.5rem;">
//         <span class="font-semibold" style="min-width: 120px;">Total Amount:</span>
//         <span>$${reservation.totalAmount?.toFixed(2)}</span>
//       </div>
//
//       <div class="flex" style="gap: 0.5rem;">
//         <span class="font-semibold" style="min-width: 120px;">Status:</span>
//         <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
//         reservation.status === 'CONFIRMED' ? 'bg-green-200 text-green-800' :
//           reservation.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
//             'bg-red-200 text-red-800'}">
//           ${reservation.status}
//         </span>
//       </div>
//     </div>
//   `,
//       icon: 'info',
//       showConfirmButton: false,
//       showCancelButton: false,
//       background: '#F3F4F6',
//       width: '900px',
//       footer: `
//       <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 0; border-top: 1px solid #e5e7eb; width: 100%;">
//         <button
//           id="swal-print-btn"
//           style="
//             display: inline-flex;
//             align-items: center;
//             padding: 10px 16px;
//             background: linear-gradient(to right, #4f46e5, #7c3aed);
//             color: white;
//             border: none;
//             border-radius: 8px;
//             font-weight: 600;
//             font-size: 14px;
//             cursor: pointer;
//             box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//             transition: all 0.2s;
//           "
//           onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.2)';"
//           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.1)';"
//         >
//           <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24">
//             <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
//           </svg>
//           Print
//         </button>
//         <button
//           id="swal-close-btn"
//           style="
//             display: inline-flex;
//             align-items: center;
//             padding: 10px 24px;
//             background: white;
//             color: #4b5563;
//             border: 1px solid #d1d5db;
//             border-radius: 8px;
//             font-weight: 600;
//             font-size: 14px;
//             cursor: pointer;
//             transition: all 0.2s;
//             margin-right: 10px;
//           "
//           onmouseover="this.style.backgroundColor='#f3f4f6'; this.style.borderColor='#9ca3af';"
//           onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#d1d5db';"
//         >
//           <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24">
//             <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
//           </svg>
//           Close
//         </button>
//       </div>
//     `,
//       customClass: {
//         popup: 'rounded-xl',
//         title: 'text-2xl font-bold text-gray-800',
//         htmlContainer: 'text-sm',
//         footer: '!p-0 !m-0'
//       },
//       didOpen: () => {
//         const printBtn = document.getElementById('swal-print-btn');
//         const closeBtn = document.getElementById('swal-close-btn');
//
//         printBtn?.addEventListener('click', () => {
//           this.printReservationDetails(printContent);
//         });
//
//         closeBtn?.addEventListener('click', () => {
//           Swal.close();
//         });
//       }
//     });
//   }

  private printReservationDetails(content: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
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
    this.openUpdateDialog(reservation);
  }

  openUpdateDialog(reservation: Reservation): void {
    const dialogRef = this.dialog.open(UpdateReservation, {
      width: '1200px',
      maxWidth: '95vw',
      data: { reservation: reservation },
      disableClose: true,
      panelClass: 'swal-style-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadReservations();
        this.showSuccess('Reservation updated successfully!');
      }
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
