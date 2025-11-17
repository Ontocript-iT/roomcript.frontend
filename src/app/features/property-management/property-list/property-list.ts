import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { PropertyService, PropertyResponse } from '../../../core/services/property.service';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './property-list.html',
  styleUrls: ['./property-list.scss']
})
export class PropertyList implements OnInit {
  properties: PropertyResponse[] = [];
  isLoading = false;

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.isLoading = false;
        console.log('Properties loaded:', properties);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading properties:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load properties',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  getStatusClass(status: string): string {
    const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ';
    return status === 'ACTIVE'
      ? baseClass + 'bg-green-100 text-green-800'
      : baseClass + 'bg-red-100 text-red-800';
  }

  getStatusDotClass(status: string): string {
    return status === 'ACTIVE'
      ? 'w-2 h-2 bg-green-500 rounded-full mr-2'
      : 'w-2 h-2 bg-red-500 rounded-full mr-2';
  }

  // viewPropertyDetails(property: PropertyResponse): void {
  //   Swal.fire({
  //     title: `<strong>${property.propertyName}</strong>`,
  //     html: `
  //       <div class="text-left space-y-3">
  //         <!-- Property Code -->
  //         <div class="bg-indigo-50 p-3 rounded-lg">
  //           <p class="text-xs text-gray-600 mb-1">Property Code</p>
  //           <p class="font-mono font-bold text-indigo-700">${property.propertyCode}</p>
  //         </div>
  //
  //         <!-- Address -->
  //         <div class="border-b pb-3">
  //           <p class="text-xs text-gray-600 mb-2 flex items-center">
  //             <i class="material-icons text-sm mr-1">location_on</i> Address
  //           </p>
  //           <p class="text-sm font-semibold">${property.address}</p>
  //           <p class="text-sm text-gray-600">${property.city}${property.state ? ', ' + property.state : ''}</p>
  //           <p class="text-sm text-gray-600">${property.country}${property.zipCode ? ' - ' + property.zipCode : ''}</p>
  //         </div>
  //
  //         <!-- Contact Info -->
  //         <div class="border-b pb-3">
  //           <p class="text-xs text-gray-600 mb-2 flex items-center">
  //             <i class="material-icons text-sm mr-1">contact_phone</i> Contact Information
  //           </p>
  //           <p class="text-sm mb-1"><span class="font-semibold">Email:</span> ${property.email}</p>
  //           <p class="text-sm"><span class="font-semibold">Phone:</span> ${property.phone}</p>
  //         </div>
  //
  //         <!-- Property Details -->
  //         <div class="border-b pb-3">
  //           <p class="text-xs text-gray-600 mb-2 flex items-center">
  //             <i class="material-icons text-sm mr-1">info</i> Property Details
  //           </p>
  //           <div class="grid grid-cols-2 gap-2">
  //             <div class="bg-gray-50 p-2 rounded">
  //               <p class="text-xs text-gray-600">Total Rooms</p>
  //               <p class="text-lg font-bold text-indigo-600">${property.totalRooms}</p>
  //             </div>
  //             <div class="bg-gray-50 p-2 rounded">
  //               <p class="text-xs text-gray-600">Floor Count</p>
  //               <p class="text-lg font-bold text-indigo-600">${property.floorCount || 'N/A'}</p>
  //             </div>
  //           </div>
  //         </div>
  //
  //         <!-- Settings -->
  //         <div class="border-b pb-3">
  //           <p class="text-xs text-gray-600 mb-2 flex items-center">
  //             <i class="material-icons text-sm mr-1">settings</i> Settings
  //           </p>
  //           <p class="text-sm mb-1"><span class="font-semibold">Time Zone:</span> ${property.timeZone}</p>
  //           <p class="text-sm mb-1"><span class="font-semibold">Currency:</span> ${property.currency}</p>
  //           <p class="text-sm"><span class="font-semibold">Status:</span>
  //             <span class="px-2 py-1 rounded text-xs font-semibold ${property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
  //               ${property.status}
  //             </span>
  //           </p>
  //         </div>
  //
  //         <!-- Timestamps -->
  //         <div>
  //           <p class="text-xs text-gray-600 mb-2 flex items-center">
  //             <i class="material-icons text-sm mr-1">schedule</i> Timestamps
  //           </p>
  //           <p class="text-xs text-gray-600">
  //             Created: ${new Date(property.createdAt).toLocaleDateString('en-US', {
  //               year: 'numeric',
  //               month: 'long',
  //               day: 'numeric',
  //               hour: '2-digit',
  //               minute: '2-digit'
  //             })}
  //           </p>
  //           ${property.updatedAt ? `
  //             <p class="text-xs text-gray-600 mt-1">
  //               Updated: ${new Date(property.updatedAt).toLocaleDateString('en-US', {
  //                 year: 'numeric',
  //                 month: 'long',
  //                 day: 'numeric',
  //                 hour: '2-digit',
  //                 minute: '2-digit'
  //               })}
  //             </p>
  //           ` : ''}
  //         </div>
  //       </div>
  //     `,
  //     icon: 'info',
  //     confirmButtonText: 'Close',
  //     confirmButtonColor: '#4f46e5',
  //     width: '600px',
  //     customClass: {
  //       popup: 'rounded-xl',
  //       title: 'text-xl font-bold pb-2',
  //       htmlContainer: 'text-sm',
  //       confirmButton: 'rounded-lg px-6 py-2 font-semibold'
  //     }
  //   });
  // }

  viewPropertyDetails(property: PropertyResponse): void {
    Swal.fire({
      title: `<strong>${property.propertyName}</strong>`,
      html: `
      <div class="text-left" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

        <!-- LEFT COLUMN -->
        <div>
          <!-- Property Code -->
          <div class="bg-indigo-50 p-3 rounded-lg" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-1">Property Code</p>
            <p class="font-mono font-bold text-indigo-700">${property.propertyCode}</p>
          </div>

          <!-- Address -->
          <div class=" pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">location_on</i> Address
            </p>
            <p class="text-sm font-semibold">${property.address}</p>
            <p class="text-sm text-gray-600">${property.city}${property.state ? ', ' + property.state : ''}</p>
            <p class="text-sm text-gray-600">${property.country}${property.zipCode ? ' - ' + property.zipCode : ''}</p>
          </div>

          <!-- Contact Info -->
          <div class=" pb-3" style="margin-bottom: 12px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">contact_phone</i> Contact Information
            </p>
            <p class="text-sm mb-1"><span class="font-semibold">Email:</span> ${property.email}</p>
            <p class="text-sm"><span class="font-semibold">Phone:</span> ${property.phone}</p>
          </div>



          <!-- Timestamps -->
          <div>
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">schedule</i> Timestamps
            </p>
            <p class="text-xs text-gray-600">
              Created: ${new Date(property.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
            </p>
            ${property.updatedAt ? `
              <p class="text-xs text-gray-600 mt-1">
                Updated: ${new Date(property.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
              </p>
            ` : ''}
          </div>
          </div>

        <!-- RIGHT COLUMN -->
        <div>
          <!-- Property Details -->
          <div class=" pb-3"style=" margin-top: 80px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">info</i> Property Details
            </p>
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-xs text-gray-600">Total Rooms</p>
                <p class="text-lg font-bold text-indigo-600">${property.totalRooms}</p>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-xs text-gray-600">Floor Count</p>
                <p class="text-lg font-bold text-indigo-600">${property.floorCount || 'N/A'}</p>
              </div>
            </div>
          </div>


          <!-- Settings - ADJUSTED WITH EXTRA MARGIN TOP -->
          <div class=" pb-3" style="margin-bottom: 1px; margin-top: 10px;">
            <p class="text-xs text-gray-600 mb-2 flex items-center">
              <i class="material-icons text-sm mr-1">settings</i> Settings
            </p>
            <p class="text-sm mb-2"><span class="font-semibold">Time Zone:</span> ${property.timeZone}</p>
            <p class="text-sm mb-2"><span class="font-semibold">Currency:</span> ${property.currency}</p>
            <p class="text-sm"><span class="font-semibold">Status:</span>
              <span class="px-2 py-1 rounded text-xs font-semibold ${property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${property.status}
              </span>
            </p>
          </div>

        </div>

      </div>
    `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#4f46e5',
      width: '60%',
      padding: '0.2em',  // ← REDUCED FROM '1.5em' - LESS WHITESPACE AROUND CONTENT
      didOpen: (modal) => {
        const popup = modal.querySelector('.swal2-popup') as HTMLElement;
        if (popup) {
          popup.style.maxHeight = '85vh';  // ← SET SPECIFIC MAX HEIGHT
          popup.style.overflowY = 'hidden';  // ← DISABLE SCROLLING
          popup.style.display = 'flex';
          popup.style.flexDirection = 'column';
        }

      },
      customClass: {
        popup: 'rounded-xl',
        title: 'text-md font-bold pb-1',
        htmlContainer: 'text-sm',
        confirmButton: 'rounded-lg px-6 py-2 font-semibold'
      }
    });
  }


  editProperty(property: PropertyResponse): void {
    console.log('Edit property:', property);
    this.router.navigate(['/properties/edit', property.id]);
  }

  manageUsers(property: PropertyResponse): void {
    console.log('Manage users for property:', property);
    // Store property code in localStorage for user management page
    localStorage.setItem('propertyCode', property.propertyCode);
    this.router.navigate(['/users']);
  }
}
