import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  ReservationService,
  StayViewReservation,
  StayViewRoomType
} from '../../core/services/reservation.service';
import {ViewReservation} from '../reservations/view-reservation/view-reservation';

interface DateCell {
  date: number;
  month: number;
  year: number;
  dayName: string;
  fullDate: Date;
}

interface ReservationDisplay extends StayViewReservation {
  startCol: number;
  spanCols: number;
  room: string;
}

// 🔥 NEW: Interface for empty cell click data
interface EmptyCellClickData {
  roomNumber: string;
  roomType: string;
  date: Date;
  roomId?: number;
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
    FormsModule,
    MatDialogModule,
  ],
  templateUrl: './stay-view.html',
  styles: [`
    :host {
      display: block;
    }
    .scroll-smooth {
      scroll-behavior: smooth;
    }
  `]
})
export class StayView implements OnInit {
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  propertyCode: string = 'PROP0005';
  expandedRoomTypes: Set<number> = new Set<number>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  bufferDays: number = 30;
  visibleDays: number = 60;

  dateCells: DateCell[] = [];
  allDateCells: DateCell[] = [];
  roomTypes: StayViewRoomType[] = [];
  allReservations: StayViewRoomType[] = [];
  loading: boolean = false;
  totalReservations: number = 0;
  currentMonthYear: string = '';

  isSelecting: boolean = false;
  selectionStart: { roomIndex: number; roomTypeIndex: number; cellIndex: number } | null = null;
  selectionEnd: { roomIndex: number; roomTypeIndex: number; cellIndex: number } | null = null;
  selectedCells: Set<string> = new Set();

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
  currentStartIndex: number = 0;

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private dialog: MatDialog
  ) {
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
    const startDate = new Date(this.selectedYear, this.selectedMonth - 1, 1);

    const loadStart = new Date(startDate);
    loadStart.setMonth(startDate.getMonth() - 1);

    this.generateAllDateCells(loadStart, this.visibleDays + this.bufferDays * 2);
    this.loadReservationsForDateRange(loadStart);
  }

  generateAllDateCells(startDate: Date, totalDays: number): void {
    this.allDateCells = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      this.allDateCells.push({
        date: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dayName: dayNames[date.getDay()],
        fullDate: date
      });
    }

    this.currentStartIndex = this.bufferDays;
    this.updateVisibleDates();
  }

  updateVisibleDates(): void {
    this.dateCells = this.allDateCells.slice(
      this.currentStartIndex,
      this.currentStartIndex + this.visibleDays
    );

    const middleDate = this.dateCells[Math.floor(this.visibleDays / 2)];
    if (middleDate) {
      this.selectedMonth = middleDate.month;
      this.selectedYear = middleDate.year;

      const monthName = this.months.find(m => m.value === middleDate.month)?.name || '';
      this.currentMonthYear = `${monthName} ${middleDate.year}`;
    }

    this.filterVisibleReservations();
  }

  filterVisibleReservations(): void {
    if (this.allReservations.length === 0) return;

    const visibleStart = this.dateCells[0].fullDate;
    const visibleEnd = this.dateCells[this.dateCells.length - 1].fullDate;

    this.roomTypes = JSON.parse(JSON.stringify(this.allReservations));

    this.roomTypes.forEach(roomType => {
      roomType.rooms.forEach(room => {
        room.reservations = room.reservations.filter(res => {
          const checkIn = new Date(res.checkInDate);
          const checkOut = new Date(res.checkOutDate);
          return checkOut >= visibleStart && checkIn <= visibleEnd;
        });
        room.reservationCount = room.reservations.length;
      });
    });
  }

  loadReservationsForDateRange(startDate: Date): void {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + this.visibleDays + this.bufferDays * 2);

    const monthsToLoad: {month: number, year: number}[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();

      if (!monthsToLoad.some(m => m.month === month && m.year === year)) {
        monthsToLoad.push({ month, year });
      }

      current.setMonth(current.getMonth() + 1);
    }

    const requests = monthsToLoad.map(({month, year}) =>
      this.reservationService.getAllReservationsByMonth(month, year, this.propertyCode)
    );

    Promise.all(requests.map(req => req.toPromise()))
      .then(responses => {
        this.combineReservations(responses);
        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading reservations:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load reservations. Please try again.',
          confirmButtonColor: '#3b82f6'
        });
        this.loading = false;
      });
  }

  combineReservations(responses: any[]): void {
    const allRoomTypes: StayViewRoomType[] = [];
    let totalRes = 0;

    responses.forEach(response => {
      if (response && response.body) {
        totalRes += response.body.totalReservations || 0;

        response.body.roomTypes?.forEach((rt: StayViewRoomType) => {
          const existing = allRoomTypes.find(r => r.roomType === rt.roomType);

          if (existing) {
            rt.rooms.forEach(room => {
              const existingRoom = existing.rooms.find(r => r.roomNumber === room.roomNumber);
              if (existingRoom) {
                existingRoom.reservations.push(...room.reservations);
              } else {
                existing.rooms.push(room);
              }
            });
            existing.totalRooms = existing.rooms.length;
            existing.totalReservations += rt.totalReservations;
          } else {
            allRoomTypes.push(JSON.parse(JSON.stringify(rt)));
          }
        });
      }
    });

    this.allReservations = allRoomTypes;
    this.totalReservations = totalRes;
    this.filterVisibleReservations();
  }

  preventScroll(event: WheelEvent): void {
    event.preventDefault();
  }

  scrollLeft(): void {
    if (this.currentStartIndex > 0) {
      this.currentStartIndex--;
      this.updateVisibleDates();
    }
  }

  scrollRight(): void {
    if (this.currentStartIndex + this.visibleDays < this.allDateCells.length) {
      this.currentStartIndex++;
      this.updateVisibleDates();
    }
  }

  onMonthYearChange(): void {
    this.loadStayView();
  }

  onScroll(): void {
    // Optional
  }

  toggleRoomType(index: number): void {
    if (this.expandedRoomTypes.has(index)) {
      this.expandedRoomTypes.delete(index);
    } else {
      this.expandedRoomTypes.add(index);
    }
  }

  isRoomTypeExpanded(index: number): boolean {
    return this.expandedRoomTypes.has(index);
  }

  isCurrentMonth(dateCell: DateCell): boolean {
    return dateCell.month === this.selectedMonth && dateCell.year === this.selectedYear;
  }

  // 🔥 UPDATED: Pass event to show menu at click position
  onEmptyCellClick(event: MouseEvent, room: any, roomType: string, dateCellIndex: number): void {
    event.stopPropagation();

    const dateCell = this.dateCells[dateCellIndex];
    const clickData: EmptyCellClickData = {
      roomNumber: room.roomNumber,
      roomType: roomType,
      date: dateCell.fullDate,
      roomId: room.roomId
    };

    this.showEmptyCellMenu(clickData, event); // 🔥 Pass event here
  }

  // 🔥 UPDATED: Show list-style popup menu at click position
  showEmptyCellMenu(data: EmptyCellClickData, event?: MouseEvent): void {
    const formattedDate = this.formatDate(data.date.toISOString());

    Swal.fire({
      title: `<strong class="text-base font-semibold text-gray-700">Room ${data.roomNumber}</strong>`,
      html: `
      <div class="text-left -mt-2">
        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p class="text-xs text-gray-600"><span class="font-medium">Type:</span> ${data.roomType}</p>
          <p class="text-xs text-gray-600"><span class="font-medium">Date:</span> ${formattedDate}</p>
        </div>

        <div class="py-1">
          <!-- Add Reservation -->
          <div id="addReservation" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors">
            <div class="flex items-center justify-center w-5 h-5">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Reservation</p>
              <p class="text-xs text-gray-500">Create a new booking</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-100 my-1"></div>

          <!-- Maintenance Block -->
          <div id="maintenanceBlock" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors">
            <div class="flex items-center justify-center w-5 h-5">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700 group-hover:text-orange-700">Maintenance Block</p>
              <p class="text-xs text-gray-500">Mark room as unavailable</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    `,
      width: '380px',
      showConfirmButton: false,
      showCloseButton: true,
      position: 'center',
      padding: '0',
      customClass: {
        popup: 'rounded-lg shadow-2xl',
        title: 'px-4 py-3 border-b border-gray-200 text-left',
        htmlContainer: 'p-0'
      },
      didOpen: (popup) => {
        // Position popup at click location
        if (event) {
          const clickX = event.clientX;
          const clickY = event.clientY;

          const popupWidth = popup.offsetWidth;
          const popupHeight = popup.offsetHeight;

          let left = clickX + 10;
          let top = clickY + 10;

          if (left + popupWidth > window.innerWidth) {
            left = clickX - popupWidth - 10;
          }

          if (top + popupHeight > window.innerHeight) {
            top = clickY - popupHeight - 10;
          }

          if (left < 10) left = 10;
          if (top < 10) top = 10;

          popup.style.position = 'fixed';
          popup.style.left = `${left}px`;
          popup.style.top = `${top}px`;
          popup.style.margin = '0';
          popup.style.transform = 'none';
        }

        // Add click handlers
        document.getElementById('addReservation')?.addEventListener('click', () => {
          Swal.close();
          this.handleAddReservation(data);
        });

        document.getElementById('maintenanceBlock')?.addEventListener('click', () => {
          Swal.close();
          this.handleMaintenanceBlock(data);
        });
      }
    });
  }

  // 🔥 UPDATED: Start cell selection - block if cell is occupied
  onCellMouseDown(event: MouseEvent, room: any, roomType: string, roomTypeIndex: number, roomIndex: number, cellIndex: number): void {
    if ((event.target as HTMLElement).closest('.absolute.cursor-pointer.rounded-lg')) {
      return;
    }

    if (this.isCellOccupied(room, cellIndex)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.isSelecting = true;
    this.selectionStart = { roomIndex, roomTypeIndex, cellIndex };
    this.selectionEnd = { roomIndex, roomTypeIndex, cellIndex };
    this.selectedCells.clear();
    this.updateSelectedCells(room);
  }

  onCellMouseEnter(event: MouseEvent, room: any, roomTypeIndex: number, roomIndex: number, cellIndex: number): void {
    if (!this.isSelecting || !this.selectionStart) return;

    if (this.selectionStart.roomIndex === roomIndex &&
      this.selectionStart.roomTypeIndex === roomTypeIndex) {

      if (this.isCellOccupied(room, cellIndex)) {
        return;
      }

      this.selectionEnd = { roomIndex, roomTypeIndex, cellIndex };
      this.updateSelectedCells(room);
    }
  }

  // 🔥 UPDATED: Complete selection and open popup
  onCellMouseUp(event: MouseEvent, room: any, roomType: string): void {
    if (!this.isSelecting || !this.selectionStart || !this.selectionEnd) {
      return;
    }

    event.stopPropagation();

    const startCell = Math.min(this.selectionStart.cellIndex, this.selectionEnd.cellIndex);
    const endCell = Math.max(this.selectionStart.cellIndex, this.selectionEnd.cellIndex);

    // 🔥 NEW: Collect only valid (non-occupied) cells
    const validCells: number[] = [];
    for (let i = startCell; i <= endCell; i++) {
      if (!this.isCellOccupied(room, i)) {
        validCells.push(i);
      }
    }

    // If no valid cells selected, just clear selection
    if (validCells.length === 0) {
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionEnd = null;
      this.selectedCells.clear();
      return;
    }

    // If only one cell selected, treat as single click
    if (validCells.length === 1) {
      const dateCell = this.dateCells[validCells[0]];
      const clickData: EmptyCellClickData = {
        roomNumber: room.roomNumber,
        roomType: roomType,
        date: dateCell.fullDate,
        roomId: room.roomId
      };
      this.showEmptyCellMenu(clickData, event);
    } else {
      // Multiple cells selected - show range popup with first and last valid cell
      const firstValidCell = validCells[0];
      const lastValidCell = validCells[validCells.length - 1];
      this.showRangeSelectionMenu(room, roomType, firstValidCell, lastValidCell, event);
    }

    // Reset selection state
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedCells.clear();
  }

  updateSelectedCells(room: any): void {
    if (!this.selectionStart || !this.selectionEnd) return;

    this.selectedCells.clear();

    const startCell = Math.min(this.selectionStart.cellIndex, this.selectionEnd.cellIndex);
    const endCell = Math.max(this.selectionStart.cellIndex, this.selectionEnd.cellIndex);

    for (let i = startCell; i <= endCell; i++) {
      if (!this.isCellOccupied(room, i)) {
        const key = `${this.selectionStart.roomTypeIndex}-${this.selectionStart.roomIndex}-${i}`;
        this.selectedCells.add(key);
      }
    }
  }

  isCellSelected(roomTypeIndex: number, roomIndex: number, cellIndex: number): boolean {
    const key = `${roomTypeIndex}-${roomIndex}-${cellIndex}`;
    return this.selectedCells.has(key);
  }

  isCellOccupied(room: any, cellIndex: number): boolean {
    const dateCell = this.dateCells[cellIndex+1];
    if (!dateCell || !room.reservations) return false;

    // Get the cell date as YYYY-MM-DD string
    const cellDateStr = dateCell.fullDate.toISOString().split('T')[0];

    return room.reservations.some((reservation: StayViewReservation) => {
      const checkInStr = reservation.checkInDate.split('T')[0];
      const checkOutStr = reservation.checkOutDate.split('T')[0];

      // Cell is occupied if it's >= check-in and < check-out
      return cellDateStr >= checkInStr && cellDateStr < checkOutStr;
    });
  }


// 🔥 NEW: Show popup for range selection
  showRangeSelectionMenu(room: any, roomType: string, startCellIndex: number, endCellIndex: number, event?: MouseEvent): void {
    const startDate = this.dateCells[startCellIndex].fullDate;
    const endDate = this.dateCells[endCellIndex].fullDate;
    const nights = endCellIndex - startCellIndex + 1;

    const formattedStartDate = this.formatDate(startDate.toISOString());
    const formattedEndDate = this.formatDate(endDate.toISOString());

    Swal.fire({
      title: `<strong class="text-base font-semibold text-gray-700">Room ${room.roomNumber}</strong>`,
      html: `
      <div class="text-left -mt-2">
        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p class="text-xs text-gray-600"><span class="font-medium">Type:</span> ${roomType}</p>
          <p class="text-xs text-gray-600"><span class="font-medium">Date Range:</span> ${formattedStartDate} - ${formattedEndDate}</p>
          <p class="text-xs text-blue-600 font-semibold"><span class="font-medium">Duration:</span> ${nights} night${nights > 1 ? 's' : ''}</p>
        </div>

        <div class="py-1">
          <!-- Add Reservation -->
          <div id="addReservationRange" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors">
            <div class="flex items-center justify-center w-5 h-5">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Reservation</p>
              <p class="text-xs text-gray-500">Create booking for ${nights} night${nights > 1 ? 's' : ''}</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-100 my-1"></div>

          <!-- Maintenance Block -->
          <div id="maintenanceBlockRange" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors">
            <div class="flex items-center justify-center w-5 h-5">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700 group-hover:text-orange-700">Maintenance Block</p>
              <p class="text-xs text-gray-500">Block for ${nights} night${nights > 1 ? 's' : ''}</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    `,
      width: '380px',
      showConfirmButton: false,
      showCloseButton: true,
      position: 'center',
      padding: '0',
      customClass: {
        popup: 'rounded-lg shadow-2xl',
        title: 'px-4 py-3 border-b border-gray-200 text-left',
        htmlContainer: 'p-0'
      },
      didOpen: (popup) => {
        // Position popup at mouse location
        if (event) {
          const clickX = event.clientX;
          const clickY = event.clientY;

          const popupWidth = popup.offsetWidth;
          const popupHeight = popup.offsetHeight;

          let left = clickX + 10;
          let top = clickY + 10;

          if (left + popupWidth > window.innerWidth) {
            left = clickX - popupWidth - 10;
          }

          if (top + popupHeight > window.innerHeight) {
            top = clickY - popupHeight - 10;
          }

          if (left < 10) left = 10;
          if (top < 10) top = 10;

          popup.style.position = 'fixed';
          popup.style.left = `${left}px`;
          popup.style.top = `${top}px`;
          popup.style.margin = '0';
          popup.style.transform = 'none';
        }

        // Add click handlers with date range
        document.getElementById('addReservationRange')?.addEventListener('click', () => {
          Swal.close();
          this.handleAddReservationRange(room, roomType, startDate, endDate);
        });

        document.getElementById('maintenanceBlockRange')?.addEventListener('click', () => {
          Swal.close();
          this.handleMaintenanceBlockRange(room, startDate, endDate);
        });
      }
    });
  }

  handleAddReservationRange(room: any, roomType: string, startDate: Date, endDate: Date): void {
    console.log('Navigating to Add Reservation with range:', { room, startDate, endDate });

    const checkInDate = startDate.toISOString().split('T')[0];
    const checkOutDate = endDate.toISOString().split('T')[0];

    this.router.navigate(['/reservations/add'], {
      queryParams: {
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        roomType: roomType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        propertyCode: this.propertyCode
      }
    });
  }

  handleMaintenanceBlockRange(room: any, startDate: Date, endDate: Date): void {
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    Swal.fire({
      icon: 'warning',
      title: 'Maintenance Block',
      html: `
      <p class="text-sm text-gray-600">Block this room for maintenance:</p>
      <div class="mt-3 p-3 bg-orange-50 rounded-lg text-left">
        <p class="text-sm"><strong>Room:</strong> ${room.roomNumber}</p>
        <p class="text-sm"><strong>From:</strong> ${this.formatDate(startDate.toISOString())}</p>
        <p class="text-sm"><strong>To:</strong> ${this.formatDate(endDate.toISOString())}</p>
        <p class="text-sm"><strong>Duration:</strong> ${nights} night${nights > 1 ? 's' : ''}</p>
      </div>
      <p class="text-xs text-gray-500 mt-3">This will mark the room as unavailable for these dates.</p>
    `,
      confirmButtonText: 'OK',
      confirmButtonColor: '#f97316'
    });

    // TODO: Implement maintenance block logic for range
  }

  // 🔥 UPDATED: Navigate to reservation add page with pre-filled data
  handleAddReservation(data: EmptyCellClickData): void {
    console.log('Navigating to Add Reservation with data:', data);

    const checkInDate = data.date.toISOString().split('T')[0];

    this.router.navigate(['/reservations/add'], {
      queryParams: {
        roomId: data.roomId,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        checkInDate: checkInDate,
        propertyCode: this.propertyCode
      }
    });
  }

  // 🔥 NEW: Handle "Maintenance Block" action
  handleMaintenanceBlock(data: EmptyCellClickData): void {
    console.log('Maintenance Block clicked:', data);

    Swal.fire({
      icon: 'warning',
      title: 'Maintenance Block',
      html: `
        <p class="text-sm text-gray-600">Block this room for maintenance:</p>
        <div class="mt-3 p-3 bg-orange-50 rounded-lg text-left">
          <p class="text-sm"><strong>Room:</strong> ${data.roomNumber}</p>
          <p class="text-sm"><strong>Date:</strong> ${this.formatDate(data.date.toISOString())}</p>
        </div>
        <p class="text-xs text-gray-500 mt-3">This will mark the room as unavailable.</p>
      `,
      confirmButtonText: 'OK',
      confirmButtonColor: '#f97316'
    });

    // TODO: Implement maintenance block logic
    // this.reservationService.createMaintenanceBlock({
    //   roomId: data.roomId,
    //   date: data.date
    // }).subscribe(...)
  }

  getReservationPosition(reservation: StayViewReservation): { startCol: number; spanCols: number } {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);

    const startIndex = this.dateCells.findIndex(cell =>
      cell.fullDate.toDateString() === checkIn.toDateString()
    );

    const endIndex = this.dateCells.findIndex(cell =>
      cell.fullDate.toDateString() === checkOut.toDateString()
    );

    const startCol = startIndex >= 0 ? startIndex + 1 : 1;
    const spanCols = endIndex >= 0 ? endIndex - startIndex :
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    return { startCol, spanCols };
  }

  getReservationColor(reservation: StayViewReservation): string {
    if (reservation.status === 'CONFIRMED' && reservation.checkInStatus) {
      return 'bg-green-500';
    } else if (reservation.status === 'CONFIRMED' && !reservation.checkInStatus) {
      return 'bg-blue-500';
    } else if (reservation.status === 'CANCELLED') {
      return 'bg-red-500';
    } else if (reservation.paymentStatus === 'PENDING') {
      return 'bg-yellow-500';
    } else if (reservation.paymentStatus === 'PAID') {
      return 'bg-emerald-600';
    }
    return 'bg-gray-500';
  }

  // 🔥 NEW: View reservation - same pattern as your example
  showReservationDetails(reservation: StayViewReservation): void {
    this.openViewReservationDialog(reservation);
  }

// 🔥 NEW: Open dialog with right-side panel styling
  openViewReservationDialog(reservation: StayViewReservation): void {
    const dialogRef = this.dialog.open(ViewReservation, {
      width: '50vw', // 🔥 1/3 of screen width
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      data: { reservation: reservation },
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
      if (result) {
        console.log('Dialog closed with result:', result);
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
