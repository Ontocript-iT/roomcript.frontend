import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
// ✅ FIXED: Import StayViewReservation and StayViewRoomType
import { 
  ReservationService, 
  StayViewReservation,
  StayViewRoomType
} from './../../core/services/reservation.service';

interface DateCell {
  date: number;
  dayName: string;
  fullDate: Date;
}

// ✅ FIXED: Use StayViewReservation
interface ReservationDisplay extends StayViewReservation {
  startCol: number;
  spanCols: number;
  room: string;
}

@Component({
  selector: 'app-stay-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './stay-view.html',
  styles: [`
    :host {
      display: block;
    }
  `]
  // ✅ FIXED: Removed styleUrls - using inline styles instead
})
export class StayView implements OnInit {
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  propertyCode: string = 'PROP0005'; // You can make this dynamic
  
  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  years: number[] = [];
  dateCells: DateCell[] = [];
  roomTypes: StayViewRoomType[] = []; // ✅ FIXED: Use StayViewRoomType
  loading: boolean = false;
  totalReservations: number = 0;

  constructor(private reservationService: ReservationService) {
    // Generate years (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.loadStayView();
  }

  loadStayView(): void {
    this.loading = true;
    this.generateDateCells();
    
    // ✅ FIXED: Only 3 parameters (removed this.token)
    this.reservationService.getAllReservationsByMonth(
      this.selectedMonth,
      this.selectedYear,
      this.propertyCode
    ).subscribe({
      next: (response) => {
        this.roomTypes = response.body.roomTypes;
        this.totalReservations = response.body.totalReservations;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stay view:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load reservations. Please try again.',
          confirmButtonColor: '#3b82f6'
        });
        this.loading = false;
      }
    });
  }

  generateDateCells(): void {
    this.dateCells = [];
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, i);
      this.dateCells.push({
        date: i,
        dayName: dayNames[date.getDay()],
        fullDate: date
      });
    }
  }

  onMonthYearChange(): void {
    this.loadStayView();
  }

  // ✅ FIXED: Use StayViewReservation
  getReservationPosition(reservation: StayViewReservation): { startCol: number; spanCols: number } {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    
    const startCol = checkIn.getDate();
    const endCol = checkOut.getDate();
    const spanCols = endCol - startCol;
    
    return { startCol, spanCols };
  }

  // ✅ FIXED: Use StayViewReservation
  getReservationColor(reservation: StayViewReservation): string {
    // Color coding based on status
    if (reservation.status === 'CONFIRMED' && reservation.checkInStatus) {
      return 'bg-green-500'; // Checked in
    } else if (reservation.status === 'CONFIRMED' && !reservation.checkInStatus) {
      return 'bg-blue-500'; // Confirmed but not checked in
    } else if (reservation.status === 'CANCELLED') {
      return 'bg-red-500'; // Cancelled
    } else if (reservation.paymentStatus === 'PENDING') {
      return 'bg-yellow-500'; // Payment pending
    } else if (reservation.paymentStatus === 'PAID') {
      return 'bg-emerald-600'; // Fully paid
    }
    return 'bg-gray-500'; // Default
  }

  // ✅ FIXED: Use StayViewReservation
  showReservationDetails(reservation: StayViewReservation): void {
    const paymentPercentage = (reservation.paidAmount / reservation.totalAmount * 100).toFixed(2);
    
    Swal.fire({
      title: `<strong class="text-2xl">${reservation.guestName}</strong>`,
      html: `
        <div class="text-left space-y-3 mt-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm font-semibold text-blue-800 mb-2">Reservation Details</p>
            <div class="space-y-2">
              <p class="text-sm"><span class="font-medium">Confirmation #:</span> ${reservation.confirmationNumber}</p>
              <p class="text-sm"><span class="font-medium">Status:</span> 
                <span class="px-2 py-1 rounded text-xs font-semibold ${reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  ${reservation.status}
                </span>
              </p>
            </div>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg">
            <p class="text-sm font-semibold text-purple-800 mb-2">Guest Information</p>
            <div class="space-y-2">
              <p class="text-sm"><span class="font-medium">Email:</span> ${reservation.guestEmail}</p>
              <p class="text-sm"><span class="font-medium">Phone:</span> ${reservation.guestPhone}</p>
              <p class="text-sm"><span class="font-medium">Guests:</span> ${reservation.numberOfGuests}</p>
            </div>
          </div>

          <div class="bg-amber-50 p-4 rounded-lg">
            <p class="text-sm font-semibold text-amber-800 mb-2">Stay Period</p>
            <div class="space-y-2">
              <p class="text-sm"><span class="font-medium">Check-in:</span> ${this.formatDate(reservation.checkInDate)} 
                ${reservation.checkInStatus ? '<span class="text-green-600 font-semibold">✓ Checked In</span>' : '<span class="text-orange-600">⏱ Pending</span>'}
              </p>
              <p class="text-sm"><span class="font-medium">Check-out:</span> ${this.formatDate(reservation.checkOutDate)}
                ${reservation.checkOutStatus ? '<span class="text-green-600 font-semibold">✓ Checked Out</span>' : '<span class="text-orange-600">⏱ Pending</span>'}
              </p>
            </div>
          </div>

          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm font-semibold text-green-800 mb-2">Payment Information</p>
            <div class="space-y-2">
              <p class="text-sm"><span class="font-medium">Total Amount:</span> $${reservation.totalAmount.toFixed(2)}</p>
              <p class="text-sm"><span class="font-medium">Paid Amount:</span> $${reservation.paidAmount.toFixed(2)}</p>
              <p class="text-sm"><span class="font-medium">Balance:</span> $${(reservation.totalAmount - reservation.paidAmount).toFixed(2)}</p>
              <p class="text-sm"><span class="font-medium">Payment Status:</span> 
                <span class="px-2 py-1 rounded text-xs font-semibold ${reservation.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                  ${reservation.paymentStatus} (${paymentPercentage}%)
                </span>
              </p>
            </div>
          </div>

          ${reservation.specialRequests ? `
            <div class="bg-indigo-50 p-4 rounded-lg">
              <p class="text-sm font-semibold text-indigo-800 mb-2">Special Requests</p>
              <p class="text-sm">${reservation.specialRequests}</p>
            </div>
          ` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Close',
      confirmButtonColor: '#3b82f6',
      showCloseButton: true,
      customClass: {
        popup: 'rounded-xl',
        title: 'text-gray-800',
        htmlContainer: 'text-gray-700'
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  isWeekend(dateCell: DateCell): boolean {
    return dateCell.dayName === 'Sat' || dateCell.dayName === 'Sun';
  }

  isToday(dateCell: DateCell): boolean {
    const today = new Date();
    return dateCell.fullDate.toDateString() === today.toDateString();
  }
}
