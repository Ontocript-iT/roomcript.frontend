import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRoomDetails, RoomDetail } from '../../../core/models/folio.model';

@Component({
  selector: 'app-reservation-header',
  imports: [
    CommonModule
  ],
  templateUrl: './reservation-header.html',
  styleUrl: './reservation-header.scss'
})

export class ReservationHeader {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;
  @Input() loading: boolean = false;

  @Output() backClick = new EventEmitter<void>();
  @Output() editDeparture = new EventEmitter<void>();
  @Output() roomChange = new EventEmitter<RoomDetail>();

  currentRoomIndex: number = 0;

  onGoBack(): void {
    this.backClick.emit();
  }

  onEditDeparture(): void {
    this.editDeparture.emit();
  }

  getCurrentRoom(): RoomDetail | null {
    if (!this.reservationDetails?.roomDetails || this.reservationDetails.roomDetails.length === 0) {
      return null;
    }
    return this.reservationDetails.roomDetails[this.currentRoomIndex];
  }

  previousRoom(): void {
    if (this.currentRoomIndex > 0) {
      this.currentRoomIndex--;
      this.roomChange.emit(this.getCurrentRoom()!);
    }
  }

  nextRoom(): void {
    if (this.reservationDetails?.roomDetails && this.currentRoomIndex < this.reservationDetails.roomDetails.length - 1) {
      this.currentRoomIndex++;
      this.roomChange.emit(this.getCurrentRoom()!);
    }
  }

  getStatusDisplay(): string {
    if (!this.reservationDetails) return '';

    switch (this.reservationDetails.status) {
      case 'CHECKED_IN':
        return 'Arrived';
      case 'CHECKED_OUT':
        return 'Checked Out';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      default:
        return this.reservationDetails.status;
    }
  }

  formatDateOnly(date: string): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  calculateNights(): number {
    if (!this.reservationDetails?.checkInDate || !this.reservationDetails?.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(this.reservationDetails.checkInDate);
    const checkOut = new Date(this.reservationDetails.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
