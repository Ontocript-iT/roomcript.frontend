import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GuestService, GuestResponse } from '../../../core/services/guest.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-guest-list',
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
  templateUrl: './guest-list.html',
  styleUrls: ['./guest-list.scss']
})
export class GuestListComponent implements OnInit {
  // ===== COMPONENT STATE: Store guest data and loading status =====
  guests: GuestResponse[] = [];
  isLoading = false;

  constructor(
    private guestService: GuestService,
    private router: Router
  ) {}

  // ===== LIFECYCLE HOOK: Load guests when component initializes =====
  ngOnInit(): void {
    this.loadGuests();
  }

  // ===== LOAD GUESTS: Fetch all guests from backend =====
  loadGuests(): void {
    this.isLoading = true;

    this.guestService.getAllGuests().subscribe({
      next: (data) => {
        console.log('✅ Loading guest data:', data);
        console.log('✅ Total guests loaded:', data.length);
        this.guests = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error loading guests:', err);
        // ===== ERROR NOTIFICATION: Show error to user =====
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Guests',
          text: 'Failed to load guest data. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  // ===== VIEW GUEST DETAILS: Display guest information in popup modal =====
  viewGuest(guest: GuestResponse): void {
    Swal.fire({
      title: `<strong>Guest Details</strong>`,
      html: `
        <div class="text-left space-y-3">
          <!-- Guest ID -->
          <div class="border-b pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-1">Guest ID</p>
            <p class="font-mono font-bold text-indigo-700">#${guest.id}</p>
          </div>

          <!-- Guest Name -->
          <div class="border-b pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">person</i> Name
            </p>
            <p class="text-sm font-semibold">${guest.name}</p>
          </div>

          <!-- Contact Information -->
          <div class="border-b pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">contact_mail</i> Contact Information
            </p>
            <p class="text-sm mb-1"><span class="font-semibold">Email:</span> ${guest.email}</p>
            <p class="text-sm"><span class="font-semibold">Phone:</span> ${guest.phone}</p>
          </div>

          <!-- Address -->
          <div class="border-b pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">location_on</i> Address
            </p>
            <p class="text-sm text-gray-600">${guest.address}</p>
          </div>

          <!-- Status & Joined Date -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-gray-600 mb-2">Status</p>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        guest.isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }">
                <span class="w-2 h-2 ${
        guest.isActive ? 'bg-green-500' : 'bg-red-500'
      } rounded-full mr-2"></span>
                ${guest.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p class="text-xs text-gray-600 mb-2">Joined Date</p>
              <p class="text-sm text-gray-700">${new Date(guest.joinedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
            </div>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#4f46e5',
      width: '600px',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold text-gray-800',
        htmlContainer: 'text-sm',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold'
      }
    });
  }

  // ===== EDIT GUEST: Navigate to guest edit page =====
  editGuest(guest: GuestResponse): void {
    console.log('📝 Editing guest:', guest);
    this.router.navigate(['/guests/edit', guest.id]);
  }

  // ===== DELETE GUEST: Remove guest with confirmation =====
  deleteGuest(guest: GuestResponse): void {
    // ===== CONFIRMATION DIALOG: Ask user to confirm deletion =====
    Swal.fire({
      title: 'Delete Guest?',
      html: `
        <p class="text-gray-700">Are you sure you want to delete <strong>${guest.name}</strong>?</p>
        <p class="text-sm text-red-600 mt-2">This action cannot be undone.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-xl font-bold',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold',
        cancelButton: 'rounded-lg px-6 py-2 font-semibold'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // User confirmed deletion
        this.performDeleteGuest(guest.id);
      }
    });
  }

  // ===== PERFORM DELETE: Execute delete operation =====
  private performDeleteGuest(id: number): void {
    this.guestService.deleteGuest(id).subscribe({
      next: () => {
        console.log('✅ Guest deleted successfully');
        // ===== SUCCESS MESSAGE: Notify user of successful deletion =====
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Guest has been deleted successfully.',
          confirmButtonColor: '#4f46e5',
          timer: 2000,
          showConfirmButton: false
        });
        // Reload guest list
        this.loadGuests();
      },
      error: (err) => {
        console.error('❌ Error deleting guest:', err);
        // ===== ERROR MESSAGE: Notify user of failure =====
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Failed to delete guest. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  // ===== HELPER METHOD: Get status badge color =====
  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  // ===== HELPER METHOD: Format date for display =====
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
