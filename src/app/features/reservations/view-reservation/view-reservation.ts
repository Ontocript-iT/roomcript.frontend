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
import { Subject } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { AssignRoomComponent } from '../assign-room/assign-room';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MoveRoomComponent } from '../move-room/move-room';
import {takeUntil} from 'rxjs/operators';

export interface ViewReservationDialogData {
  reservation: Reservation;
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
  originalRoomDetails: any[] = [];
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
  private destroy$ = new Subject<void>();
  private hasChanges = false;

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

    this.dialogRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🖱️ Backdrop clicked, closing with changes flag:', this.hasChanges);
        this.dialogRef.close({ refreshCalendar: this.hasChanges });
      });
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
    console.log('✅ Room moved successfully:', response);

    // Update the room details directly from the response
    if (this.selectedRoomIndex >= 0 && response && response.roomDetails) {
      const updatedRoom = response.roomDetails.find((r: any) =>
        r.confirmationNumber === this.selectedRoomForMove.confirmationNumber
      );

      if (updatedRoom) {
        // Update the room in the table
        this.data.reservation.roomDetails[this.selectedRoomIndex] = {
          ...this.data.reservation.roomDetails[this.selectedRoomIndex],
          roomId: updatedRoom.roomId,
          roomNumber: updatedRoom.roomNumber,
          roomType: updatedRoom.roomType,
          numberOfAdults: updatedRoom.numberOfAdults,
          numberOfChildren: updatedRoom.numberOfChildren
        };

        // Update original room details as well
        this.originalRoomDetails[this.selectedRoomIndex] = JSON.parse(
          JSON.stringify(this.data.reservation.roomDetails[this.selectedRoomIndex])
        );

        // Update room temp IDs
        this.roomTempIds[this.selectedRoomIndex] = updatedRoom.roomId;
      }
    }

    // Hide the move room form
    this.showMoveRoomForm = false;
    this.selectedRoomForMove = null;
    this.selectedRoomIndex = -1;

    // Reload available room counts
    this.loadAvailableRoomCounts();

    // Show success message
    this.showErrorMessage('Room moved successfully!', true);

    // Mark that changes were made
    this.hasChanges = true;
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
    console.log('Room assigned:', response);

    if (response.roomDetails && response.roomDetails.length > 0) {
      const newRoom = response.roomDetails[response.roomDetails.length - 1];
      this.data.reservation.roomDetails.push(newRoom);
    }

    this.showAssignRoomForm = false;
    this.loadAvailableRoomCounts();
    this.showErrorMessage('Room assigned successfully!', true);

    // Mark that changes were made
    this.hasChanges = true;
  }

  removeRoom(room: any, index: number): void {
    const reservationId = this.data.reservation.id;
    const roomConfirmationNumber = room.confirmationNumber;

    this.reservationService.deleteRoomFromReservation(reservationId, roomConfirmationNumber)
      .subscribe({
        next: () => {
          this.data.reservation.roomDetails.splice(index, 1);
          this.loadAvailableRoomCounts();
          this.showErrorMessage('Room removed successfully!', true);
          this.hasChanges = true;
        },
        error: (error) => {
          this.showErrorMessage('Failed to remove room: ' + (error.message || 'Unknown error'), false);
        }
      });
  }

  onAssignRoomCancelled(): void {
    this.showAssignRoomForm = false;
  }

  editReservation(): void {
    console.log('Navigating to reservation updates with ID:', this.data.reservation.id);

    this.dialogRef.close();

    this.router.navigate(['/reservations/reservation-updates'], {
      queryParams: {
        id: this.data.reservation.id
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({ refreshCalendar: this.hasChanges });
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
