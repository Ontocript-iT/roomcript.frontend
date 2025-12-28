import {Component, ElementRef, Inject, OnInit, OnDestroy, QueryList, ViewChildren} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { Reservation } from '../../../core/models/reservation.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { ReservationService } from '../../../core/services/reservation.service';
import {map, ObservableInput, Subject} from 'rxjs';
import {MatInputModule} from '@angular/material/input';
import {Router, RouterLink} from '@angular/router';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {MatDivider} from '@angular/material/divider';
import { AssignRoomComponent} from '../assign-room/assign-room';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MoveRoomComponent} from '../move-room/move-room';
import {takeUntil} from 'rxjs/operators';

export interface ViewReservationDialogData {
  reservation: Reservation;
}

interface AvailableRoomOption {
  roomId: number;
  roomNumber: string;
  roomType: string;
}

@Component({
  selector: 'app-view-reservation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    MatMenuTrigger,
    MatMenuModule,
    MatDivider,
    AssignRoomComponent,
    MatTooltipModule,
    MoveRoomComponent,
  ],
  templateUrl: './view-reservation.html',
  styleUrl: './view-reservation.scss'
})
export class ViewReservation implements OnInit, OnDestroy {
  editingRowIndex: number | null = null;
  editingCell: { rowIndex: number | null, field: string | null } = { rowIndex: null, field: null };
  availableRoomsByType: { [roomType: string]: AvailableRoomOption[] } = {};
  loadingRooms = false;
  originalRoomDetails: any[] = [];
  rowOriginalData: { [key: number]: any } = {};
  propertyCode = localStorage.getItem("propertyCode")||'';
  roomTempIds: number[] = [];
  originalCheckInDate: Date | null = null;
  originalCheckOutDate: Date | null = null;
  errorMessage: string = '';
  showError: boolean = false;
  isSuccessMessage: boolean = false;
  roomDetails: [] | undefined;
  showAssignRoomForm = false;
  showMoveRoomForm = false;
  selectedRoomForMove: any = null;
  selectedRoomIndex: number = -1;
  availableRooms: AvailableRoomOption[] = [];
  private destroy$ = new Subject<void>();

  availableRoomTypes = [
    { value: 'Standard', label: 'Standard', availableCount: 0},
    { value: 'Deluxe', label: 'Deluxe', availableCount: 0},
    { value: 'Superior-Deluxe', label: 'Superior Deluxe', availableCount: 0},
    { value: 'Suite', label: 'Suite', availableCount: 0},
    { value: 'Double', label: 'Double', availableCount: 0},
    { value: 'Twin', label: 'Twin', availableCount: 0},
    { value: 'Quadruple', label: 'Quadruple', availableCount: 0},
  ];

  @ViewChildren('rateInput') rateInputs!: QueryList<ElementRef>;
  @ViewChildren('adultsInput') adultsInputs!: QueryList<ElementRef>;
  @ViewChildren('childrenInput') childrenInputs!: QueryList<ElementRef>;
  @ViewChildren('roomTypeSelect') roomTypeSelects!: QueryList<any>;

  constructor(
    public dialogRef: MatDialogRef<ViewReservation>,
    @Inject(MAT_DIALOG_DATA) public data: ViewReservationDialogData,
    private reservationService: ReservationService,
    private roomService: RoomService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.originalRoomDetails = JSON.parse(JSON.stringify(this.data.reservation.roomDetails));
    this.originalCheckInDate = new Date(this.data.reservation.checkInDate);
    this.originalCheckOutDate = new Date(this.data.reservation.checkOutDate);

    this.data.reservation.roomDetails.forEach((room, index) => {
      this.roomTempIds[index] = room.roomId || 0;
    });

    this.loadAvailableRoomCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  moveRoom(room: any, index: number): void {
    this.showAssignRoomForm = false;
    this.selectedRoomForMove = room;
    this.selectedRoomIndex = index;
    this.showMoveRoomForm = true;
  }

  onRoomMoved(response: any): void {
    this.loadReservationData();
  }

  // New method to reload reservation data from server
  loadReservationData(): void {
    if (!this.data.reservation.id) return;

    this.reservationService.getReservationById(this.data.reservation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedReservation: any) => {

          this.data.reservation.roomDetails = updatedReservation.roomDetails || [];
          this.originalRoomDetails = JSON.parse(JSON.stringify(this.data.reservation.roomDetails));

          // Reset editing state
          this.editingRowIndex = null;
          this.editingCell = { rowIndex: null, field: null };
          this.rowOriginalData = {};

          // Re-initialize room temp IDs
          this.roomTempIds = [];
          this.data.reservation.roomDetails.forEach((room, index) => {
            this.roomTempIds[index] = room.roomId || 0;
          });

          // Hide the move room form
          this.showMoveRoomForm = false;
          this.selectedRoomForMove = null;
          this.selectedRoomIndex = -1;

          // Reload available room counts
          this.loadAvailableRoomCounts();

          // Show success message
          this.showErrorMessage('Room moved successfully!', true);

          // **IMPORTANT: Close dialog with refresh flag to update calendar**
          // This tells the calendar view to refresh
          this.dialogRef.close({ refreshCalendar: true });
        },
        error: (error: any) => {
          this.showErrorMessage('Room moved but failed to refresh view. Please close and reopen.', false);

          this.showMoveRoomForm = false;
          this.selectedRoomForMove = null;
          this.selectedRoomIndex = -1;
        }
      });
  }

  onMoveRoomCancelled(): void {
    this.showMoveRoomForm = false;
    this.selectedRoomForMove = null;
    this.selectedRoomIndex = -1;
  }

  loadAvailableRoomCounts(): void {
    if (!this.propertyCode) {
      return;
    }

    if (!this.originalCheckInDate || !this.originalCheckOutDate) {
      return;
    }

    const formattedCheckIn = this.formatDate(this.originalCheckInDate);
    const formattedCheckOut = this.formatDate(this.originalCheckOutDate);

    this.roomService.getAvailableRoomsCount(
      this.propertyCode,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        this.availableRoomTypes = this.availableRoomTypes.map(roomType => {
          const apiRoom = rooms.find(r => r.roomType === roomType.value);

          return {
            value: roomType.value,
            label: roomType.label,
            availableCount: apiRoom?.availableCount || 0
          };
        });
      },
      error: () => {
        this.availableRoomTypes = this.availableRoomTypes.map(roomType => ({
          value: roomType.value,
          label: roomType.label,
          availableCount: 0
        }));
      }
    });
  }

  isRowEditing(rowIndex: number): boolean {
    return this.editingRowIndex === rowIndex;
  }

  isEditingCell(rowIndex: number, field: string): boolean {
    return this.editingCell.rowIndex === rowIndex && this.editingCell.field === field;
  }

  enableRowEdit(rowIndex: number): void {
    this.editingRowIndex = rowIndex;
    this.rowOriginalData[rowIndex] = JSON.parse(JSON.stringify(this.data.reservation.roomDetails[rowIndex]));

    const room = this.data.reservation.roomDetails[rowIndex];
    this.fetchAvailableRoomsByType(room.roomType, rowIndex, room);
  }

  fetchAvailableRoomsByType(roomType: string, index: number, currentRoom?: any): void {
    if (!this.propertyCode) {
      return;
    }
    if (!this.originalCheckInDate || !this.originalCheckOutDate) {
      return;
    }

    const formattedCheckIn = this.formatDate(this.originalCheckInDate);
    const formattedCheckOut = this.formatDate(this.originalCheckOutDate);

    this.loadingRooms = true;

    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).pipe(
      map((rooms: any[]) => rooms.map((r: any) => ({
        roomId: r.id || r.roomId,
        roomNumber: r.roomNumber,
        roomType: r.roomType
      })))
    ).subscribe({
      next: (rooms) => {
        let list = rooms || [];

        if (currentRoom && currentRoom.roomId) {
          const exists = list.some(r => Number(r.roomId) === Number(currentRoom.roomId));
          if (!exists) {
            list = [
              {
                roomId: currentRoom.roomId,
                roomNumber: currentRoom.roomNumber,
                roomType: currentRoom.roomType
              },
              ...list
            ];
          }
        }

        this.availableRoomsByType[roomType] = list;

        if (currentRoom && currentRoom.roomId) {
          this.roomTempIds[index] = currentRoom.roomId;
        }

        this.loadingRooms = false;
      },
      error: () => {
        this.availableRoomsByType[roomType] = [];
        this.loadingRooms = false;
      }
    });
  }

  hasRowChanges(rowIndex: number): boolean {
    if (!this.rowOriginalData[rowIndex]) return false;

    const current = this.data.reservation.roomDetails[rowIndex];
    const original = this.rowOriginalData[rowIndex];

    return (
      current.roomType !== original.roomType ||
      this.roomTempIds[rowIndex] !== original.roomId ||
      current.roomRate !== original.roomRate ||
      current.numberOfAdults !== original.numberOfAdults ||
      current.numberOfChildren !== original.numberOfChildren
    );
  }

  saveRowChanges(rowIndex: number): void {
    this.clearError(); // Clear previous errors
    this.editingCell = { rowIndex: null, field: null };

    const room = this.data.reservation.roomDetails[rowIndex];
    const selectedRoomId = this.roomTempIds[rowIndex] || room.roomId;

    if (!selectedRoomId || selectedRoomId === 0) {
      this.showErrorMessage('Please select a room number before saving.', false);
      return;
    }

    const availableRooms = this.getAvailableRoomsForIndex(rowIndex);
    const selectedRoom = availableRooms.find(r => r.roomId === selectedRoomId);

    if (!selectedRoom) {
      this.showErrorMessage('Selected room is no longer available.', false);
      return;
    }

    const confirmationNumber = room.confirmationNumber;

    if (!confirmationNumber) {
      this.assignNewRoom(rowIndex, selectedRoom);
    } else {
      this.moveExistingRoomAssignment(rowIndex, selectedRoom, confirmationNumber);
    }
  }

  moveExistingRoomAssignment(rowIndex: number, selectedRoom: any, confirmationNumber: string): void {
    const room = this.data.reservation.roomDetails[rowIndex];

    const moveRoomData = {
      reservationId: this.data.reservation.id,
      roomConfirmationNumber: confirmationNumber,
      roomId: selectedRoom.roomId,
      roomType: selectedRoom.roomType,
      numberOfAdults: room.numberOfAdults || 0,
      numberOfChildren: room.numberOfChildren || 0
    };

    this.reservationService.moveExistingRoom(moveRoomData).subscribe({
      next: () => {
        room.roomId = selectedRoom.roomId;
        room.roomNumber = selectedRoom.roomNumber;
        room.roomType = selectedRoom.roomType;

        this.originalRoomDetails[rowIndex] = JSON.parse(JSON.stringify(room));
        this.editingRowIndex = null;
        delete this.rowOriginalData[rowIndex];

        this.loadAvailableRoomCounts();
        this.showErrorMessage('Room updated successfully!', true);
      },
      error: (error) => {
        let errorMessage = 'Failed to save room assignment';
        if (error?.message) errorMessage = error.message;
        else if (error?.error?.error) errorMessage = error.error.error;

        this.showErrorMessage(errorMessage, false);
        this.cancelRowEdit(rowIndex);
      }
    });
  }

  assignNewRoom(rowIndex: number, selectedRoom: any): void {
    const room = this.data.reservation.roomDetails[rowIndex];

    const assignmentData = {
      reservationId: this.data.reservation.id,
      roomType: selectedRoom.roomType,
      roomIds: [selectedRoom.roomId],
      numberOfAdults: room.numberOfAdults || 0,
      numberOfChildren: room.numberOfChildren || 0
    };

    this.reservationService.assignRooms(assignmentData).subscribe({
      next: (response) => {

        room.roomId = selectedRoom.roomId;
        room.roomNumber = selectedRoom.roomNumber;
        room.roomType = selectedRoom.roomType;

        if (response.roomDetails && response.roomDetails.length > 0) {
          const assignedRoom = response.roomDetails.find((r: any) => r.roomId === selectedRoom.roomId);
          if (assignedRoom && assignedRoom.confirmationNumber) {
            room.confirmationNumber = assignedRoom.confirmationNumber; // ✅ Only this line
          }
        }

        this.originalRoomDetails[rowIndex] = JSON.parse(JSON.stringify(room));
        this.editingRowIndex = null;
        delete this.rowOriginalData[rowIndex];

        this.loadAvailableRoomCounts();
        this.showErrorMessage('Room assigned successfully!', true);
      },
      error: (error) => {
        let errorMessage = 'Failed to assign room';
        if (error?.message) errorMessage = error.message;
        else if (error?.error?.error) errorMessage = error.error.error;

        this.showErrorMessage(errorMessage, false);
        this.cancelRowEdit(rowIndex);
      }
    });
  }

  cancelRowEdit(rowIndex: number): void {
    if (this.rowOriginalData[rowIndex]) {
      this.data.reservation.roomDetails[rowIndex] = JSON.parse(JSON.stringify(this.rowOriginalData[rowIndex]));
      this.roomTempIds[rowIndex] = this.rowOriginalData[rowIndex].roomId;
    }
    this.editingRowIndex = null;
    this.editingCell = { rowIndex: null, field: null };
    delete this.rowOriginalData[rowIndex];
  }

  focusInputField(field: string): void {
    switch(field) {
      case 'rate':
        const rateInput = this.rateInputs?.first;
        if (rateInput) rateInput.nativeElement.focus();
        break;
      case 'adults':
        const adultsInput = this.adultsInputs?.first;
        if (adultsInput) adultsInput.nativeElement.focus();
        break;
      case 'children':
        const childrenInput = this.childrenInputs?.first;
        if (childrenInput) childrenInput.nativeElement.focus();
        break;
      case 'roomType':
        const roomTypeSelect = this.roomTypeSelects?.first;
        if (roomTypeSelect) roomTypeSelect.open();
        break;
    }
  }

  closeEditCell(): void {
    setTimeout(() => {
      this.editingCell = { rowIndex: null, field: null };
    }, 150);
  }

  cancelEdit(index: number): void {
    if (this.rowOriginalData[index]) {
      const original = this.rowOriginalData[index];
      const current = this.data.reservation.roomDetails[index];

      if (this.editingCell.field === 'roomType') {
        current.roomType = original.roomType;
      } else if (this.editingCell.field === 'rate') {
        current.roomRate = original.roomRate;
      } else if (this.editingCell.field === 'adults') {
        current.numberOfAdults = original.numberOfAdults;
      } else if (this.editingCell.field === 'children') {
        current.numberOfChildren = original.numberOfChildren;
      }
    }

    this.closeEditCell();
  }

  onDropdownOpenChange(isOpen: boolean, index: number, field: string): void {
    if (!isOpen) {
      setTimeout(() => {
        this.editingCell = { rowIndex: null, field: null };
      }, 200);
    }
  }

  onRoomSelect(index: number): void {
    const selectedRoomId = this.roomTempIds[index];
    const room = this.data.reservation.roomDetails[index];
    const availableRooms = this.getAvailableRoomsForIndex(index);
    const selectedRoom = availableRooms.find(r => r.roomId === selectedRoomId);

    if (selectedRoom) {
      room.roomId = selectedRoom.roomId;
      room.roomNumber = selectedRoom.roomNumber;
      room.roomType = selectedRoom.roomType;

      this.editingCell = { rowIndex: null, field: null };
    }
  }

  onRoomTypeSelect(index: number): void {
    const room = this.data.reservation.roomDetails[index];
    const newRoomType = room.roomType;

    // Clear the current room assignment since type changed
    this.roomTempIds[index] = 0;
    room.roomId = 0;
    room.roomNumber = '';

    this.fetchAvailableRoomsByType(newRoomType, index);
    this.editingCell = { rowIndex: null, field: null };
  }

  getAvailableRoomsForIndex(index: number): AvailableRoomOption[] {
    const room = this.data.reservation.roomDetails[index];
    if (!room || !room.roomType) return [];
    return this.availableRoomsByType[room.roomType] || [];
  }

  shouldShowActionButtons(): boolean {
    const res = this.data.reservation;
    if (!res) return false;

    const isCancelled = res.status?.toUpperCase() === 'CANCELLED';
    const isCompleted = res.checkInStatus && res.checkOutStatus;

    return !(isCancelled || isCompleted);
  }

  assignRoom(): void {
    this.showMoveRoomForm = false;
    this.selectedRoomForMove = null;
    this.selectedRoomIndex = -1;
    this.showAssignRoomForm = true;
  }

  onRoomAssigned(response: any): void {

    if (response.roomDetails && response.roomDetails.length > 0) {
      const newRoom = response.roomDetails[response.roomDetails.length - 1];
      this.data.reservation.roomDetails.push(newRoom);
    }

    this.showAssignRoomForm = false;
    this.loadAvailableRoomCounts();
    this.showErrorMessage('Room assigned successfully!', true);
  }

  onAssignRoomCancelled(): void {
    this.showAssignRoomForm = false;
  }

  editReservation(): void {
    this.dialogRef.close();

    this.router.navigate(['/reservations/folio-operations'], {
      queryParams: {
        id: this.data.reservation.id,
        confirmationNumber: this.data.reservation.confirmationNumber,
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getStatusBgColor(): string {
    switch (this.data.reservation.status) {
      case 'CONFIRMED':
        return '#bbf7d0';
      case 'PENDING':
        return '#fef08a';
      case 'CANCELLED':
        return '#fecaca';
      default:
        return '#fecaca';
    }
  }

  getStatusTextColor(): string {
    switch (this.data.reservation.status) {
      case 'CONFIRMED':
        return '#166534';
      case 'PENDING':
        return '#854d0e';
      case 'CANCELLED':
        return '#991b1b';
      default:
        return '#991b1b';
    }
  }

  printReservation(): void {
    const printContent = this.generatePrintContent();
    this.printReservationDetails(printContent);
  }

  private generatePrintContent(): string {
    const reservation = this.data.reservation;

    const roomsHtml = reservation.roomDetails && reservation.roomDetails.length > 0
      ? `
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">#</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Type</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Room Number</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Rate</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Adults</th>
          <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Children</th>
        </tr>
      </thead>
      <tbody>
        ${reservation.roomDetails.map((room, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">${index + 1}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${room.roomType}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111827;">${room.roomNumber}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">$${room.roomRate?.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfAdults ?? 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">${room.numberOfChildren ?? 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`
          : '<p style="color: #6b7280; font-size: 13px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #d1d5db;">No room details available</p>';

        const statusStyle = reservation.status === 'CONFIRMED'
          ? 'background-color: #bbf7d0; color: #166534;'
          : reservation.status === 'PENDING'
            ? 'background-color: #fef08a; color: #854d0e;'
            : 'background-color: #fecaca; color: #991b1b;';

        return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="text-align: center; margin-bottom: 20px; color: #111827;">Reservation Details</h2>
      <div style="font-size: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; margin-bottom: 20px;">
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 80px;">Name:</span>
            <span>${reservation.name}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 80px;">Email:</span>
            <span>${reservation.email}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 80px;">Phone:</span>
            <span>${reservation.phone || 'N/A'}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 80px;">Address:</span>
            <span>${reservation.address || 'N/A'}</span>
          </div>
        </div>

        <hr style="margin: 1rem 0; border-color: #d1d5db;" />

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; margin-bottom: 20px;">
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 100px;">Check-In:</span>
            <span>${new Date(reservation.checkInDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 100px;">Check-Out:</span>
            <span>${new Date(reservation.checkOutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 100px;">Total Guests:</span>
            <span>${reservation.numberOfGuests || 'N/A'}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <span style="font-weight: 600; min-width: 100px;">Room Count:</span>
            <span>${reservation.roomCount || reservation.roomDetails?.length || 'N/A'}</span>
          </div>
        </div>

        ${roomsHtml}

        <hr style="margin: 1rem 0; border-color: #d1d5db;" />

        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="font-weight: 600; min-width: 120px;">Total Amount:</span>
          <span>$${reservation.totalAmount?.toFixed(2)}</span>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <span style="font-weight: 600; min-width: 120px;">Status:</span>
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 12px; font-weight: 600; ${statusStyle}">
            ${reservation.status}
          </span>
        </div>
      </div>
    </div>`;
  }

  private printReservationDetails(content: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="">
      <head>
        <title>Reservation Details</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
    `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  showErrorMessage(message: string, isSuccess: boolean = false): void {
    this.errorMessage = message;
    this.showError = true;
    this.isSuccessMessage = isSuccess;

    setTimeout(() => {
      this.hideErrorMessage();
    }, 5000);
  }

  hideErrorMessage(): void {
    this.showError = false;
    this.errorMessage = '';
    this.isSuccessMessage = false;
  }

  clearError(): void {
    this.hideErrorMessage();
  }
}
