import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { forkJoin } from 'rxjs';
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

    // Load both reservation details and folios in parallel
    forkJoin({
      reservation: this.folioService.getReservationDetailsById(this.reservationId),
      folios: this.folioService.getFoliosByReservationId(this.reservationId, this.propertyCode)
    }).subscribe({
      next: (result) => {
        this.reservationDetails = result.reservation;
        this.folioDetails = result.folios;
        this.loading = false;

        // Handle case where reservation details are not found
        if (!this.reservationDetails) {
          this.error = 'Reservation details not found';
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.error = 'Failed to load reservation details';
        this.loading = false;
      }
    });
  }

  onStatusUpdated(): void {
    this.folioService.getReservationDetailsById(this.reservationId)
      .subscribe({
        next: (reservation) => {
          this.reservationDetails = reservation; // Only update header data
        },
        error: (error) => {
          console.error('Error refreshing reservation:', error);
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  onEditDeparture(): void {
    // Implement edit departure logic
    console.log('Edit departure clicked for reservation:', this.reservationId);
  }

  refreshDetails(): void {
    this.loadData();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
