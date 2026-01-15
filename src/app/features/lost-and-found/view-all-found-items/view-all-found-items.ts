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

    // Determine Status Badge Color for HTML
    const statusColor = item.status === 'FOUND' ? '#10B981' : '#6B7280'; // Green or Gray
    const statusBadge = `<span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">${item.status}</span>`;

    // Handle Image
    const imgHtml = item.imageUrl
      ? `<img src="${item.imageUrl}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e7eb;">`
      : `<div style="width: 100%; height: 150px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 16px; color: #9ca3af;"><span style="font-size: 14px;">No Image Available</span></div>`;

    Swal.fire({
      title: `<div style="text-align: left; font-size: 18px; color: #111827;">${item.itemDescription}</div>`,
      html: `
        <div style="text-align: left; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span style="font-size: 12px; color: #6B7280;">${item.itemNumber}</span>
            ${statusBadge}
          </div>

          ${imgHtml}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">

            <div style="grid-column: span 2; background: #f9fafb; padding: 10px; border-radius: 6px;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px; display: flex; align-items: center;">
                <span class="material-icons" style="font-size: 16px; margin-right: 4px;">location_on</span> Found Details
              </div>
              <div style="color: #4B5563;">Room: <b>${item.roomNumber}</b></div>
              <div style="color: #4B5563;">By: ${item.foundByName}</div>
              <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${foundDate}</div>
            </div>

            <div style="grid-column: span 2; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px; display: flex; align-items: center;">
                <span class="material-icons" style="font-size: 16px; margin-right: 4px;">person</span> Guest Information
              </div>
              ${item.guestName ? `
                <div style="color: #4B5563;">Name: <b>${item.guestName}</b></div>
                <div style="color: #4B5563;">Phone: ${item.guestPhone || 'N/A'}</div>
                <div style="color: #4B5563;">Email: ${item.guestEmail || 'N/A'}</div>
                <div style="color: #6B7280; font-size: 11px; margin-top: 4px;">Res #: ${item.reservationConfirmationNumber || 'N/A'}</div>
              ` : '<span style="color: #9ca3af; font-style: italic;">No guest information linked.</span>'}
            </div>

            <div style="grid-column: span 2;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 2px;">Storage Location</div>
              <div style="color: #4B5563; background: #fff; border: 1px dashed #d1d5db; padding: 8px; border-radius: 4px;">
                ${item.storageLocation}
              </div>
            </div>

             <div>
              <div style="font-weight: 600; color: #374151;">Category</div>
              <div style="color: #4B5563;">${item.category}</div>
            </div>
            <div>
               <div style="font-weight: 600; color: #374151;">Dispose After</div>
               <div style="color: #ef4444;">${disposeDate}</div>
            </div>

            <div style="grid-column: span 2; margin-top: 8px;">
               <div style="font-weight: 600; color: #374151;">Notes</div>
               <div style="color: #4B5563; font-style: italic; font-size: 12px;">"${item.notes}"</div>
            </div>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false, // Hide the "OK" button for a cleaner view
      width: '450px',
      padding: '1.5rem',
      customClass: {
        popup: 'rounded-xl shadow-2xl'
      }
    });
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
