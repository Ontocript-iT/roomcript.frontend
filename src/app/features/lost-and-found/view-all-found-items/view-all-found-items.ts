import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HousekeepingService, LostFoundItem, LostFoundResponse } from '../../../core/services/housekeeping.service';

@Component({
  selector: 'app-lost-found-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './view-all-found-items.html',
  styleUrl: './view-all-found-items.scss',
})
export class ViewAllFoundItems implements OnInit {
  items: LostFoundItem[] = [];
  isLoading = true;
  propertyName = 'Ocean View Hotel';
  propertyCode = localStorage.getItem('propertyCode') || 'PROP0016';

  // Filter State
  selectedFilter: 'ALL' | 'UNCLAIMED' = 'ALL';

  constructor(
    private housekeepingService: HousekeepingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    let request$;

    // Switch API based on selection
    if (this.selectedFilter === 'UNCLAIMED') {
      request$ = this.housekeepingService.getUnclaimedItems(this.propertyCode);
    } else {
      request$ = this.housekeepingService.getAllLostAndFound(this.propertyCode);
    }

    request$.subscribe({
      next: (response: LostFoundResponse) => {
        this.items = response.result || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching items:', error);
        this.showNotification('Failed to load items', 'error');
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadItems();
  }

  onViewDetails(item: LostFoundItem): void {
    // Format Dates
    const foundDate = new Date(item.foundDate).toLocaleString();
    const disposeDate = new Date(item.disposeAfterDate).toLocaleDateString();

    // Helper function for status badge
    const getStatusBadge = (status: string): string => {
      const statusConfig: { [key: string]: { class: string, display: string } } = {
        'FOUND': { class: 'bg-green-100 text-green-800', display: 'Found' },
        'CLAIMED': { class: 'bg-blue-100 text-blue-800', display: 'Claimed' },
        'DISPOSED': { class: 'bg-gray-100 text-gray-800', display: 'Disposed' },
        'UNCLAIMED': { class: 'bg-orange-100 text-orange-800', display: 'Unclaimed' }
      };
      const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', display: status };
      return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.class}">${config.display}</span>`;
    };

    // Handle Image
    const imgHtml = item.imageUrl
      ? `<img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
      : `<div style="width: 100%; height: 100%; background: #f3f4f6; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; color: #9ca3af; border: 2px dashed #d1d5db;">
         <svg style="width: 64px; height: 64px; margin-bottom: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
         </svg>
         <span style="font-size: 14px; font-weight: 500;">No Image Available</span>
       </div>`;

    Swal.fire({
      title: 'Lost & Found Item Details',
      html: `
      <div class="text-left space-y-4" style="font-size: 14px;">
        <!-- Item Header -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <span class="text-xs text-gray-500 font-medium">Item:</span>
              <span class="font-bold text-gray-900">${item.itemDescription}</span>
            </div>
            ${getStatusBadge(item.status)}
          </div>
          <div class="mt-2 pt-2">
            <span class="text-xs text-gray-500 font-medium">Item Number:</span>
            <span class="font-bold text-gray-900">${item.itemNumber}</span>
          </div>
        </div>

        <!-- Image + Details Grid -->
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem;">
          <!-- Left: Image -->
          <div style="height: 350px;">
            ${imgHtml}
          </div>

          <!-- Right: Details -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Found Details -->
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
                Found Details
              </h3>
              <div style="display: grid; grid-template-columns: 110px 1fr; gap: 0.5rem; font-size: 13px;">
                <span class="text-gray-600">Room:</span>
                <span class="font-semibold">${item.roomNumber}</span>

                <span class="text-gray-600">Category:</span>
                <span class="font-semibold">${item.category}</span>

                <span class="text-gray-600">Found By:</span>
                <span class="font-semibold">${item.foundByName}</span>

                <span class="text-gray-600">Found Date:</span>
                <span class="font-semibold">${foundDate}</span>

                <span class="text-gray-600">Storage:</span>
                <span class="bg-yellow-50 border border-yellow-200 px-2 py-1 rounded text-xs font-medium inline-block">${item.storageLocation}</span>
              </div>
            </div>

            <!-- Guest Information -->
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Guest Information
              </h3>
              ${item.guestName ? `
                <div style="display: grid; grid-template-columns: 110px 1fr; gap: 0.5rem; font-size: 13px;">
                  <span class="text-gray-600">Name:</span>
                  <span class="font-semibold">${item.guestName}</span>

                  <span class="text-gray-600">Phone:</span>
                  <span class="font-semibold">${item.guestPhone || 'N/A'}</span>

                  <span class="text-gray-600">Email:</span>
                  <span class="font-semibold">${item.guestEmail || 'N/A'}</span>

                  <span class="text-gray-600">Reservation:</span>
                  <span class="text-gray-600 text-xs">${item.reservationConfirmationNumber || 'N/A'}</span>
                </div>
              ` : `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <span class="text-xs text-gray-500 italic">No guest information linked</span>
                </div>
              `}
            </div>

            <!-- Disposal Date -->
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Disposal Information
              </h3>
              <div style="display: grid; grid-template-columns: 110px 1fr; gap: 0.5rem; font-size: 13px;">
                <span class="text-gray-600">Dispose After:</span>
                <span class="font-semibold text-red-600">${disposeDate}</span>
              </div>
            </div>

            <!-- Notes -->
            ${item.notes ? `
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <span class="text-xs font-semibold text-gray-700 flex items-center mb-1">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Notes
                </span>
                <p class="text-xs text-gray-700 italic">"${item.notes}"</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `,
      icon: 'info',
      iconColor: '#3b82f6',
      showCancelButton: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      cancelButtonText: 'Close',
      width: '900px',
      padding: '1.75rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-user-details-popup',
        title: 'swal-large-title',
        htmlContainer: 'swal-user-details-content',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    });
  }

  onNotifyGuest(item: LostFoundItem): void{
    //to do
  }
  onDispose(item: LostFoundItem): void {
    Swal.fire({
      title: 'Dispose Item?',
      text: `Are you sure you want to dispose "${item.itemDescription}"?`,
      icon: 'warning',
      input: 'text',
      inputLabel: 'Reason for disposal',
      inputPlaceholder: 'e.g., Retention period expired',
      inputValue: 'Retention period expired',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Dispose it!'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.isLoading = true;
        this.housekeepingService.disposeItem(item.id, result.value).subscribe({
          next: () => {
            Swal.fire('Disposed!', 'The item has been disposed.', 'success');
            this.loadItems();
          },
          error: () => {
            this.showNotification('Failed to dispose item', 'error');
            this.isLoading = false;
          }
        });
      }
    });
  }
  // --- Helpers ---

  getCategoryColor(category: string): string {
    switch (category) {
      case 'ELECTRONICS': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'CLOTHING': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'DOCUMENTS': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'JEWELRY': return 'text-pink-600 bg-pink-50 border-pink-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
