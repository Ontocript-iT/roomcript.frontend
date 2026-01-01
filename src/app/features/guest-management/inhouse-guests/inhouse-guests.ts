import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { InhouseGuest } from '../../../core/models/guest.model';
import { GuestService } from '../../../core/services/guest.service';
import { AuthService } from '../../../core/services/auth.service';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';

@Component({
  selector: 'app-inhouse-guests',
  imports: [
    MatIconModule,
    MatButton,
    MatCardModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconButton,
    MatTooltipModule,
    MatMenuTrigger,
    MatMenuModule
  ],
  templateUrl: './inhouse-guests.html',
  styleUrls: ['./inhouse-guests.scss']
})
export class InhouseGuestsComponent implements OnInit {
  guests: InhouseGuest[] = [];
  isLoading = false;
  propertyCode: string = '';

  constructor(
    private guestService: GuestService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.propertyCode = localStorage.getItem("propertyCode") || '';
    this.loadInHouseGuests();
  }

  loadInHouseGuests(): void {
    if (!this.propertyCode) {
      this.showMessage('Property code not found', 'error');
      return;
    }

    this.isLoading = true;
    this.guestService.getInHouseGuests(this.propertyCode).subscribe({
      next: (data) => {
        this.guests = data;
        this.isLoading = false;
        console.log('Loaded in-house guests:', this.guests.length);
      },
      error: (error) => {
        console.error('Error loading in-house guests:', error);
        this.showMessage('Failed to load in-house guests', 'error');
        this.isLoading = false;
      }
    });
  }

  refreshGuests(): void {
    this.loadInHouseGuests();
    this.showMessage('Guest list refreshed', 'success');
  }

  viewGuest(guest: InhouseGuest): void {
    this.router.navigate(['/guests/view', guest.guestId]);
  }

  checkOutGuest(guest: InhouseGuest): void {
    if (confirm(`Are you sure you want to check out ${guest.name}?`)) {
      this.showMessage(`${guest.name} checked out successfully`, 'success');
      this.loadInHouseGuests();
    }
  }

  editReservation(guest: InhouseGuest): void {
    this.router.navigate(['/reservations/edit', guest.guestId]);
  }

  viewBilling(guest: InhouseGuest): void {
    this.router.navigate(['/billing', guest.guestId]);
  }

  changeRoom(guest: InhouseGuest): void {
    this.showMessage('Room change feature coming soon', 'info');
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}

