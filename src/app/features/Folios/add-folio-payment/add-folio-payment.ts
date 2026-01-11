import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class AddFolioPayment implements OnInit {
  @Input() selectedFolio: FolioDetails | null = null;
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
  }

  onCancel(): void {
    this.cancel.emit();
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid() || !this.selectedFolio?.id) {
      this.showError('Please fill all required fields');
      return;
    }

    this.isSubmitting = true;

    try {
      const result = await this.folioService.addFolioPayment(this.selectedFolio.id, this.paymentData).toPromise();

      // Emit success to parent (closes form + refreshes folio)
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
      this.paymentData.amount > 0
    );
  }

  resetForm(): void {
    this.paymentData = {
      paymentMethod: '',
      amount: 0,
      remarks: '',
      createdBy: localStorage.getItem('username') || 'Unknown'
    };
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
