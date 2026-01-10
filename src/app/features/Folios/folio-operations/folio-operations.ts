import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolioDetails } from '../../../core/models/folio.model';
import { FolioService } from '../../../core/services/folio.service';
import Swal from 'sweetalert2';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { AddFolioCharge} from '../add-folio-charge/add-folio-charge';
import { AddFolioPayment} from '../add-folio-payment/add-folio-payment';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

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
    AddFolioPayment,
    DragDropModule,
    AddFolioPayment
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
  showPaymentForm: boolean = false;

  voidReasons = [
    { value: 'Duplicate charge', label: 'Duplicate Charge' },
    { value: 'Incorrect amount', label: 'Incorrect Amount' },
    { value: 'Incorrect Entry', label: 'Incorrect Entry' },
    { value: 'Reversed guest request', label: 'Reversed guest request' },
    { value: 'Complimentary', label: 'Complimentary/Courtesy' },
    { value: 'Other', label: 'Other' }
  ];

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

  getGuestId(): number | null {
    const folioWithGuest = this.folios.find(f => f.guestId);
    return folioWithGuest?.guestId ?? null;
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
    const guestId = this.getGuestId();

    this.folioService.createFolio(
      this.reservationId!,
      guestId,
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

  openChargeForm(): void {
    if (!this.selectedFolio) {
      this.showError('Please select a folio first');
      return;
    }
    this.closeAllForms();
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

  getConnectedFolioIds(): string[] {
    return this.folios.map(f => `folio-${f.id}`);
  }

  onChargeDrop(event: CdkDragDrop<any>, targetFolio: FolioDetails): void {
    if (event.previousContainer !== event.container) {
      const droppedCharge = event.previousContainer.data[event.previousIndex];

      if (this.selectedFolio?.id === targetFolio.id) {
        this.showError('Charge is already in this folio');
        return;
      }

      const chargeIds = [droppedCharge.id];
      const performedBy = localStorage.getItem('username') || '';

      this.transferChargeBatch(
        this.selectedFolio!.id,
        targetFolio.id,
        chargeIds,
        performedBy
      );
    }
  }

  private transferChargeBatch(
    sourceFolioId: number,
    targetFolioId: number,
    chargeIds: number[],
    performedBy: string
  ): void {
    this.loading = true;

    this.folioService.transferCharges(sourceFolioId, targetFolioId, chargeIds, performedBy)
      .subscribe({
        next: () => {
          this.loading = false;
          this.showSuccess(`Charge transferred successfully`);

          this.refreshFolioInSidebar(sourceFolioId);
          this.refreshFolioInSidebar(targetFolioId);

          const targetFolio = this.folios.find(f => f.id === targetFolioId);
          if (targetFolio) {
            this.selectFolio(targetFolio);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error transferring charge:', error);
          const errorMsg = error.error?.message || error.error?.body || 'Failed to transfer charge';
          this.showError(errorMsg);
        }
      });
  }

  private refreshFolioInSidebar(folioId: number): void {
    this.folioService.getFolioById(folioId, this.propertyCode).subscribe({
      next: (updatedFolio) => {
        if (updatedFolio) {
          const index = this.folios.findIndex(f => f.id === folioId);
          if (index !== -1) {
            this.folios[index] = updatedFolio;
          }
        }
      },
      error: (error) => {
        console.error('Error refreshing folio:', error);
      }
    });
  }

  getRealTotalCharges(): number {
    if (!this.selectedFolio?.charges) return 0;

    return this.selectedFolio.charges
      .filter(charge => !charge.isVoided)
      .reduce((sum, charge) => sum + charge.totalAmount, 0);
  }

  getRealTotalPayments(): number {
    if (!this.selectedFolio?.payments) return 0;

    return this.selectedFolio.payments
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  getRealBalance(): number {
    const charges = this.getRealTotalCharges();
    const payments = this.getRealTotalPayments();
    return charges - payments;
  }

  getFolioRealBalance(folio: FolioDetails): number {
    if (!folio.charges || !folio.payments) return folio.balance;

    const realCharges = folio.charges
      .filter(charge => !charge.isVoided)
      .reduce((sum, charge) => sum + charge.totalAmount, 0);

    const realPayments = folio.payments
      .reduce((sum, payment) => sum + payment.amount, 0);

    return realCharges - realPayments;
  }

  getActiveCharges(): any[] {
    if (!this.selectedFolio || !this.selectedFolio.charges) {
      return [];
    }
    return this.selectedFolio.charges.filter(charge => !charge.isVoided);
  }

  voidCharge(charge: any): void {
    Swal.fire({
      title: 'Void Charge',
      html: `
      <div class="text-left">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Description:</span> ${charge.description}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            <span class="font-medium">Amount:</span> Rs. ${this.formatCurrency(charge.totalAmount)}
          </p>
        </div>

        <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Void: <span class="text-red-500">*</span></label>
        <select id="void-reason" class="swal2-select w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500" style="margin: 0 !important; width: 100% !important;">
          <option value="">Select a reason...</option>
          ${this.voidReasons.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
        </select>
      </div>
    `,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: 'Void Charge',
      cancelButtonText: 'Cancel',
      width: '500px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-delete-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      },
      preConfirm: () => {
        const reasonSelect = document.getElementById('void-reason') as HTMLSelectElement;
        const reason = reasonSelect.value;

        if (!reason) {
          Swal.showValidationMessage('Please select a reason for voiding');
          return false;
        }

        return { chargeId: charge.id, reason: reason };
      }
    }).then((result) => {
      if (result.isConfirmed && this.selectedFolio) {
        this.loading = true;
        const voidedBy = localStorage.getItem('username') || 'SYSTEM';

        this.folioService.voidCharge(
          this.selectedFolio.id,
          result.value.chargeId,
          result.value.reason,
          voidedBy
        ).subscribe({
          next: () => {
            this.loading = false;
            this.showSuccess('Charge voided successfully');
            this.refreshSelectedFolio();
          },
          error: (error) => {
            this.loading = false;
            console.error('Error voiding charge:', error);
            const errorMsg = error.error?.message || error.error?.body || 'Failed to void charge';
            this.showError(errorMsg);
          }
        });
      }
    });
  }

  openPaymentForm(): void {
    if (!this.selectedFolio) {
      this.showError('Please select a folio first');
      return;
    }
    this.closeAllForms();
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
  }

  onPaymentAdded(addedPayment: any): void {
    this.loading = false;
    this.showSuccess('Payment added successfully');
    this.closePaymentForm();
    this.refreshSelectedFolio();
  }

  closeAllForms(): void {
    this.showChargeForm = false;
    this.showPaymentForm = false;
  }

  settleFolioDialog(): void {
    if (!this.selectedFolio) {
      this.showError('No folio selected');
      return;
    }

    const folio = this.selectedFolio;

    Swal.fire({
      title: 'Settle Folio',
      html: `
      <div class="text-left">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Folio:</span> ${folio.folioNumber}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            <span class="font-medium">Balance:</span> Rs. ${this.formatCurrency(folio.balance)}
          </p>
        </div>
      </div>
    `,
      icon: 'success',
      iconColor: '#10b981',
      showCancelButton: true,
      confirmButtonText: 'Settle Folio',
      cancelButtonText: 'Cancel',
      width: '500px',
      padding: '1.5rem',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-small-popup',
        title: 'swal-small-title',
        htmlContainer: 'swal-small-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        actions: 'swal-actions'
      },
      preConfirm: () => {
        if (folio.balance !== 0) {
          Swal.showValidationMessage('Cannot settle folio with outstanding balance');
          return false;
        }
        return { folioId: folio.id };
      }
    }).then((result) => {
      if (result.isConfirmed && this.selectedFolio) {
        this.loading = true;
        const settledBy = localStorage.getItem('username') || 'SYSTEM';

        this.folioService.settleFolio(
          result.value.folioId,
          settledBy
        ).subscribe({
          next: () => {
            this.loading = false;
            this.showSuccess('Folio settled successfully');
            this.refreshSelectedFolio();
          },
          error: (error) => {
            this.loading = false;
            console.error('Error settling folio:', error);
            const errorMsg = error.error?.message || error.error?.body || 'Failed to settle folio';
            this.showError(errorMsg);
          }
        });
      }
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
