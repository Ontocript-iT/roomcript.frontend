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

  selectedChargeIds: Set<number> = new Set<number>();

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
    this.selectedChargeIds.clear();

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

  loadAllFolios(): void {
    if (!this.reservationId) return;

    this.loading = true;
    this.folioService.getFoliosByReservationId(this.reservationId, this.propertyCode)
      .subscribe({
        next: (folios) => {
          this.loading = false;
          this.folios = folios;

          if (this.folios.length > 0) {
            // Find the folio with the highest ID (assuming it's the new one)
            const newestFolio = this.folios.reduce((prev, current) =>
              (prev.id > current.id) ? prev : current
            );
            this.selectFolio(newestFolio);
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error refreshing folio list:', err);
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
        this.showSuccess('New folio created successfully');
        this.loadAllFolios();
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
      .filter(payment => !payment.isRefunded)
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
      .filter(payment => !payment.isRefunded)
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

  openRefundDialog(): void {
    if (!this.selectedFolio) {
      this.showError('No folio selected');
      return;
    }

    const totalPayments = this.getRealTotalPayments();

    Swal.fire({
      title: 'Refund Payments',
      html: `
      <div class="text-left">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Folio:</span> ${this.selectedFolio.folioNumber}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            <span class="font-medium">Total Payments:</span> Rs. ${this.formatCurrency(totalPayments)}
          </p>
        </div>
      </div>
    `,
      icon: 'warning',
      iconColor: '#f97316',
      showCancelButton: true,
      confirmButtonText: 'Refund Payments',
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
      }
    }).then((result) => {
      if (result.isConfirmed && this.selectedFolio) {
        this.loading = true;
        const refundedBy = localStorage.getItem('username') || 'SYSTEM';

        const paymentsToRefund = this.selectedFolio.payments?.filter(p => !p.isRefunded) || [];

        if (paymentsToRefund.length === 0) {
          this.loading = false;
          this.showError('No payments to refund');
          return;
        }

        let completed = 0;
        let failed = 0;

        paymentsToRefund.forEach(payment => {
          this.folioService.refundFolioPayment(
            this.selectedFolio!.id,
            payment.id!,
            refundedBy
          ).subscribe({
            next: () => {
              completed++;
              if (completed + failed === paymentsToRefund.length) {
                this.loading = false;
                this.showSuccess('Payments refunded successfully');
                this.refreshSelectedFolio();
              }
            },
            error: (error) => {
              failed++;
              console.error('Error refunding payment:', error);
              if (completed + failed === paymentsToRefund.length) {
                this.loading = false;
                const errorMsg = error.error?.message || error.error?.body || 'Failed to refund payments';
                this.showError(errorMsg);
                this.refreshSelectedFolio();
              }
            }
          });
        });
      }
    });
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.selectedChargeIds.clear();

    if (isChecked) {
      const activeCharges = this.getActiveCharges();
      activeCharges.forEach(charge => {
        if (charge.id) this.selectedChargeIds.add(charge.id);
      });
    }
  }

  toggleChargeSelection(chargeId: number): void {
    if (this.selectedChargeIds.has(chargeId)) {
      this.selectedChargeIds.delete(chargeId);
    } else {
      this.selectedChargeIds.add(chargeId);
    }
  }

  isChargeSelected(chargeId: number): boolean {
    return this.selectedChargeIds.has(chargeId);
  }

  areAllChargesSelected(): boolean {
    const activeCharges = this.getActiveCharges();
    if (activeCharges.length === 0) return false;
    return activeCharges.every(charge => charge.id && this.selectedChargeIds.has(charge.id));
  }

  openShiftSelectedChargesDialog(): void {
    if (this.selectedChargeIds.size === 0 || !this.selectedFolio) return;
    const targetFolios = this.folios.filter(f => f.id !== this.selectedFolio!.id);

    if (targetFolios.length === 0) {
      this.showError('No other folios available to shift charges to.');
      return;
    }

    const folioOptionsHtml = targetFolios
      .map((f) => `
      <option value="${f.id}">
        ${f.folioNumber} - ${f.guestName} ${f.isMasterFolio ? '(Master)' : ''}
      </option>
    `)
      .join('');

    const chargesCount = this.selectedChargeIds.size;
    const currentFolioNum = this.selectedFolio.folioNumber;
    const currentGuest = this.selectedFolio.guestName;

    Swal.fire({
      title: 'Shift Charges',
      html: `
      <div class="text-left space-y-2" style="font-size: 14px;">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 text-sm">
          <div class="flex items-center">
            <span class="font-semibold text-gray-600 w-24">Guest Name:</span>
            <span class="text-gray-800 truncate" title="${currentGuest}">${currentGuest}</span>
          </div>
          <div class="flex items-center">
            <span class="font-semibold text-gray-600 w-28">Items Selected:</span>
            <span class="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">${chargesCount}</span>
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="flex items-center">
            <span class="font-semibold text-gray-600 w-24">Source Folio:</span>
            <span class="text-gray-800">${currentFolioNum}</span>
          </div>
        </div>

        <div class="text-left border-t border-gray-100 pt-4">
          <div class="w-full mb-3">
            <label for="targetFolioSelect" class="block mb-2 font-medium text-gray-700">Select Target Folio</label>
            <select id="targetFolioSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="" disabled selected>Select a folio...</option>
              ${folioOptionsHtml}
            </select>
            <p class="text-xs text-center text-gray-500 mt-2">Charges will be moved to this folio immediately.</p>
          </div>
        </div>
      </div>
    `,
      icon: 'info',
      iconColor: '#3b82f6',
      showCancelButton: true,
      confirmButtonText: 'Shift Charges',
      cancelButtonText: 'Cancel',
      width: '600px',
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
        const targetFolioId = (document.getElementById('targetFolioSelect') as HTMLSelectElement).value;

        if (!targetFolioId) {
          Swal.showValidationMessage('Please select a target folio');
          return false;
        }

        return { targetFolioId: parseInt(targetFolioId) };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { targetFolioId } = result.value;
        const sourceFolioId = this.selectedFolio!.id;
        const chargeIdsArray = Array.from(this.selectedChargeIds);
        const createdBy = localStorage.getItem('username') || 'SYSTEM';
        const targetFolioName = targetFolios.find(f => f.id === targetFolioId)?.folioNumber;

        this.loading = true;

        this.folioService.transferOrCutCharges(
          sourceFolioId,
          targetFolioId,
          chargeIdsArray,
          createdBy
        ).subscribe({
          next: () => {
            this.loading = false;
            this.showSuccess(`Successfully shifted ${chargesCount} charges to folio ${targetFolioName}`);
            this.selectedChargeIds.clear();

            this.refreshFolioInSidebar(sourceFolioId);
            this.refreshFolioInSidebar(targetFolioId);
            this.refreshSelectedFolio(); // Refreshes current view
          },
          error: (error) => {
            this.loading = false;
            console.error('Error shifting charges:', error);
            const errorMsg = error.error?.message || error.error?.body || 'Failed to shift charges';
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
