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
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GuestService } from '../../../core/services/guest.service';

interface Guest {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

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
    NgxMaterialTimepickerModule,
    MatAutocompleteModule,
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
  showAdvanceField = false;
  filteredGuests$!: Observable<Guest[]>;
  allGuests: Guest[] = [];
  isLoadingGuests = false;
  discountType: 'percentage' | 'amount' = 'percentage';

  availableReservationTypes = [
    { value: 'CONFIRMED', label: 'Confirm Booking'},
    { value: 'TENTATIVE', label: 'Tentative Booking'},
  ];

  availableBookingSources = [
    { value: 'Direct', label: 'Direct'},
    { value: 'Walking', label: 'Walking'},
    { value: 'Booking.com', label: 'Booking.com'},
    { value: 'Airbnb', label: 'Airbnb'},
    { value: 'Expedia', label: 'Expedia'},
    { value: 'Agoda', label: 'Agoda'},
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
    totalAmount: 0,
    advancePayment: 0,
    balanceAmount: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reservationService: ReservationService,
    private guestService: GuestService,
    private roomService: RoomService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
) {}

  ngOnInit(): void {
    this.initForm();
    this.subscribeToDateChanges();
    this.subscribeToFormChanges();
    this.subscribeToGroupReservationChanges();
    this.subscribeToReservationTypeChanges();
    this.subscribeToHoldReservationChanges();
    this.loadGuestData();
    this.setupGuestAutocomplete();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      numberOfRooms: [{ value: 1, disabled: true }, [Validators.required, Validators.min(1)]],
      reservationType: ['', Validators.required],
      bookingSource: ['', Validators.required],
      discount: [0, [Validators.min(0)]],
      discountType: ['percentage'],
      advance: [0, [Validators.min(0)]],
      isGroupReservation: [false],
      confirmationVoucher: [false],
      isOnhold: [false],
      isOnHold: [{ value: false, disabled: true }],
      rooms: this.fb.array([this.createRoomGroup()]),
      guestTitle: ['MR', Validators.required],
      guestName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.email]],
      passportNic: ['', Validators.required],
      remarks: [''],
      address: [''],
      country: [''],
      state: [''],
      city: [''],
      zipCode: [''],
      holdDate: [''],
      remindBeforeDays: [0, [Validators.min(0)]],
      releaseDate: [{ value: '', disabled: true }],
      releaseTime: [{ value: '', disabled: true }],
      remindDaysBeforeRelease: [{ value: 0, disabled: true }, [Validators.min(0)]]
    });
  }

  private getCombinedReleaseDateTime(): string | null {
    const date = this.reservationForm.get('releaseDate')?.value;
    const time = this.reservationForm.get('releaseTime')?.value;

    if (!date) return null;

    const combinedDate = new Date(date);

    if (time) {
      const [hours, minutes] = time.split(':');
      combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      combinedDate.setHours(0, 0, 0, 0);
    }

    return this.datePipe.transform(combinedDate, "yyyy-MM-dd'T'HH:mm:ss") || null;
  }

  private subscribeToDateChanges(): void {

    this.reservationForm.get('checkIn')?.valueChanges.subscribe(() => {
      this.clearAllRoomSelections();
      this.loadAvailableRooms();
    });

    this.reservationForm.get('checkOut')?.valueChanges.subscribe(() => {
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
        while (this.rooms.length > 1) {
          this.rooms.removeAt(this.rooms.length - 1);
        }

        this.availableRoomsByIndex.clear();
        this.updateNumberOfRooms();

        if (this.rooms.length > 1) {
          this.showSuccess('Additional rooms removed. Only the first room remains.');
        }
      }
    });
  }

  toggleDiscountType(): void {
    const currentValue = this.reservationForm.get('discount')?.value || 0;

    if (this.discountType === 'percentage') {
      this.discountType = 'amount';
      const discountAmount = (this.billingSummary.roomCharges * currentValue) / 100;
      this.reservationForm.patchValue({
        discount: discountAmount,
        discountType: 'amount'
      });
    } else {
      this.discountType = 'percentage';
      const discountPercent = this.billingSummary.roomCharges > 0
        ? (currentValue / this.billingSummary.roomCharges) * 100
        : 0;
      this.reservationForm.patchValue({
        discount: Math.min(discountPercent, 100),
        discountType: 'percentage'
      });
    }
  }

  toggleDiscountField(): void {
    this.showDiscountField = !this.showDiscountField;
    if (this.showDiscountField) {
      this.discountType = 'percentage';
      this.reservationForm.patchValue({
        discount: 0,
        discountType: 'percentage'
      });
    }
  }

  removeDiscount(): void {
    this.reservationForm.patchValue({
      discount: 0,
      discountType: 'percentage'
    });
    this.showDiscountField = false;
    this.discountType = 'percentage';
  }

  toggleAdvanceField(): void {
    this.showAdvanceField = !this.showAdvanceField;
    if (this.showAdvanceField) {
      this.reservationForm.get('advance')?.enable();
    }
  }

  removeAdvance(): void {
    this.reservationForm.patchValue({ advance: 0 });
    this.showAdvanceField = false;
  }


  private subscribeToReservationTypeChanges(): void {
    this.reservationForm.get('reservationType')?.valueChanges.subscribe((reservationType) => {
      const holdReservationControl = this.reservationForm.get('isOnHold');
      const releaseDateControl = this.reservationForm.get('releaseDate');
      const releaseTimeControl = this.reservationForm.get('releaseTime');
      const remindBeforeDaysControl = this.reservationForm.get('remindDaysBeforeRelease');

      if (reservationType === 'CONFIRMED') {
        holdReservationControl?.disable();
        holdReservationControl?.setValue(false);

        releaseDateControl?.disable();
        releaseDateControl?.setValue('');
        releaseTimeControl?.disable();
        releaseTimeControl?.setValue('');
        remindBeforeDaysControl?.disable();
        remindBeforeDaysControl?.setValue(0);
      } else {
        holdReservationControl?.enable();
      }
    });
  }

  private subscribeToHoldReservationChanges(): void {
    this.reservationForm.get('isOnHold')?.valueChanges.subscribe((isHoldReservation) => {
      const releaseDateControl = this.reservationForm.get('releaseDate');
      const releaseTimeControl = this.reservationForm.get('releaseTime');
      const remindBeforeDaysControl = this.reservationForm.get('remindDaysBeforeRelease');

      if (isHoldReservation) {
        releaseDateControl?.enable();
        releaseTimeControl?.enable();
        remindBeforeDaysControl?.enable();
      } else {
        releaseDateControl?.disable();
        releaseDateControl?.setValue('');
        releaseTimeControl?.disable();
        releaseTimeControl?.setValue('');
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

    room.patchValue({
      roomNumber: '',
      rate: 0
    });
    this.fetchAvailableRoomsByType(roomType, index);
  }

  fetchAvailableRoomsByType(roomType: string, index: number): void {
    if (!this.propertyCode) {
      return;
    }

    const checkInDate = this.reservationForm.get('checkIn')?.value;
    const checkOutDate = this.reservationForm.get('checkOut')?.value;

    if (!checkInDate || !checkOutDate) {
      this.showError('Please select check-in and check-out dates first');
      const room = this.rooms.at(index);
      room.patchValue({ roomType: '' });
      return;
    }

    const formattedCheckIn = this.formatDate(checkInDate);
    const formattedCheckOut = this.formatDate(checkOutDate);

    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        this.availableRoomsByIndex.set(index, rooms);

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

    const availableRooms = this.getAvailableRoomsForIndex(index);
    const selectedRoom = availableRooms.find(room => room.id === selectedRoomId);

    if (selectedRoom && !roomGroup.get('manualRate')?.value) {
      roomGroup.patchValue({ rate: selectedRoom.basePrice });
    }
  }

  private loadGuestData(): void {
    if (!this.propertyCode) {
      return;
    }

    this.isLoadingGuests = true;

    this.guestService.getAllGuests(this.propertyCode).subscribe({
      next: (guests: Guest[]) => {
        this.allGuests = guests;
        this.isLoadingGuests = false;
      },
      error: () => {
        this.allGuests = [];
        this.isLoadingGuests = false;
        this.showError('Failed to load guest data');
      }
    });
  }

  private setupGuestAutocomplete(): void {
    this.filteredGuests$ = this.reservationForm.get('guestName')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => this._filterGuests(value || ''))
    );
  }

  private _filterGuests(value: string): Guest[] {
    if (typeof value === 'object') {
      return [];
    }

    if (!value || value.trim().length < 2) {
      return this.allGuests.slice(0, 10);
    }

    const filterValue = value.toLowerCase().trim();

    const filtered = this.allGuests.filter(guest =>
      guest.name.toLowerCase().includes(filterValue) ||
      guest.email.toLowerCase().includes(filterValue) ||
      guest.phone.includes(filterValue)
    );
    return filtered.slice(0, 15);
  }

  displayGuestName(guest: Guest | string): string {
    if (typeof guest === 'string') {
      return guest;
    }
    return guest ? guest.name : '';
  }

  onGuestSelected(event: any): void {
    const guest: Guest = event.option.value;

    if (!guest) {
      return;
    }

    let guestTitle = 'MR'; // Default title
    let guestName = guest.name || '';

    const titlePattern = /^(MR|MRS|MS|MISS|DR|PROF)\s*\.?\s*/i;
    const titleMatch = guestName.match(titlePattern);

    if (titleMatch) {
      const extractedTitle = titleMatch[1].toUpperCase();

      if (extractedTitle === 'MISS') {
        guestTitle = 'MS';
      } else {
        guestTitle = extractedTitle;
      }
      guestName = guestName.replace(titlePattern, '').trim();
    }

    this.reservationForm.patchValue({
      guestTitle: guestTitle,
      guestName: guestName,
      email: guest.email || '',
      mobile: guest.phone || '',
      address: guest.address || ''
    }, { emitEvent: false });

    this.showSuccess(`Guest information loaded for ${guestName}`);
  }

  clearGuestSelection(): void {
    this.reservationForm.patchValue({
      guestName: '',
      email: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    });
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

    const guestFullName = `${formValue.guestTitle}. ${formValue.guestName}`;

    const checkInDate = this.formatDate(formValue.checkIn);
    const checkOutDate = this.formatDate(formValue.checkOut);

    const reservationCategory = formValue.isGroupReservation ? 'GROUP' : 'INDIVIDUAL';
    const isGroupReservationNumeric = formValue.isGroupReservation ? 1 : 0;

    const rawFormValue = this.reservationForm.getRawValue();
    const sendVoucher = rawFormValue.confirmationVoucher ?? false;
    const formattedDateTime = this.getCombinedReleaseDateTime();

    return {
      name: guestFullName,
      email: formValue.email,
      phone: formValue.mobile,
      passportNic: formValue.passportNic,
      remark: formValue.remarks || '',
      address: formValue.address || '',
      city: formValue.city || '',
      state: formValue.state || '',
      country: formValue.country || '',
      zipCode: formValue.zipCode || '',

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
      discountPercentage: this.discountType === 'percentage' ? (formValue.discount || 0) : 0,
      discountAmount: this.billingSummary.discount,
      discountType: this.discountType,
      subtotal: this.billingSummary.roomCharges,
      totalAmount: this.billingSummary.totalAmount,
      advanceDeposit: formValue.advance || 0,
      balanceAmount: this.billingSummary.balanceAmount,
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

      const payload = this.transformFormData(this.reservationForm.value);

      this.reservationService.createGroupReservation(this.propertyCode, payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccess('Reservation created successfully!');

          setTimeout(() => {
            this.router.navigate(['/reservations/all']);
          }, 1500);

          this.reservationForm.reset();
          this.initForm();
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
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

  onTimePickerIconClick(picker: any): void {
    const releaseTimeControl = this.reservationForm.get('releaseTime');

    if (releaseTimeControl && !releaseTimeControl.disabled) {
      picker.open();
    }
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

    // Calculate discount based on type
    const discountValue = formValue.discount || 0;

    if (this.discountType === 'percentage') {
      // Calculate discount from percentage
      this.billingSummary.discount = (this.billingSummary.roomCharges * discountValue) / 100;
    } else {
      // Use discount amount directly
      this.billingSummary.discount = discountValue;
    }

    // Calculate total with discount and taxes
    this.billingSummary.totalAmount = this.billingSummary.roomCharges - this.billingSummary.discount + this.billingSummary.taxes;

    // Calculate advance payment
    const advancePayment = formValue.advance || 0;
    this.billingSummary.advancePayment = advancePayment;

    // Calculate balance due
    this.billingSummary.balanceAmount = this.billingSummary.totalAmount - advancePayment;
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
