import {Component, ElementRef, Inject, OnInit, QueryList, ViewChildren} from '@angular/core';
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
import { AvailableRooms} from '../../../core/models/room.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { forkJoin, map, Observable } from 'rxjs';
import {MatInputModule} from '@angular/material/input';

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
    MatInputModule
  ],
  templateUrl: './view-reservation.html',
  styleUrl: './view-reservation.scss'
})
export class ViewReservation implements OnInit {
  editingRowIndex: number | null = null;  // Track which row is being edited
  editingCell: { rowIndex: number | null, field: string | null } = { rowIndex: null, field: null };
  availableRooms: AvailableRoomOption[] = [];
  availableRoomsByType: { [roomType: string]: AvailableRoomOption[] } = {};
  loadingRooms = false;
  originalRoomDetails: any[] = [];
  rowOriginalData: { [key: number]: any } = {};  // Store original data per row
  propertyCode = localStorage.getItem("propertyCode")||'';
  roomTempIds: number[] = [];

  @ViewChildren('rateInput') rateInputs!: QueryList<ElementRef>;
  @ViewChildren('adultsInput') adultsInputs!: QueryList<ElementRef>;
  @ViewChildren('childrenInput') childrenInputs!: QueryList<ElementRef>;

  constructor(
    public dialogRef: MatDialogRef<ViewReservation>,
    @Inject(MAT_DIALOG_DATA) public data: ViewReservationDialogData,
    private reservationService: ReservationService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    this.originalRoomDetails = JSON.parse(JSON.stringify(this.data.reservation.roomDetails));
    this.data.reservation.roomDetails.forEach((room, index) => {
      this.roomTempIds[index] = room.roomId || 0;
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
    // Store original data for this row
    this.rowOriginalData[rowIndex] = JSON.parse(JSON.stringify(this.data.reservation.roomDetails[rowIndex]));

    this.loadAvailableRoomsForRow(rowIndex);

    console.log(`Edit mode enabled for row ${rowIndex}`);
  }

  loadAvailableRoomsForRow(rowIndex: number): void {
    this.loadingRooms = true;

    const room = this.data.reservation.roomDetails[rowIndex];
    const checkInDate = this.data.reservation.checkInDate;
    const checkOutDate = this.data.reservation.checkOutDate;

    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      room.roomType,
      checkInDate,
      checkOutDate
    ).pipe(
      map((rooms: any[]) => rooms.map((r: any) => ({
        roomId: r.id || r.roomId,
        roomNumber: r.roomNumber,
        roomType: r.roomType
      })))
    ).subscribe({
      next: (rooms) => {
        this.availableRoomsByType[room.roomType] = rooms;
        console.log(`Available rooms loaded for ${room.roomType}:`, rooms);
        this.loadingRooms = false;
      },
      error: (error) => {
        console.error('Error loading available rooms:', error);
        this.loadingRooms = false;
      }
    });
  }

  hasRowChanges(rowIndex: number): boolean {
    if (!this.rowOriginalData[rowIndex]) return false;

    const current = this.data.reservation.roomDetails[rowIndex];
    const original = this.rowOriginalData[rowIndex];

    return (
      this.roomTempIds[rowIndex] !== original.roomId ||
      current.roomRate !== original.roomRate ||
      current.numberOfAdults !== original.numberOfAdults ||
      current.numberOfChildren !== original.numberOfChildren
    );
  }

  saveRowChanges(rowIndex: number): void {
    this.editingCell = { rowIndex: null, field: null };

    const room = this.data.reservation.roomDetails[rowIndex];

    const assignmentData = {
      reservationId: this.data.reservation.id,
      roomType: room.roomType,
      roomIds: [this.roomTempIds[rowIndex] || room.roomId],
      numberOfAdults: room.numberOfAdults || 0,
      numberOfChildren: room.numberOfChildren || 0
    };

    console.log(`Saving row ${rowIndex}:`, assignmentData);

    this.reservationService.assignOrMoveRooms(assignmentData).subscribe({
      next: (response) => {
        console.log('Room updated successfully:', response);

        // Update only this row's original data
        this.originalRoomDetails[rowIndex] = JSON.parse(JSON.stringify(room));
        this.editingRowIndex = null;
        delete this.rowOriginalData[rowIndex];
      },
      error: (error) => {
        console.error('Error saving row:', error);
        this.cancelRowEdit(rowIndex);
      }
    });
  }

  // Cancel edit for a specific row
  cancelRowEdit(rowIndex: number): void {
    if (this.rowOriginalData[rowIndex]) {
      // Restore original data
      this.data.reservation.roomDetails[rowIndex] = JSON.parse(JSON.stringify(this.rowOriginalData[rowIndex]));
      this.roomTempIds[rowIndex] = this.rowOriginalData[rowIndex].roomId;
    }
    this.editingRowIndex = null;
    this.editingCell = { rowIndex: null, field: null };
    delete this.rowOriginalData[rowIndex];
  }

  // Handle cell double-click
  onRoomCellDoubleClick(rowIndex: number, field: string): void {
    if (!this.isRowEditing(rowIndex)) {
      return;
    }

    if (this.isEditingCell(rowIndex, field)) {
      return;
    }

    this.editingCell = { rowIndex, field };

    setTimeout(() => {
      this.focusInputField(field);
    }, 100);

    console.log(`Editing ${field} at row ${rowIndex}`);
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

      if (this.editingCell.field === 'rate') {
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
    const availableRooms = this.getAvailableRoomsForIndex(index);
    const selectedRoom = availableRooms.find(room => room.roomId === selectedRoomId);

    if (selectedRoom) {
      const roomDetails = this.data.reservation.roomDetails[index];
      roomDetails.roomId = selectedRoom.roomId;
      roomDetails.roomNumber = selectedRoom.roomNumber;
      roomDetails.roomType = selectedRoom.roomType;

      console.log(`Room ${index + 1} selected:`, selectedRoom);
      this.editingCell = { rowIndex: null, field: null };
    }
  }

  getAvailableRoomsForIndex(index: number): AvailableRoomOption[] {
    const room = this.data.reservation.roomDetails[index];
    if (!room || !room.roomType) return [];
    return this.availableRoomsByType[room.roomType] || [];
  }

  autoAllocateRooms(): void {
    console.log('Auto allocate rooms clicked');
  }

  shouldShowActionButtons(): boolean {
    const res = this.data.reservation;
    if (!res) return false;

    const isCancelled = res.status?.toUpperCase() === 'CANCELLED';
    const isCompleted = res.checkInStatus && res.checkOutStatus;

    return !(isCancelled || isCompleted);
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
}
