import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservationService, StayViewReservation } from '../../../core/services/reservation.service';
import { Subject, takeUntil } from 'rxjs';
import { ViewReservation } from '../view-reservation/view-reservation';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Reservation } from '../../../core/models/reservation.model';
import { Router } from '@angular/router';

interface RoomType {
  name: string;
  rooms: Room[];
  isExpanded: boolean;
  roomCount: number;
  reservationCount: number;
}

interface Room {
  number: string;
  reservations: Reservation[];
}

interface DateCell {
  date: number;
  dayName: string;
  month: string;
  fullDate: Date;
  isToday: boolean;
  isWeekend: boolean;
}

interface EmptyCellClickData {
  roomNumber: string;
  roomType: string;
  date: Date;
  roomId?: number;
}

interface CellSelection {
  roomType: string;
  roomNumber: string;
  startDateIndex: number;
  endDateIndex: number;
}

export interface ReservationActionData {
  roomNumber: string;
  roomType: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-reservation-action-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
  <div class="text-left -mt-2 min-w-[220px] max-w-[240px] bg-white overflow-hidden">
    <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <p class="text-xs text-gray-600">
        <span class="font-medium">Type:</span>
        {{ data.roomType }}
      </p>
      <p class="text-xs text-gray-600">
        <span class="font-medium">Date Range:</span>
        {{ data.startDate | date:'MMM d, y' }} - {{ data.endDate | date:'MMM d, y' }}
      </p>
      <p class="text-xs text-blue-600 font-semibold">
        <span class="font-medium">Duration:</span>
        {{ getDayCount() }} night{{ getDayCount() > 1 ? 's' : '' }}
      </p>
    </div>

    <div class="py-1">
      <!-- Add Reservation -->
      <div
        class="group flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
        (click)="onAddReservation()">
        <div class="flex items-center justify-center w-5 h-5">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v16m8-8H4"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Reservation</p>
          <p class="text-xs text-gray-500">
            Create booking for {{ getDayCount() }} night{{ getDayCount() > 1 ? 's' : '' }}
          </p>
        </div>
        <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none"
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5l7 7-7 7"></path>
        </svg>
      </div>

      <div class="border-t border-gray-100 my-1"></div>

      <!-- Maintenance Block -->
      <div
        class="group flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors"
        (click)="onMaintenanceBlock()">
        <div class="flex items-center justify-center w-5 h-5">
          <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-700 group-hover:text-orange-700">Maintenance Block</p>
          <p class="text-xs text-gray-500">
            Block for {{ getDayCount() }} night{{ getDayCount() > 1 ? 's' : '' }}
          </p>
        </div>
        <svg class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none"
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </div>
  </div>
`,
  styles: []
})
export class ReservationActionDialog {
  constructor(
    public dialogRef: MatDialogRef<ReservationActionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ReservationActionData,
  ) {}

  getDayCount(): number {
    const diff = this.data.endDate.getTime() - this.data.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  onAddReservation(): void {
    this.dialogRef.close({ action: 'reservation', data: this.data });
  }

  onMaintenanceBlock(): void {
    this.dialogRef.close({ action: 'maintenance', data: this.data });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

// MAIN COMPONENT
@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.scss'
})
export class CalendarView implements OnInit, OnDestroy {
  currentDate = new Date();
  displayDates: DateCell[] = [];
  visibleDaysCount = 15;
  propertyCode: string = '';
  dateCells: DateCell[] = [];
  roomTypes: RoomType[] = [];

  // Selection properties
  isSelecting = false;
  selectionStart: { roomType: string; roomNumber: string; dateIndex: number } | null = null;
  currentSelection: CellSelection | null = null;
  selectedCells: Set<string> = new Set();

  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.propertyCode = localStorage.getItem('propertyCode') || '';
    this.generateCalendarDates();
    this.loadReservations();

    // Global mouseup listener
    document.addEventListener('mouseup', this.onGlobalMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('mouseup', this.onGlobalMouseUp.bind(this));
  }

  loadReservations(): void {
    this.reservationService.getReservations(this.propertyCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations: Reservation[]) => {
          console.log('Loaded reservations:', reservations);
          this.processReservations(reservations);
        },
        error: (error) => {
          console.error('Error loading reservations:', error);
        }
      });
  }

  processReservations(reservations: Reservation[]): void {
    const roomTypeMap = new Map<string, Map<string, Reservation[]>>();

    reservations.forEach(reservation => {
      if (!reservation.roomDetails || !Array.isArray(reservation.roomDetails)) {
        return;
      }

      reservation.roomDetails.forEach(roomDetail => {
        const roomType = roomDetail.roomType || 'Unknown';
        const roomNumber = roomDetail.roomNumber || '';
        if (!roomNumber) return;

        if (!roomTypeMap.has(roomType)) {
          roomTypeMap.set(roomType, new Map());
        }
        const roomsMap = roomTypeMap.get(roomType)!;

        if (!roomsMap.has(roomNumber)) {
          roomsMap.set(roomNumber, []);
        }

        roomsMap.get(roomNumber)!.push(reservation);
      });
    });

    this.roomTypes = [];
    roomTypeMap.forEach((roomsMap, roomTypeName) => {
      const rooms: Room[] = [];

      roomsMap.forEach((roomReservations, roomNumber) => {
        rooms.push({
          number: roomNumber,
          reservations: roomReservations
        });
      });

      rooms.sort((a, b) => {
        const aNum = parseInt(a.number) || 0;
        const bNum = parseInt(b.number) || 0;
        return aNum - bNum;
      });

      this.roomTypes.push({
        name: roomTypeName,
        rooms,
        isExpanded: true,
        roomCount: rooms.length,
        reservationCount: rooms.reduce((sum, room) => sum + room.reservations.length, 0)
      });
    });

    this.roomTypes.sort((a, b) => a.name.localeCompare(b.name));
  }

  generateCalendarDates(): void {
    this.displayDates = [];
    const startDate = new Date(this.currentDate);

    for (let i = 0; i < this.visibleDaysCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const dayOfWeek = date.getDay();

      this.displayDates.push({
        date: date.getDate(),
        dayName: dayNames[dayOfWeek],
        month: i === 0 || date.getDate() === 1 ? monthNames[date.getMonth()] : '',
        fullDate: date,
        isToday,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    this.dateCells = this.displayDates;
  }

  navigatePrevious(): void {
    this.currentDate.setDate(this.currentDate.getDate() - this.visibleDaysCount);
    this.generateCalendarDates();
  }

  navigateNext(): void {
    this.currentDate.setDate(this.currentDate.getDate() + this.visibleDaysCount);
    this.generateCalendarDates();
  }

  toggleRoomType(roomType: RoomType): void {
    roomType.isExpanded = !roomType.isExpanded;
  }

  getDateIndex(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < this.displayDates.length; i++) {
      const dd = new Date(this.displayDates[i].fullDate);
      dd.setHours(0, 0, 0, 0);
      if (dd.getTime() === d.getTime()) {
        return i;
      }
    }
    return -1;
  }

  getReservationPosition(res: Reservation): { startIndex: number; span: number } | null {
    if (!this.displayDates.length) return null;

    const windowStart = new Date(this.displayDates[0].fullDate);
    const windowEnd = new Date(this.displayDates[this.displayDates.length - 1].fullDate);
    windowStart.setHours(0, 0, 0, 0);
    windowEnd.setHours(0, 0, 0, 0);
    windowEnd.setDate(windowEnd.getDate() + 1);

    let start = new Date(res.checkInDate);
    let end = new Date(res.checkOutDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end <= windowStart || start >= windowEnd) {
      return null;
    }

    if (start < windowStart) start = new Date(windowStart);
    if (end > windowEnd) end = new Date(windowEnd);

    const startIndex = this.getDateIndex(start);
    if (startIndex === -1) return null;

    const span = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    return { startIndex, span };
  }

  bookingSourceColorClasses: Record<string, string> = {
    'Direct': 'bg-amber-800',
    'Booking.com': 'bg-blue-500',
    Airbnb: 'bg-yellow-400 text-black',
  };

  getBookingSourceClasses(res: Reservation): string {
    return this.bookingSourceColorClasses[res.bookingSource || ''] || 'bg-gray-400';
  }

  showReservationDetails(reservation: Reservation): void {
    this.openViewReservationDialog(reservation as unknown as StayViewReservation);
  }

  openViewReservationDialog(reservation: StayViewReservation): void {
    const dialogRef = this.dialog.open(ViewReservation, {
      width: '60vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      data: { reservation },
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

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('Dialog closed with result:', result);
      }
    });
  }

  // CELL SELECTION METHODS
  onCellMouseDown(event: MouseEvent, roomType: string, roomNumber: string, dateIndex: number): void {
    event.preventDefault();

    if (this.isCellReserved(roomType, roomNumber, dateIndex)) {
      return;
    }

    this.isSelecting = true;
    this.selectionStart = { roomType, roomNumber, dateIndex };
    this.selectedCells.clear();
    this.selectedCells.add(this.getCellKey(roomType, roomNumber, dateIndex));

    this.currentSelection = {
      roomType,
      roomNumber,
      startDateIndex: dateIndex,
      endDateIndex: dateIndex
    };
  }

  onCellMouseEnter(roomType: string, roomNumber: string, dateIndex: number): void {
    if (!this.isSelecting || !this.selectionStart) return;

    if (this.selectionStart.roomType !== roomType || this.selectionStart.roomNumber !== roomNumber) {
      return;
    }

    this.selectedCells.clear();
    const startIdx = this.selectionStart.dateIndex;
    const minIdx = Math.min(startIdx, dateIndex);
    const maxIdx = Math.max(startIdx, dateIndex);

    let hasReservedCell = false;
    for (let i = minIdx; i <= maxIdx; i++) {
      if (this.isCellReserved(roomType, roomNumber, i)) {
        hasReservedCell = true;
        break;
      }
    }

    if (!hasReservedCell) {
      for (let i = minIdx; i <= maxIdx; i++) {
        this.selectedCells.add(this.getCellKey(roomType, roomNumber, i));
      }

      this.currentSelection = {
        roomType,
        roomNumber,
        startDateIndex: minIdx,
        endDateIndex: maxIdx
      };
    }
  }

  onGlobalMouseUp(): void {
    if (this.isSelecting && this.currentSelection && this.selectedCells.size > 0) {
      this.openReservationActionDialog();
    }

    this.isSelecting = false;
    this.selectionStart = null;
  }

  isCellSelected(roomType: string, roomNumber: string, dateIndex: number): boolean {
    return this.selectedCells.has(this.getCellKey(roomType, roomNumber, dateIndex));
  }

  isCellReserved(roomType: string, roomNumber: string, dateIndex: number): boolean {
    const roomTypeObj = this.roomTypes.find(rt => rt.name === roomType);
    if (!roomTypeObj) return false;

    const room = roomTypeObj.rooms.find(r => r.number === roomNumber);
    if (!room) return false;

    const targetDate = this.displayDates[dateIndex].fullDate;
    const targetTime = new Date(targetDate).setHours(0, 0, 0, 0);

    return room.reservations.some(res => {
      const checkIn = new Date(res.checkInDate).setHours(0, 0, 0, 0);
      const checkOut = new Date(res.checkOutDate).setHours(0, 0, 0, 0);
      return targetTime >= checkIn && targetTime < checkOut;
    });
  }

  getCellKey(roomType: string, roomNumber: string, dateIndex: number): string {
    return `${roomType}|${roomNumber}|${dateIndex}`;
  }

  openReservationActionDialog(): void {
    if (!this.currentSelection) return;

    const startDate = this.displayDates[this.currentSelection.startDateIndex].fullDate;
    const endDate = new Date(this.displayDates[this.currentSelection.endDateIndex].fullDate);
    endDate.setDate(endDate.getDate() + 1);

    const dialogData: ReservationActionData = {
      roomType: this.currentSelection.roomType,
      roomNumber: this.currentSelection.roomNumber,
      startDate: startDate,
      endDate: endDate
    };

    const dialogRef = this.dialog.open(ReservationActionDialog, {
      width: 'auto',
      maxWidth: '240px',
      data: dialogData,
      autoFocus: false,
      panelClass: ['context-menu-popup'],
    });

    dialogRef.afterClosed().subscribe(result => {
      this.selectedCells.clear();
      this.currentSelection = null;

      if (result) {
        if (result.action === 'reservation') {
          this.handleAddReservation(result.data);
        } else if (result.action === 'maintenance') {
          this.handleMaintenanceBlock(result.data);
        }
      }
    });
  }

  handleAddReservation(data: ReservationActionData): void {

    this.router.navigate(['/reservations/add'], {
      queryParams: {
        roomType: data.roomType,
        roomNumber: data.roomNumber,
        checkIn: data.startDate.toISOString(),
        checkOut: data.endDate.toISOString()
      }
    });
  }

  handleMaintenanceBlock(data: ReservationActionData): void {
    console.log('Add Maintenance Block:', data);
    // TODO: Implement your maintenance block creation logic here
  }
}
