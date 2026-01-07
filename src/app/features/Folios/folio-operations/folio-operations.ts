import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRoomDetails, FolioDetails } from '../../../core/models/folio.model';
import { FolioService } from '../../../core/services/folio.service';
import Swal from 'sweetalert2';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { AddFolioCharge} from '../add-folio-charge/add-folio-charge';

@Component({
  selector: 'app-folio-operations',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    MatIconButton,
    FormsModule,
    AddFolioCharge,
  ],
  templateUrl: './folio-operations.html',
  styleUrl: './folio-operations.scss'
})
export class FolioOperations implements OnInit, OnChanges {
  @Input() reservationId: number | undefined;
  @Input() folios: FolioDetails[] = [];

  selectedFolio: FolioDetails | null = null;
  loading: boolean = false;
  propertyCode: string = 'PROP0005';

  showChargeForm: boolean = false;

  constructor(
    private folioService: FolioService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    if (this.folios.length > 0) {
      this.selectDefaultFolio();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folios'] && this.folios.length > 0) {
      this.selectDefaultFolio();
    }
  }

  selectDefaultFolio(): void {
    const masterFolio = this.folios.find(f => f.isMasterFolio);
    this.selectedFolio = masterFolio || this.folios[0];

    if (this.selectedFolio) {
      this.loadFolioDetails(this.selectedFolio.id);
    }
  }

  selectFolio(folio: FolioDetails): void {
    this.loadFolioDetails(folio.id);
  }

  loadFolioDetails(folioId: number): void {
    this.loading = true;

    this.folioService.getFolioById(folioId, this.propertyCode)
      .subscribe({
        next: (folio) => {
          this.loading = false;
          if (folio) {
            this.selectedFolio = folio;
            const index = this.folios.findIndex(f => f.id === folio.id);
            if (index !== -1) {
              this.folios[index] = folio;
            }
          }
        },
        error: (error) => {
          this.loading = false;
        }
      });
  }

  refreshSelectedFolio(): void {
    if (this.selectedFolio) {
      this.loadFolioDetails(this.selectedFolio.id);
    }
  }

  addNewFolio(): void {
    if (!this.reservationId) {
      console.error('No reservation ID available');
      return;
    }

    const createdBy = localStorage.getItem('username');
    if (!createdBy) {
      console.error('User role not found. Cannot create folio.');
      return;
    }

    Swal.fire({
      title: 'Create New Folio',
      html: `<p class="text-gray-600">Are you sure you want to create a new folio for this reservation?</p>`,
      icon: 'warning',
      iconColor: '#8b5cf6',
      showCancelButton: true,
      confirmButtonText: 'Yes, Create',
      cancelButtonText: 'No',
      width: '450px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.createFolio(createdBy);
      }
    });
  }

  private createFolio(createdBy: string): void {
    this.loading = true;
    const folioType = 'GUEST';

    this.folioService.createFolio(
      this.reservationId!,
      null,
      folioType,
      createdBy,
      this.propertyCode
    ).subscribe({
      next: (newFolio) => {
        this.loading = false;
        if (newFolio) {
          this.folios.push(newFolio);
          this.selectedFolio = newFolio;
          this.loadFolioDetails(newFolio.id);
          this.showSuccess('New folio created successfully');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating folio:', error);
        const errorMsg = error.error?.message || error.error?.body || 'Failed to create folio';
        this.showError(errorMsg);
      }
    });
  }

  deleteFolio(folio: FolioDetails): void {
    Swal.fire({
      title: 'Delete Folio',
      html: `<p class="text-gray-600">Are you sure you want to delete folio <strong>${folio.folioNumber}</strong>?</p>`,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'No',
      width: '400px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-delete-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDeleteFolio(folio.id);
      }
    });
  }

  private confirmDeleteFolio(folioId: number): void {
    this.loading = true;
    this.folioService.deleteFolio(folioId).subscribe({
      next: () => {
        this.loading = false;
        this.folios = this.folios.filter(f => f.id !== folioId);
        if (this.folios.length > 0) {
          this.selectDefaultFolio();
        } else {
          this.selectedFolio = null;
        }
        this.showSuccess('Folio deleted successfully');
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting folio:', error);
        const errorMsg = error.error?.message || error.error?.body || 'Failed to delete folio';
        this.showError(errorMsg);
      }
    });
  }

  // ✅ PERFECT - Updated methods for charge form
  openChargeForm(): void {
    if (!this.selectedFolio) {
      this.showError('Please select a folio first');
      return;
    }
    this.showChargeForm = true;
  }

  closeChargeForm(): void {
    this.showChargeForm = false;
  }

  onChargeAdded(addedCharge: any): void {
    this.loading = false;
    this.showSuccess('Charge added successfully');
    this.closeChargeForm();
    this.refreshSelectedFolio();
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
