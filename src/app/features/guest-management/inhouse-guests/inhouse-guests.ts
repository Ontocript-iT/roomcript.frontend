import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { InhouseGuest } from '../../../core/models/guest.model';
import { GuestService } from '../../../core/services/guest.service';
import { AuthService } from '../../../core/services/auth.service';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inhouse-guests',
  imports: [
    MatIconModule,
    MatButton,
    MatCardModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconButton,
    MatTooltipModule,
    MatMenuTrigger,
    MatMenuModule
  ],
  templateUrl: './inhouse-guests.html',
  styleUrls: ['./inhouse-guests.scss']
})
export class InhouseGuestsComponent implements OnInit {
  guests: InhouseGuest[] = [];
  isLoading = false;
  propertyCode: string = '';

  constructor(
    private guestService: GuestService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.propertyCode = localStorage.getItem("propertyCode") || '';
    this.loadInHouseGuests();
  }

  loadInHouseGuests(): void {
    if (!this.propertyCode) {
      this.showMessage('Property code not found', 'error');
      return;
    }

    this.isLoading = true;
    this.guestService.getInHouseGuests(this.propertyCode).subscribe({
      next: (data) => {
        this.guests = data;
        this.isLoading = false;
        console.log('Loaded in-house guests:', this.guests.length);
      },
      error: (error) => {
        console.error('Error loading in-house guests:', error);
        this.showMessage('Failed to load in-house guests', 'error');
        this.isLoading = false;
      }
    });
  }

  refreshGuests(): void {
    this.loadInHouseGuests();
    this.showMessage('Guest list refreshed', 'success');
  }

  checkOutGuest(guest: InhouseGuest): void {
    if (confirm(`Are you sure you want to check out ${guest.name}?`)) {
      this.showMessage(`${guest.name} checked out successfully`, 'success');
      this.loadInHouseGuests();
    }
  }

  editReservation(guest: InhouseGuest): void {
    this.router.navigate(['/reservations/edit', guest.guestId]);
  }

  viewBilling(guest: InhouseGuest): void {
    this.router.navigate(['/billing', guest.guestId]);
  }

  changeRoom(guest: InhouseGuest): void {
    this.showMessage('Room change feature coming soon', 'info');
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  viewGuest(guest: InhouseGuest): void {
    Swal.fire({
      title: 'In-House Guest Details',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px; max-height: 350px; overflow-y: auto; padding-right: 10px;">
        <!-- Personal Info -->
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Guest Name: </span>
            <span>${guest.name}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Email: </span>
            <span>${guest.email || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Phone: </span>
            <span>${guest.phone || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Confirmation #: </span>
            <span>${guest.confirmationNumber}</span>
          </div>
        </div>

        <hr class="my-4 border-gray-300" />

        <!-- Reservation Info -->
        <h3 class="font-semibold text-lg mb-4 text-gray-800">Reservation Details</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Room Number: </span>
            <span>${guest.roomNumber || 'Not Assigned'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Room Type: </span>
            <span>${guest.roomType || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Check-In Date: </span>
            <span>${guest.checkInDate || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Check-Out Date: </span>
            <span>${guest.checkOutDate || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Status: </span>
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">${guest.status}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Booking Source: </span>
            <span>${guest.bookingSource || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Guests: </span>
            <span>${guest.numberOfAdults} Adults, ${guest.numberOfChildren} Children</span>
          </div>
        </div>

        <hr class="my-4 border-gray-300" />

        <!-- Financial Info -->
        <h3 class="font-semibold text-lg mb-4 text-gray-800">Financial Details</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Total Amount: </span>
            <span class="font-semibold text-indigo-600">$${guest.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Paid Amount: </span>
            <span>$${guest.paidAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Payment Status: </span>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${guest.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${guest.paymentStatus}</span>
          </div>
        </div>

        <hr class="my-4 border-gray-300" />

        <!-- Address Details -->
        <h3 class="font-semibold text-lg mb-4 text-gray-800">Address Details</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Address: </span>
            <span>${guest.address || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">City: </span>
            <span>${guest.city || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">State: </span>
            <span>${guest.state || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Country: </span>
            <span>${guest.country || 'N/A'}</span>
          </div>
          <div class="flex">
            <span class="font-semibold inline-block" style="min-width: 120px;">Zip Code: </span>
            <span>${guest.zipCode || 'N/A'}</span>
          </div>
        </div>

        ${guest.specialRequests ? `
        <hr class="my-4 border-gray-300" />
        <h3 class="font-semibold text-lg mb-4 text-gray-800">Special Requests</h3>
        <div class="bg-gray-50 p-3 rounded">
          <p>${guest.specialRequests}</p>
        </div>
        ` : ''}
      </div>
    `,
      icon: 'info',
      showConfirmButton: false,
      showCloseButton: true,
      width: '900px',
      heightAuto: false,
      customClass: {
        popup: 'swal-inline-header',
        title: 'text-2xl font-bold text-gray-800',
        htmlContainer: 'text-sm !overflow-visible',
        closeButton: 'hover:!text-red-500 !text-2xl',
        icon: 'swal-small-icon'
      }
    });
  }
}

