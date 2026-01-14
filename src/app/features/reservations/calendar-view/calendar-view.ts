import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ReservationService} from '../../../core/services/reservation.service';
import {RoomService} from '../../../core/services/room.service';
import {forkJoin, Subject, takeUntil} from 'rxjs';
import {ViewReservation} from '../view-reservation/view-reservation';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Reservation} from '../../../core/models/reservation.model';
import {Router} from '@angular/router';
import {MaintenanceBlock} from '../maintenance-block/maintenance-block';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

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

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="relative p-6">
      <button mat-icon-button (click)="onCancel()"
              class="!absolute !top-2 !right-2 text-red-600">
        <mat-icon>close</mat-icon>
      </button>

      <div class="flex items-center gap-3 mb-4 pr-8">
        <mat-icon class="text-red-icon !text-2xl mb-2">warning</mat-icon>
        <h2 class="text-xl font-semibold text-gray-800">{{ data.title }}</h2>
      </div>

      <p class="text-gray-600 mb-6 whitespace-pre-line">{{ data.message }}</p>

      <div class="flex justify-end">
        <button mat-raised-button color="warn" (click)="onConfirm()">
          {{ data.confirmText || 'Delete' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
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
    private router: Router
  ) {}

  getDayCount(): number {
    const diff = this.data.endDate.getTime() - this.data.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  onAddReservation(): void {
    const stateKey = 'reservation_dates_' + Date.now();
    localStorage.setItem(stateKey, JSON.stringify({
      checkIn: new Date(this.data.startDate),
      checkOut: new Date(this.data.endDate),
      timestamp: Date.now()
    }));

    this.dialogRef.close();
    this.router.navigate(['/reservations/add'], {
      state: { dateStateKey: stateKey }
    });
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
  maintenanceBlocks: any[] = [];
  roomIdMap: Map<string, { roomType: string; roomNumber: string }> = new Map();

  isSelecting = false;
  selectionStart: { roomType: string; roomNumber: string; dateIndex: number } | null = null;
  currentSelection: CellSelection | null = null;
  selectedCells: Set<string> = new Set();

  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private roomService: RoomService,
    private dialog: MatDialog,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.propertyCode = localStorage.getItem('propertyCode') || '';
    this.generateCalendarDates();
    this.loadReservationsAndMaintenance();

    document.addEventListener('mouseup', (event: MouseEvent) => {
      this.onGlobalMouseUp(event);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('mouseup', this.onGlobalMouseUp.bind(this));
  }

  loadReservationsAndMaintenance(): void {
    forkJoin({
      reservations: this.reservationService.getReservations(this.propertyCode),
      maintenanceBlocks: this.reservationService.getMaintenanceBlocks(this.propertyCode),
      allRooms: this.roomService.getRoomsByProperty(this.propertyCode) // Use this method
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ reservations, maintenanceBlocks, allRooms }) => {
          this.processAllRoomsWithReservations(allRooms, reservations);
          this.maintenanceBlocks = maintenanceBlocks;
        },
        error: (error) => {
          console.error('Error loading data:', error);
        }
      });
  }

  processAllRoomsWithReservations(allRooms: any[], reservations: Reservation[]): void {
    const reservationsByRoomNumber = new Map<string, Reservation[]>();

    reservations.forEach(reservation => {
      if (!reservation.roomDetails || !Array.isArray(reservation.roomDetails)) {
        return;
      }

      reservation.roomDetails.forEach(roomDetail => {
        const roomNumber = roomDetail.roomNumber || '';
        if (!roomNumber) return;

        if (!reservationsByRoomNumber.has(roomNumber)) {
          reservationsByRoomNumber.set(roomNumber, []);
        }
        reservationsByRoomNumber.get(roomNumber)!.push(reservation);
      });
    });

    const roomTypeMap = new Map<string, Room[]>();

    allRooms.forEach(room => {
      const roomType = room.roomType || 'Unknown';
      const roomNumber = room.roomNumber || String(room.id);
      const roomId = room.id;

      if (!roomTypeMap.has(roomType)) {
        roomTypeMap.set(roomType, []);
      }

      const roomReservations = reservationsByRoomNumber.get(roomNumber) || [];

      roomTypeMap.get(roomType)!.push({
        number: roomNumber,
        reservations: roomReservations
      });

      if (roomId) {
        this.roomIdMap.set(String(roomId), { roomType, roomNumber });
      }
    });

    this.roomTypes = [];
    roomTypeMap.forEach((rooms, roomTypeName) => {
      rooms.sort((a, b) => {
        const aNum = parseInt(a.number) || 0;
        const bNum = parseInt(b.number) || 0;
        return aNum - bNum;
      });

      const totalReservations = rooms.reduce((sum, room) => sum + room.reservations.length, 0);

      this.roomTypes.push({
        name: roomTypeName,
        rooms,
        isExpanded: true,
        roomCount: rooms.length,
        reservationCount: totalReservations
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
    this.currentDate.setDate(this.currentDate.getDate() - 1);
    this.generateCalendarDates();
  }

  navigateNext(): void {
    this.currentDate.setDate(this.currentDate.getDate() + 1);
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

  getMaintenanceForRoom(roomType: string, roomNumber: string): any[] {
    if (!this.maintenanceBlocks || this.maintenanceBlocks.length === 0) {
      return [];
    }

    return this.maintenanceBlocks.filter(m =>
      String(m.roomId) === String(roomNumber)
    );
  }

  getMaintenancePosition(maintenance: any): { startIndex: number; span: number } | null {
    if (!this.displayDates.length) return null;

    const windowStart = new Date(this.displayDates[0].fullDate);
    const windowEnd = new Date(this.displayDates[this.displayDates.length - 1].fullDate);
    windowStart.setHours(0, 0, 0, 0);
    windowEnd.setHours(0, 0, 0, 0);
    windowEnd.setDate(windowEnd.getDate() + 1);

    let start = new Date(maintenance.startDate);
    let end = new Date(maintenance.endDate);
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
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: any) => {
        if (result && result.refreshCalendar) {
          this.loadReservationsAndMaintenance();
        } else {
          console.log('ℹ️ No changes made, skipping calendar refresh');
        }
      });
  }

  deleteMaintenance(event: Event, maintenance: any): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete Maintenance Block',
        message: `Are you sure you want to delete this maintenance block?\n\nRoom: ${maintenance.roomId}\nReason: ${maintenance.reason || 'N/A'}\nDates: ${new Date(maintenance.startDate).toLocaleDateString()} - ${new Date(maintenance.endDate).toLocaleDateString()}`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reservationService.deleteMaintenanceBlock(maintenance.id, String(maintenance.roomId))
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.maintenanceBlocks = this.maintenanceBlocks.filter(m => m.id !== maintenance.id);
            },
            error: (error) => {
              console.error('Failed to delete maintenance block:', error);
            }
          });
      }
    });
  }

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

  onGlobalMouseUp(event?: MouseEvent): void {
    if (this.isSelecting && this.currentSelection && this.selectedCells.size > 0) {
      this.openReservationActionDialog(event);
    }

    this.isSelecting = false;
    this.selectionStart = null;
  }

  trackByMaintenanceId(index: number, maintenance: any): any {
    return maintenance.id || index;
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

    const hasReservation = room.reservations.some(res => {
      const checkIn = new Date(res.checkInDate).setHours(0, 0, 0, 0);
      const checkOut = new Date(res.checkOutDate).setHours(0, 0, 0, 0);
      return targetTime >= checkIn && targetTime < checkOut;
    });

    const hasMaintenance = this.maintenanceBlocks.some(m => {
      if (String(m.roomId) !== String(roomNumber)) return false;
      const start = new Date(m.startDate).setHours(0, 0, 0, 0);
      const end = new Date(m.endDate).setHours(0, 0, 0, 0);
      return targetTime >= start && targetTime < end;
    });

    return hasReservation || hasMaintenance;
  }

  getCellKey(roomType: string, roomNumber: string, dateIndex: number): string {
    return `${roomType}|${roomNumber}|${dateIndex}`;
  }

  openReservationActionDialog(event?: MouseEvent): void {
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

    const offset = 8;
    const dialogWidth = 240;
    const dialogHeight = 200;
    let position: any = {};

    if (event) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = event.clientY + offset;
      let left = event.clientX + offset;

      if (left + dialogWidth > viewportWidth) {
        left = event.clientX - dialogWidth - offset;
      }

      if (top + dialogHeight > viewportHeight) {
        top = event.clientY - dialogHeight - offset;
      }

      if (left < 0) {
        left = offset;
      }

      if (top < 0) {
        top = offset;
      }

      position = {
        top: `${top}px`,
        left: `${left}px`
      };
    }

    const dialogRef = this.dialog.open(ReservationActionDialog, {
      width: 'auto',
      maxWidth: '240px',
      data: dialogData,
      autoFocus: false,
      panelClass: ['context-menu-popup'],
      position: position,
      hasBackdrop: true,
      backdropClass: 'bg-black/10'
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
    const dialogRef = this.dialog.open(MaintenanceBlock, {
      width: '700px',
      data: {
        roomId: data.roomNumber,
        roomNumber: data.roomNumber,
        startDate: data.startDate,
        endDate: data.endDate
      },
      autoFocus: false,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.loadReservationsAndMaintenance();
      }
    });
  }

  getBookingSourceLogo(source: string | null | undefined): SafeHtml {
    if (!source) source = 'Direct';

    const logos: Record<string, string> = {
      'Booking.com': `
        <svg viewBox="0 0 24 24" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path fill="#003580" d="M3.5 0A3.5 3.5 0 0 0 0 3.5v17A3.5 3.5 0 0 0 3.5 24h17a3.5 3.5 0 0 0 3.5-3.5v-17A3.5 3.5 0 0 0 20.5 0h-17zm5.75 5.5h1.5c.414 0 .75.336.75.75v11.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V6.25c0-.414.336-.75.75-.75zm4 0h1.5c.414 0 .75.336.75.75v11.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V6.25c0-.414.336-.75.75-.75z"/>
        </svg>
      `,
      'Airbnb': `
        <svg viewBox="0 0 24 24" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF5A5F" d="M12 1.2C9.5 1.2 7.5 3.2 7.5 5.7c0 3.5 4.5 8.3 4.5 8.3s4.5-4.8 4.5-8.3c0-2.5-2-4.5-4.5-4.5zm0 6.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM5.6 14.5c-.8 1.4-.9 3-.3 4.4.6 1.4 1.8 2.5 3.3 3 1.5.5 3.1.3 4.4-.5l-1.8-3.1c-.6.4-1.4.5-2.1.2-.7-.2-1.3-.8-1.6-1.5-.3-.7-.2-1.5.2-2.1l-2-3.4zm12.8 0l-2 3.4c.4.6.5 1.4.2 2.1-.3.7-.9 1.3-1.6 1.5-.7.2-1.5.2-2.1-.2l-1.8 3.1c1.3.8 2.9 1 4.4.5 1.5-.5 2.7-1.6 3.3-3 .6-1.4.5-3-.3-4.4z"/>
        </svg>
      `,
      'Expedia': `
        <svg viewBox="0 0 24 24" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFCB05" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19 8v8l-7 3.5L5 16V8l7-3.5z"/>
          <path fill="#003087" d="M12 6.5L7 9v6l5 2.5 5-2.5V9l-5-2.5z"/>
        </svg>
      `,
      'Agoda': `
        <svg viewBox="0 0 24 24" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#D71345" width="24" height="24" rx="4"/>
          <path fill="white" d="M7 8h2l3 8h-2l-.5-1.5H6.5L6 16H4l3-8zm1 2l-1 3h2l-1-3zm6-2h2l2 6 2-6h2l-3 8h-2l-3-8z"/>
        </svg>
      `,
      'Direct': `
        <svg viewBox="0 0 24 24" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path fill="#6B7280" d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zM10 10c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
        </svg>
      `
    };

    return this.sanitizer.bypassSecurityTrustHtml(logos[source] || logos['Direct']);
  }
}
