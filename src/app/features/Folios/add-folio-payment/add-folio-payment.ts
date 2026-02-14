import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FolioDetails } from '../../../core/models/folio.model';
import { FolioService } from '../../../core/services/folio.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-folio-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-folio-payment.html',
  styleUrl: './add-folio-payment.scss'
})
export class AddFolioPayment implements OnInit, OnChanges {
  @Input() selectedFolio: FolioDetails | null = null;
  // NEW: Receive the balance limit
  @Input() maxPayableAmount: number = 0;

  @Output() cancel = new EventEmitter<void>();
  @Output() paymentAdded = new EventEmitter<any>();

  paymentData = {
    paymentMethod: '',
    amount: 0,
    remarks: '',
    createdBy: ''
  };

  isSubmitting = false;

  constructor(
    private folioService: FolioService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.paymentData.createdBy = localStorage.getItem('username') || 'Unknown';
    // Autofill on init
    this.autofillAmount();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If the max amount changes (or loads late), update the form
    if (changes['maxPayableAmount']) {
      this.autofillAmount();
    }
  }

  autofillAmount(): void {
    // Set amount to the balance, but ensure it's not negative
    this.paymentData.amount = this.maxPayableAmount > 0 ? this.maxPayableAmount : 0;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid() || !this.selectedFolio?.id) {
      this.showError('Please check the form for errors');
      return;
    }

    this.isSubmitting = true;

    try {
      const result = await this.folioService.addFolioPayment(this.selectedFolio.id, this.paymentData).toPromise();
      this.paymentAdded.emit(result);
      this.showSuccess('Payment added successfully');
      this.resetForm();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      const errorMsg = error.error?.message || 'Failed to add payment. Please try again.';
      this.showError(errorMsg);
    } finally {
      this.isSubmitting = false;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.paymentData.paymentMethod &&
      this.paymentData.amount > 0 &&
      // NEW: Ensure amount does not exceed balance
      this.paymentData.amount <= this.maxPayableAmount
    );
  }

  resetForm(): void {
    this.paymentData = {
      paymentMethod: '',
      amount: 0,
      remarks: '',
      createdBy: localStorage.getItem('username') || 'Unknown'
    };
    // Re-autofill after reset
    this.autofillAmount();
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
