import { Component, Input, OnInit } from '@angular/core';
import { ReservationRoomDetails} from '../../../core/models/folio.model';

@Component({
  selector: 'app-room-charges',
  imports: [],
  templateUrl: './room-charges.html',
  styleUrl: './room-charges.scss'
})
export class RoomCharges {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;

  constructor() {}

  ngOnInit(): void {
    console.log('Room Charges loaded for:', this.reservationId);
  }
}
