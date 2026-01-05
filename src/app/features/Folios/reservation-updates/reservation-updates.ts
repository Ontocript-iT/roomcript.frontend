import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FolioService } from '../../../core/services/folio.service';
import { ReservationRoomDetails, FolioDetails } from '../../../core/models/folio.model';

import { ReservationHeader} from '../reservation-header/reservation-header';
import { FolioOperations} from '../folio-operations/folio-operations';
import { BookingDetails} from '../booking-details/booking-details';
import { GuestDetails} from '../guest-details/guest-details';
import { RoomCharges} from '../room-charges/room-charges';
import { CreditCard} from '../credit-card/credit-card';

@Component({
  selector: 'app-reservation-updates',
  standalone: true,
  imports: [
    CommonModule,
    ReservationHeader,
    FolioOperations,
    BookingDetails,
    GuestDetails,
    RoomCharges,
    CreditCard
  ],
  templateUrl: './reservation-updates.html',
  styleUrl: './reservation-updates.scss'
})
export class ReservationUpdates implements OnInit {
  reservationDetails: ReservationRoomDetails | null = null;
  folioDetails: FolioDetails[] = [];
  reservationId: number = 0;
  propertyCode: string = 'PROP0005';
  loading = false;
  error: string | null = null;
  activeTab: string = 'folio-operations';

  constructor(
    private folioService: FolioService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.reservationId = parseInt(params['id'], 10);

      if (this.reservationId && !isNaN(this.reservationId)) {
        this.loadData();
      } else {
        this.error = 'Invalid reservation ID provided';
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.folioService.getFoliosByReservationId(
      this.reservationId,
      this.propertyCode
    ).subscribe({
      next: (folios) => {
        this.folioDetails = folios;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load folio details';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  onEditDeparture(): void {
    // Implement edit departure logic
  }

  refreshDetails(): void {
    this.loadData();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
