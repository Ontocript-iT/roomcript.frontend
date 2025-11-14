import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReservationService } from '../../../core/services/reservation.service';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {RoomService} from '../../../core/services/room.service';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss']
})
export class ReservationFormComponent implements OnInit {
  reservationForm!: FormGroup;
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || '';
  availableRoomsByIndex: Map<number, any[]> = new Map();

  availableReservationTypes = [
    { value: 'CONFIRMED', label: 'Confirm Booking'},
    { value: 'UNCONFIRMED', label: 'Unconfirm Booking'},
    { value: 'FAILED', label: 'Online Failed Booking'},
    { value: 'HOLD-CONFIRMED', label: 'Hold Confirm Booking'},
    { value: 'HOLD-UNCONFIRMED', label: 'Hold Unconfirm Booking'}
  ];

  availableBookingSources = [
    { value: 'Direct', label: 'Direct'},
    { value: 'Booking.com', label: 'Booking.com'},
    { value: 'Airbnb', label: 'Airbnb'},
  ];

  availableRoomTypes = [
    { value: 'Standard', label: 'Standard Room', availableCount: 0},
    { value: 'Deluxe', label: 'Deluxe Room', availableCount: 0},
    { value: 'Superior-Deluxe', label: 'Superior Deluxe Room', availableCount: 0},
    { value: 'Suite', label: 'Suite Room', availableCount: 0},
    { value: 'Double', label: 'Double Room', availableCount: 0},
    { value: 'Twin', label: 'Twin Room', availableCount: 0},
    { value: 'Quadruple', label: 'Quadruple Room', availableCount: 0},
  ];

  billingSummary = {
    checkIn: '',
    checkOut: '',
    numberOfNights: 0,
    roomCharges: 0,
    taxes: 0,
    totalAmount: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reservationService: ReservationService,
    private roomService: RoomService,
    private snackBar: MatSnackBar,
) {}

  ngOnInit(): void {
    this.initForm();
    this.propertyCode;
    this.loadAvailableRooms();
    this.subscribeToFormChanges();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      numberOfRooms: [1, [Validators.required, Validators.min(1)]],
      reservationType: ['', Validators.required],
      bookingSource: ['', Validators.required],
      rooms: this.fb.array([this.createRoomGroup()]),
      guestTitle: ['MR', Validators.required],
      guestName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      zipCode: ['']
    });
  }

  createRoomGroup(): FormGroup {
    return this.fb.group({
      roomType: ['', Validators.required],
      rateType: ['STANDARD', Validators.required],
      roomNumber: ['', Validators.required],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      manualRate: [false]
    });
  }

  loadAvailableRooms(): void {
    if (!this.propertyCode) {
      console.error('Property code not found');
      return;
    }

    this.reservationService.getAvailableRoomsCount(this.propertyCode).subscribe({
      next: (rooms) => {
        // Update counts for each room type
        this.availableRoomTypes = this.availableRoomTypes.map(roomType => {
          const apiRoom = rooms.find(r => r.roomType === roomType.value);

          return {
            value: roomType.value,
            label: roomType.label, // Keep original label
            availableCount: apiRoom?.availableCount || 0
          };
        });
      },
      error: (error) => {
        console.error('Error loading room availability:', error);
        this.availableRoomTypes = this.availableRoomTypes.map(roomType => ({
          value: roomType.value,
          label: roomType.label,
          availableCount: 0
        }));
      }
    });
  }

  get rooms(): FormArray {
    return this.reservationForm.get('rooms') as FormArray;
  }

  addRoom(): void {
    this.rooms.push(this.createRoomGroup());
  }

  removeRoom(index: number): void {
    this.rooms.removeAt(index);
  }

  incrementRooms(): void {
    const current = this.reservationForm.get('numberOfRooms')?.value || 0;
    this.reservationForm.patchValue({ numberOfRooms: current + 1 });
  }

  decrementRooms(): void {
    const current = this.reservationForm.get('numberOfRooms')?.value || 0;
    if (current > 1) {
      this.reservationForm.patchValue({ numberOfRooms: current - 1 });
    }
  }

  incrementAdults(index: number): void {
    const room = this.rooms.at(index);
    const current = room.get('adults')?.value || 0;
    room.patchValue({ adults: current + 1 });
  }

  decrementAdults(index: number): void {
    const room = this.rooms.at(index);
    const current = room.get('adults')?.value || 0;
    if (current > 1) {
      room.patchValue({ adults: current - 1 });
    }
  }

  incrementChildren(index: number): void {
    const room = this.rooms.at(index);
    const current = room.get('children')?.value || 0;
    room.patchValue({ children: current + 1 });
  }

  decrementChildren(index: number): void {
    const room = this.rooms.at(index);
    const current = room.get('children')?.value || 0;
    if (current > 0) {
      room.patchValue({ children: current - 1 });
    }
  }

  toggleManualRate(index: number): void {
    const room = this.rooms.at(index);
    const currentManual = room.get('manualRate')?.value;
    room.patchValue({ manualRate: !currentManual });
  }

  onRoomTypeChange(index: number): void {
    const room = this.rooms.at(index);
    const roomType = room.get('roomType')?.value;

    if (!roomType) return;

    room.patchValue({ roomNumber: '' });

    this.fetchAvailableRoomsByType(roomType, index);
  }

  fetchAvailableRoomsByType(roomType: string, index: number): void {
    if (!this.propertyCode) {
      console.error('Property code not found');
      return;
    }

    // Use the RoomService method
    this.roomService.getAvailableRoomsByType(this.propertyCode, roomType).subscribe({
      next: (rooms) => {
        // Store available rooms for this specific index
        this.availableRoomsByIndex.set(index, rooms);
        console.log(`Available rooms for ${roomType} at index ${index}:`, rooms);
      },
      error: (error) => {
        // Error is already handled in the service with catchError
        // But you can add additional component-level handling if needed
        console.error(`Error in component for ${roomType}:`, error);
        this.availableRoomsByIndex.set(index, []);
      }
    });
  }

  getAvailableRoomsForIndex(index: number): any[] {
    return this.availableRoomsByIndex.get(index) || [];
  }

  onRoomSelect(index: number): void {
    const roomsArray = this.reservationForm.get('rooms') as FormArray;
    const roomGroup = roomsArray.at(index);
    const selectedRoomId = roomGroup.get('roomNumber')?.value;

    // Get available rooms for this index
    const availableRooms = this.getAvailableRoomsForIndex(index);
    const selectedRoom = availableRooms.find(room => room.id === selectedRoomId);

    if (selectedRoom && !roomGroup.get('manualRate')?.value) {
      roomGroup.patchValue({ rate: selectedRoom.basePrice });
    }
  }


  private transformFormData(formValue: any): any {
    let totalAdults = 0;
    let totalChildren = 0;
    const roomIds: number[] = [];
    const roomGuests: any[] = [];

    formValue.rooms.forEach((room: any) => {
      const roomId = parseInt(room.roomNumber, 10);

      totalAdults += room.adults || 0;
      totalChildren += room.children || 0;
      roomIds.push(roomId);

      roomGuests.push({
        roomId: roomId,
        numberOfAdults: room.adults || 0,
        numberOfChildren: room.children || 0
      });
    });

    // Combine guest title and name
    const guestFullName = `${formValue.guestTitle}. ${formValue.guestName}`;

    // Format dates to YYYY-MM-DD
    const checkInDate = this.formatDate(formValue.checkIn);
    const checkOutDate = this.formatDate(formValue.checkOut);

    // Build complete address string
    const addressParts = [
      formValue.address,
      formValue.city,
      formValue.state,
      formValue.country,
      formValue.zipCode
    ].filter(part => part && part.trim() !== '');

    const fullAddress = addressParts.join(', ');

    // Return transformed data matching target JSON structure
    return {
      name: guestFullName,
      email: formValue.email,
      phone: formValue.mobile,
      address: fullAddress,
      roomIds: roomIds,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numberOfGuests: totalAdults + totalChildren,
      numberOfAdults: totalAdults,
      numberOfChildren: totalChildren,
      roomCount: formValue.rooms.length,
      specialRequests: formValue.specialRequests || '',
      roomGuests: roomGuests
    };
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.reservationForm.valid) {
      this.isLoading = true;

      // Transform form data to API format
      const payload = this.transformFormData(this.reservationForm.value);

      console.log('Sending Payload:', JSON.stringify(payload, null, 2));

      // Call the service
      this.reservationService.createGroupReservation(this.propertyCode, payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Reservation created successfully:', response);
          this.showSuccess('Reservation created successfully!');

          // Reset form and navigate
          this.reservationForm.reset();
          this.initForm(); // Reinitialize form with default values

          setTimeout(() => {
            this.router.navigate(['/reservations']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.reservationForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            this.markFormGroupTouched(group);
          }
        });
      } else {
        control?.markAsTouched();
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

  private handleError(error: any): void {
    let errorMessage = 'An error occurred while adding reservation';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid data provided';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    console.error('Error adding reservation:', error);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onCancel(): void {
    this.router.navigate(['/reservations']);
  }

  private subscribeToFormChanges(): void {
    // Listen to all form value changes
    this.reservationForm.valueChanges.subscribe(() => {
      this.updateBillingSummary();
    });
  }

  private updateBillingSummary(): void {
    const formValue = this.reservationForm.value;

    // check-in and check-out dates
    this.billingSummary.checkIn = this.formatDisplayDate(formValue.checkIn);
    this.billingSummary.checkOut = this.formatDisplayDate(formValue.checkOut);

    // number of nights
    this.billingSummary.numberOfNights = this.calculateNights(formValue.checkIn, formValue.checkOut);

    // room charges
    this.billingSummary.roomCharges = this.calculateRoomCharges(formValue.rooms);

    // total
    this.billingSummary.totalAmount = this.billingSummary.roomCharges + this.billingSummary.taxes;
  }

  private calculateNights(checkIn: Date | string, checkOut: Date | string): number {
    if (!checkIn || !checkOut) return 0;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return 0;

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  private calculateRoomCharges(rooms: any[]): number {
    if (!rooms || rooms.length === 0) return 0;

    const nights = this.billingSummary.numberOfNights;
    if (nights === 0) return 0;

    let total = 0;
    rooms.forEach(room => {
      const rate = parseFloat(room.rate) || 0;
      total += rate * nights;
    });

    return total;
  }

  private formatDisplayDate(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  getRoomCharge(index: number): number {
    const room = this.rooms.at(index);
    const rate = parseFloat(room.get('rate')?.value) || 0;
    return rate * this.billingSummary.numberOfNights;
  }
}
