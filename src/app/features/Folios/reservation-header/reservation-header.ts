import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRoomDetails } from '../../../core/models/folio.model';

@Component({
  selector: 'app-reservation-header',
  imports: [
    CommonModule
  ],
  templateUrl: './reservation-header.html',
  styleUrl: './reservation-header.scss'
})

export class ReservationHeader{
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;
  @Input() loading: boolean = false;

  @Output() backClick = new EventEmitter<void>();
  @Output() editDeparture = new EventEmitter<void>();

  onGoBack(): void {
    this.backClick.emit();
  }

  onEditDeparture(): void {
    this.editDeparture.emit();
  }

  getStatusDisplay(): string {
    if (!this.reservationDetails) return '';

    switch (this.reservationDetails.checkInCheckOutStatus) {
      case 'CHECK_IN':
        return 'Arrived';
      case 'CHECK_OUT':
        return 'Checked Out';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      default:
        return this.reservationDetails.checkInCheckOutStatus;
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
