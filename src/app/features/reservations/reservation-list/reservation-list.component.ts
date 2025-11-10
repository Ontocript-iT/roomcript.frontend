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
    MatTooltipModule
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent implements OnInit {
  reservations: Reservation[] = [];
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || '';

  constructor(
    private reservationService: ReservationService,
    private router: Router
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

  viewReservation(reservation: Reservation): void {
    const roomsHtml = reservation.roomDetails && reservation.roomDetails.length > 0
      ? `
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">#</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Number</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Type</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Rate</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Adults</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Children</th>
        </tr>
      </thead>
      <tbody>
        ${reservation.roomDetails.map((room, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">${index + 1}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111827;">${room.roomNumber}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${room.roomType}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">$${room.roomRate?.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfAdults ?? 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfChildren ?? 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
      : '<p class="text-gray-500 text-sm">No room details available</p>';

    Swal.fire({
      title: 'Reservation Details',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
          <div class="flex">
            <span class="font-semibold">Name: </span>
            <span>${reservation.name}</span>
          </div>
          <div class="flex">
            <span class="font-semibold">Email: </span>
            <span>${reservation.email}</span>
          </div>
          <div class="flex">
            <span class="font-semibold">Phone: </span>
            <span>${reservation.phone || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold">Address: </span>
            <span>${reservation.address || 'N/A'}</span>
          </div>
        </div>

        <hr class="my-3 border-gray-300" />

        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
          <div class="flex">
            <span class="font-semibold">Check-In: </span>
            <span>${new Date(reservation.checkInDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div class="flex">
            <span class="font-semibold">Check-Out: </span>
            <span>${new Date(reservation.checkOutDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <div class="flex mb-2">
            <span class="font-semibold">Total Guests: </span>
            <span>${reservation.numberOfGuests || 'N/A'}</span>
          </div>

          <div class="flex mb-2">
            <span class="font-semibold">Room Count: </span>
            <span>${reservation.roomCount || reservation.roomDetails?.length || 'N/A'}</span>
          </div>
        </div>
        <div class="mb-3">
          ${roomsHtml}
        </div>

        <hr class="my-3 border-gray-300" />

        <div class="flex mb-2">
          <span class="font-semibold w-40">Total Amount:</span>
          <span>$${reservation.totalAmount?.toFixed(2)}</span>
        </div>

        <div class="flex mb-2">
          <span class="font-semibold w-40">Status:</span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              reservation.status === 'CONFIRMED' ? 'bg-green-200 text-green-800' :
                reservation.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'}">
            ${reservation.status}
          </span>
        </div>
      </div>
    `,
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#6b7280',
      width: '800px',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold text-gray-800',
        htmlContainer: 'text-sm',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold'
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

  editReservation(id: number): void {
    this.router.navigate(['/reservations/edit', id]);
  }

  deleteReservation(id: number): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.deleteReservation(id).subscribe({
        next: () => {
          this.loadReservations();
        },
        error: (err) => {
          console.error('Error canceling reservation', err);
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'primary';
      case 'PENDING': return 'accent';
      case 'CANCELLED': return 'warn';
      default: return '';
    }
  }
}
