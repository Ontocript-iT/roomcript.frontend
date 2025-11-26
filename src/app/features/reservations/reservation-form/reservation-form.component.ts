import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReservationService } from '../../../core/services/reservation.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomService } from '../../../core/services/room.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatetimepickerModule } from '@mat-datetimepicker/core';
import { MatNativeDatetimeModule } from '@mat-datetimepicker/core';
import { DatePipe } from '@angular/common';

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
    MatCheckbox,
    MatTooltipModule,
    FormsModule,
    MatDatetimepickerModule,
    MatNativeDatetimeModule,
  ],
  providers: [DatePipe],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss']
})
export class ReservationFormComponent implements OnInit {
  reservationForm!: FormGroup;
  isLoading = false;
  propertyCode = localStorage.getItem("propertyCode") || '';
  availableRoomsByIndex: Map<number, any[]> = new Map();
  showDiscountField = false;

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
    discount: 0,
    taxes: 0,
    totalAmount: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reservationService: ReservationService,
    private roomService: RoomService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
) {}

  ngOnInit(): void {
    this.initForm();
    this.propertyCode;
    this.subscribeToDateChanges();
    this.subscribeToFormChanges();
    this.subscribeToGroupReservationChanges();
    this.subscribeToReservationTypeChanges();
    this.subscribeToHoldReservationChanges();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      numberOfRooms: [1, [Validators.required, Validators.min(1)]],
      reservationType: ['', Validators.required],
      bookingSource: ['', Validators.required],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      isGroupReservation: [false],
      confirmationVoucher: [false],
      isOnhold: [false],
      isOnHold: [{ value: false, disabled: true }],
      rooms: this.fb.array([this.createRoomGroup()]),
      guestTitle: ['MR', Validators.required],
      guestName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      zipCode: [''],
      holdDate: [''],
      remindBeforeDays: [0, [Validators.min(0)]],
      releaseDateTime: [{ value: '', disabled: true }],
      remindDaysBeforeRelease: [{ value: 0, disabled: true }, [Validators.min(0)]]
    });
  }

  getFormattedReleaseDateTime(): string | null {
    const releaseDateTime = this.reservationForm.get('releaseDateTime')?.value;
    if (!releaseDateTime) return null;

    // releaseDateTime could be a Date object or string
    const date = new Date(releaseDateTime);
    if (isNaN(date.getTime())) return null;

    // Format as 'yyyy-MM-ddTHH:mm:ss' (no timezone offset)
    return this.datePipe.transform(date, "yyyy-MM-dd'T'HH:mm:ss") || null;
  }

  private subscribeToDateChanges(): void {
    // Listen to check in date changes
    this.reservationForm.get('checkIn')?.valueChanges.subscribe((checkInDate) => {
      this.clearAllRoomSelections();
      this.loadAvailableRooms();
    });

    // Listen to check out date changes
    this.reservationForm.get('checkOut')?.valueChanges.subscribe((checkOutDate) => {
      this.clearAllRoomSelections();
      this.loadAvailableRooms();
    });
  }

  private clearAllRoomSelections(): void {
    this.availableRoomsByIndex.clear();

    this.rooms.controls.forEach((room) => {
      room.patchValue({
        roomType: '',
        roomNumber: '',
        rate: 0
      });
    });
  }

  private subscribeToGroupReservationChanges(): void {
    this.reservationForm.get('isGroupReservation')?.valueChanges.subscribe((isGroupReservation) => {
      if (!isGroupReservation) {
        // When unchecked, remove all rooms except the first one
        while (this.rooms.length > 1) {
          this.rooms.removeAt(this.rooms.length - 1);
        }

        // Clear the room index map for removed rooms
        this.availableRoomsByIndex.clear();

        // Update the number of rooms field
        this.updateNumberOfRooms();

        // Optionally show a message to the user
        if (this.rooms.length > 1) {
          this.showSuccess('Additional rooms removed. Only the first room remains.');
        }
      }
    });
  }

  toggleDiscountField(): void {
    this.showDiscountField = !this.showDiscountField;
  }

  removeDiscount(): void {
    this.reservationForm.patchValue({ discount: 0 });
    this.showDiscountField = false;
  }

  private subscribeToReservationTypeChanges(): void {
    this.reservationForm.get('reservationType')?.valueChanges.subscribe((reservationType) => {
      const holdReservationControl = this.reservationForm.get('isOnHold');
      const holdDateControl = this.reservationForm.get('releaseDateTime');
      const remindBeforeDaysControl = this.reservationForm.get('remindDaysBeforeRelease');

      if (reservationType === 'CONFIRMED') {
        // Disable and uncheck the "Hold Reservation" checkbox for Confirm Booking
        holdReservationControl?.disable();
        holdReservationControl?.setValue(false);

        // Also disable the hold date and remind fields
        holdDateControl?.disable();
        holdDateControl?.setValue('');
        remindBeforeDaysControl?.disable();
        remindBeforeDaysControl?.setValue(0);
      } else {
        // Enable the "Hold Reservation" checkbox for other reservation types
        holdReservationControl?.enable();
      }
    });
  }

  private subscribeToHoldReservationChanges(): void {
    this.reservationForm.get('isOnHold')?.valueChanges.subscribe((isHoldReservation) => {
      const holdDateControl = this.reservationForm.get('releaseDateTime');
      const remindBeforeDaysControl = this.reservationForm.get('remindDaysBeforeRelease');

      if (isHoldReservation) {
        // Enable hold date and remind before days fields when checked
        holdDateControl?.enable();
        remindBeforeDaysControl?.enable();
      } else {
        // Disable and clear the fields when unchecked
        holdDateControl?.disable();
        holdDateControl?.setValue('');
        remindBeforeDaysControl?.disable();
        remindBeforeDaysControl?.setValue(0);
      }
    });
  }

  createRoomGroup(): FormGroup {
    return this.fb.group({
      roomType: ['', Validators.required],
      rateType: ['STANDARD'],
      roomNumber: [''],
      adults: [1, [Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      rate: [0, [Validators.min(0)]],
      manualRate: [false]
    });
  }

  loadAvailableRooms(): void {
    if (!this.propertyCode) {
      return;
    }

    const checkInDate = this.reservationForm.get('checkIn')?.value;
    const checkOutDate = this.reservationForm.get('checkOut')?.value;

    if (!checkInDate || !checkOutDate) {
      return;
    }

    // Format dates to YYYY-MM-DD
    const formattedCheckIn = this.formatDate(checkInDate);
    const formattedCheckOut = this.formatDate(checkOutDate);

    this.roomService.getAvailableRoomsCount(
      this.propertyCode,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        this.availableRoomTypes = this.availableRoomTypes.map(roomType => {
          const apiRoom = rooms.find(r => r.roomType === roomType.value);

          return {
            value: roomType.value,
            label: roomType.label,
            availableCount: apiRoom?.availableCount || 0
          };
        });
      },
      error: (error) => {
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

  get canAddRoom(): boolean {
    return this.reservationForm.get('isGroupReservation')?.value === true;
  }

  addRoom(): void {
    // Only allow adding rooms if group reservation is checked
    if (!this.canAddRoom) {
      this.showError('Please enable "Group Reservation" to add multiple rooms');
      return;
    }

    this.rooms.push(this.createRoomGroup());
    this.updateNumberOfRooms();
  }

  removeRoom(index: number): void {
    if (this.rooms.length > 1) {
      this.availableRoomsByIndex.delete(index);
      this.rooms.removeAt(index);
      this.updateNumberOfRooms();
    } else {
      this.showError('At least one room is required');
    }
  }

  private updateNumberOfRooms(): void {
    const roomCount = this.rooms.length;
    this.reservationForm.patchValue(
      { numberOfRooms: roomCount },
      { emitEvent: false }
    );
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

  incrementRemindBeforeDays(): void {
    const control = this.reservationForm.get('remindDaysBeforeRelease');
    if (!control) return;

    const current = control.value || 0;
    if (current < 365) {
      control.setValue(current + 1);
    }
  }

  decrementRemindBeforeDays(): void {
    const control = this.reservationForm.get('remindDaysBeforeRelease');
    if (!control) return;

    const current = control.value || 0;
    if (current > 0) {
      control.setValue(current - 1);
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

    // Clear room number and rate when type changes
    room.patchValue({
      roomNumber: '',
      rate: 0
    });

    // Fetch available rooms for this type
    this.fetchAvailableRoomsByType(roomType, index);
  }

  fetchAvailableRoomsByType(roomType: string, index: number): void {
    if (!this.propertyCode) {
      return;
    }

    // Get check-in and check-out dates from form
    const checkInDate = this.reservationForm.get('checkIn')?.value;
    const checkOutDate = this.reservationForm.get('checkOut')?.value;

    // Validate dates are selected
    if (!checkInDate || !checkOutDate) {
      this.showError('Please select check-in and check-out dates first');
      // Reset room type selection
      const room = this.rooms.at(index);
      room.patchValue({ roomType: '' });
      return;
    }

    // Format dates to YYYY-MM-DD
    const formattedCheckIn = this.formatDate(checkInDate);
    const formattedCheckOut = this.formatDate(checkOutDate);

    // Call service with propertyCode, roomType, and dates
    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        // Store available rooms for this specific index
        this.availableRoomsByIndex.set(index, rooms);

        // Show message if no rooms available
        if (rooms.length === 0) {
          this.showError(`No ${roomType} rooms available for selected dates`);
        }
      },
      error: (error) => {
        this.availableRoomsByIndex.set(index, []);
        this.showError(`Failed to load available rooms for ${roomType}`);
      }
    });
  }

  getAvailableRoomsForIndex(index: number): any[] {
    const rooms = this.availableRoomsByIndex.get(index);
    return Array.isArray(rooms) ? rooms : [];
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

    const reservationCategory = formValue.isGroupReservation ? 'GROUP' : 'INDIVIDUAL';
    const isGroupReservationNumeric = formValue.isGroupReservation ? 1 : 0;

    const rawFormValue = this.reservationForm.getRawValue();
    const sendVoucher = rawFormValue.confirmationVoucher ?? false;
    const formattedDateTime = this.getFormattedReleaseDateTime();

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
      reservationCategory: reservationCategory,
      isGroupReservation: isGroupReservationNumeric,
      reservationType: formValue.reservationType,
      bookingSource: formValue.bookingSource,
      sendVoucher: sendVoucher,
      discountPercentage: formValue.discount || 0,
      discountAmount: this.billingSummary.discount,
      subtotal: this.billingSummary.roomCharges,
      totalAmount: this.billingSummary.totalAmount,
      specialRequests: formValue.specialRequests || '',
      roomGuests: roomGuests,
      isOnHold: formValue.isOnHold,
      releaseDateTime: formattedDateTime,
      remindDaysBeforeRelease: formValue.remindDaysBeforeRelease,
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
          this.showSuccess('Reservation created successfully!');

          setTimeout(() => {
            this.router.navigate(['/reservations/all']);
          }, 1500);

          this.reservationForm.reset();
          this.initForm(); // Reinitialize form with default values
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
    this.billingSummary.numberOfNights = this.calculateNights(formValue.checkIn, formValue.checkOut);

    // room charges
    this.billingSummary.roomCharges = this.calculateRoomCharges(formValue.rooms);

    // Calculate discount
    const discountPercent = formValue.discount || 0;
    this.billingSummary.discount = (this.billingSummary.roomCharges * discountPercent) / 100;

    // Calculate total with discount
    this.billingSummary.totalAmount = this.billingSummary.roomCharges - this.billingSummary.discount + this.billingSummary.taxes;
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
