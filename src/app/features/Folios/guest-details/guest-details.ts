import { Component, Input, OnInit } from '@angular/core';
import { ReservationRoomDetails} from '../../../core/models/folio.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-guest-details',
  imports: [
    CommonModule
  ],
  templateUrl: './guest-details.html',
  styleUrl: './guest-details.scss'
})
export class GuestDetails {
  @Input() reservationDetails: ReservationRoomDetails | null = null;
  @Input() reservationId: number | undefined;

  constructor() {}

  ngOnInit(): void {
    console.log('Guest Details loaded for:', this.reservationId);
  }
}
