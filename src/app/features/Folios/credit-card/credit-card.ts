import { Component, Input, OnInit } from '@angular/core';
import { ReservationRoomDetails} from '../../../core/models/folio.model';

@Component({
  selector: 'app-credit-card',
  imports: [],
  templateUrl: './credit-card.html',
  styleUrl: './credit-card.scss'
})
export class CreditCard {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;

  constructor() {}

  ngOnInit(): void {
    console.log('Credit Card loaded for:', this.reservationId);
  }
}
