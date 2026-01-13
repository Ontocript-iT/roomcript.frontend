import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GuestService } from '../../../core/services/guest.service';
import { Guest } from '../../../core/models/guest.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './guest-list.html',
  styleUrls: ['./guest-list.scss']
})
export class GuestListComponent implements OnInit {
  guests: Guest[] = [];
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || 'PROP0005';

  constructor(
    private guestService: GuestService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests(): void {
    this.isLoading = true;
    this.guestService.getAllGuests(this.propertyCode).subscribe({
      next: data => {
        this.guests = data;
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        console.error('Error loading guests:', err);
      }
    });
  }

  viewGuest(guest: Guest): void {
    Swal.fire({
      title: 'Guest Details',
      html: `
    <div class="text-left space-y-2" style="font-size: 14px;">
      <!-- Personal Info -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 60px;">Name: </span>
          <span>${guest.name}</span>
        </div>
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 60px;">Email: </span>
          <span>${guest.email || 'N/A'}</span>
        </div>
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 60px;">Phone: </span>
          <span>${guest.phone || 'N/A'}</span>
        </div>
      </div>

      <hr class="my-4 border-gray-300" />
      <h3 class="font-semibold text-lg mb-4 text-gray-800">Address Details</h3>
      <div class="grid grid-cols-2 gap-x-8 gap-y-4">
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 65px;">Address: </span>
          <span>${guest.address || 'N/A'}</span>
        </div>
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 65px;">City: </span>
          <span>${guest.city || 'N/A'}</span>
        </div>
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 65px;">State: </span>
          <span>${guest.state || 'N/A'}</span>
        </div>
        <div class="flex">
          <span class="font-semibold inline-block" style="min-width: 65px;">Country: </span>
          <span>${guest.country || 'N/A'}</span>
        </div>
        <div class="col-span-2 flex">
          <span class="font-semibold inline-block" style="min-width: 65px;">Zip Code: </span>
          <span>${guest.zipCode || 'N/A'}</span>
        </div>
      </div>
    </div>
  `,
      icon: 'info',
      iconColor: '#6366f1',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Close',
      width: '800px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        cancelButton: 'swal-cancel-btn'
      }
    });
  }





  editGuest(guest: Guest): void {
    Swal.fire({
      title: 'Edit Guest',
      html: `
    <div class="text-left space-y-2" style="font-size: 14px;">
      <div class="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label class="block font-semibold mb-1">Name:</label>
          <input id="editName" value="${guest.name || ''}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Email:</label>
          <input id="editEmail" value="${guest.email || ''}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Phone:</label>
          <input id="editPhone" value="${guest.phone || ''}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="col-span-2">
          <label class="block font-semibold mb-1">Address:</label>
          <textarea id="editAddress" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${guest.address || ''}</textarea>
        </div>
      </div>
    </div>
  `,
      icon: 'info',
      iconColor: '#6366f1',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Close',
      width: '900px',
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
        const popup = Swal.getPopup();
        return {
          name: (popup?.querySelector('#editName') as HTMLInputElement)?.value,
          email: (popup?.querySelector('#editEmail') as HTMLInputElement)?.value,
          phone: (popup?.querySelector('#editPhone') as HTMLInputElement)?.value,
          address: (popup?.querySelector('#editAddress') as HTMLTextAreaElement)?.value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedGuest = { ...guest, ...result.value };

        this.guestService.updateGuest(guest.id, updatedGuest).subscribe({
          next: () => {
            this.showSuccess(`Guest ${updatedGuest.name} updated successfully!`);
            this.loadGuests();
          },
          error: (error) => {
            console.error('Update guest error:', error);
            this.showError('Failed to update guest');
          }
        });
      }
    });
  }



  deleteGuest(guest: Guest): void {
    Swal.fire({
      title: 'Delete Guest',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <div class="mt-4 text-center">
          Are you sure you want to delete guest <strong>${guest.name}</strong>?
        </div>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, Delete`,
      cancelButtonText: `Close`,
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold text-gray-800',
        htmlContainer: 'text-sm text-gray-700',
        confirmButton: 'swal-delete-btn',
        cancelButton: 'swal-cancel-btn'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.guestService.deleteGuest(guest.id).subscribe({
          next: () => {
            this.showSuccess(`Guest ${guest.name} deleted successfully.`);
            this.loadGuests();
          },
          error: (error) => {
            console.error('Delete guest error:', error);
            this.showError('Failed to delete guest');
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
