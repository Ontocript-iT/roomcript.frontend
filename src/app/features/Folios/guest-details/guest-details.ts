import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuestService } from '../../../core/services/guest.service';
import { GuestDetails } from '../../../core/models/guest.model';

@Component({
  selector: 'app-guest-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guest-details.html',
  styleUrl: './guest-details.scss'
})
export class GuestDetailsComponent implements OnInit, OnChanges {
  @Input() guestId!: number;
  @Input() reservationId!: number;
  @Input() reservationDetails: any;

  guestDetails: GuestDetails | null = null;
  loading = false;
  error: string | null = null;

  constructor(private guestService: GuestService) {}

  ngOnInit(): void {
    if (this.guestId) {
      this.loadGuestDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['guestId'] && !changes['guestId'].firstChange) {
      this.loadGuestDetails();
    }
  }

  loadGuestDetails(): void {
    this.loading = true;
    this.error = null;

    this.guestService.getGuestDetailsByGuestId(this.guestId).subscribe({
      next: (details) => {
        this.guestDetails = details;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading guest details:', error);
        this.error = 'Failed to load guest details';
        this.loading = false;
      }
    });
  }
}

