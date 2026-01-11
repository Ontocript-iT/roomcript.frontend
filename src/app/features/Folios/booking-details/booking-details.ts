import { Component, Input, OnInit } from '@angular/core';
import { ReservationRoomDetails} from '../../../core/models/folio.model';

@Component({
  selector: 'app-booking-details',
  imports: [],
  templateUrl: './booking-details.html',
  styleUrl: './booking-details.scss'
})
export class BookingDetails {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;

  constructor() {}

  ngOnInit(): void {
    console.log('Booking Details loaded for:', this.reservationId);
  }
}
