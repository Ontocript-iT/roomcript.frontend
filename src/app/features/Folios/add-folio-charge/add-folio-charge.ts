import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FolioDetails } from '../../../core/models/folio.model';
import { FolioService } from '../../../core/services/folio.service';
import { MatSnackBar } from '@angular/material/snack-bar'; // ✅ Use Material SnackBar instead

@Component({
  selector: 'app-add-folio-charge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-folio-charge.html',
  styleUrl: './add-folio-charge.scss'
})
export class AddFolioCharge implements OnInit {
  @Input() selectedFolio: FolioDetails | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() chargeAdded = new EventEmitter<any>(); // ✅ This event triggers parent

  chargeData = {
    chargeType: '',
    description: '',
    amount: 0,
    quantity: 1,
    taxAmount: 0,
    createdBy: ''
  };

  isSubmitting = false;

  constructor(
    private folioService: FolioService,
    private snackBar: MatSnackBar  // ✅ Use Material SnackBar
  ) {}

  ngOnInit(): void {
    this.chargeData.createdBy = localStorage.getItem('username') || 'Unknown';
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
      const result = await this.folioService.addCharge(this.selectedFolio.id, this.chargeData).toPromise();

      // ✅ Emit success to parent (closes form + refreshes folio)
      this.chargeAdded.emit(result);

      this.showSuccess('Charge added successfully');
      this.resetForm();

    } catch (error: any) {
      console.error('Error adding charge:', error);
      const errorMsg = error.error?.message || 'Failed to add charge. Please try again.';
      this.showError(errorMsg);
    } finally {
      this.isSubmitting = false;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.chargeData.chargeType &&
      this.chargeData.description &&
      this.chargeData.amount > 0 &&
      this.chargeData.quantity > 0
    );
  }

  resetForm(): void {
    this.chargeData = {
      chargeType: '',
      description: '',
      amount: 0,
      quantity: 1,
      taxAmount: 0,
      createdBy: localStorage.getItem('username') || 'Unknown'
    };
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2);
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
