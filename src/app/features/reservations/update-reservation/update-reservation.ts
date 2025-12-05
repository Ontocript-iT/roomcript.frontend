import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatCheckbox} from '@angular/material/checkbox';

@Component({
  selector: 'app-update-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckbox,
  ],
  templateUrl: './update-reservation.html',
  styleUrls: ['./update-reservation.scss']
})
export class UpdateReservation implements OnInit {
  updateReservationForm!: FormGroup;
  isLoading = false;
  showDiscountField = false;
  propertyCode = localStorage.getItem("propertyCode") || '';
  availableRoomsByIndex: Map<number, any[]> = new Map();
  private originalCheckInDate!: Date;
  private originalCheckOutDate!: Date;

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

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private roomService: RoomService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UpdateReservation>,
    @Inject(MAT_DIALOG_DATA) public data: { reservation: Reservation }
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableRooms();
    this.populateForm();
    this.subscribeToGroupReservationChange();
  }

  initForm(): void {
    this.updateReservationForm = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      numberOfRooms: [{ value: 1, disabled: true }, [Validators.required, Validators.min(1)]],
      reservationType: ['', Validators.required],
      bookingSource: ['', Validators.required],
      rooms: this.fb.array([this.createRoomGroup()]),
      isGroupReservation: [false],
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

  get canAddRoom(): boolean {
    return this.updateReservationForm.get('isGroupReservation')?.value === true;
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

  populateForm(): void {
    if (this.data.reservation) {
      const res = this.data.reservation;

      this.originalCheckInDate = new Date(res.checkInDate);
      this.originalCheckOutDate = new Date(res.checkOutDate);

      // Parse guest name to extract title
      const guestTitle = res.name?.startsWith('MR.') ? 'MR' :
        res.name?.startsWith('MRS.') ? 'MRS' :
          res.name?.startsWith('MS.') ? 'MS' : 'MR';
      const guestName = res.name?.replace(/^(MR\.|MRS\.|MS\.)\s*/i, '') || '';

      const isGroupReservation = res.roomCount && res.roomCount > 1;

      this.updateReservationForm.patchValue({
        checkIn: this.originalCheckInDate,
        checkOut: this.originalCheckOutDate,
        numberOfRooms: res.roomCount || 1,
        reservationType: res.reservationType ,
        bookingSource: res.bookingSource ,
        isGroupReservation: isGroupReservation,
        guestTitle: guestTitle,
        guestName: guestName,
        mobile: res.phone || '',
        email: res.email || '',
        address: res.address || '',
        country: res.country || '',
        state: res.state || '',
        city: res.city || '',
        zipCode: res.zipCode || '',
      });

      console.log('Address fields loaded:', {
        country: res.country,
        state: res.state,
        city: res.city,
        zipCode: res.zipCode
      });
      // Populate rooms
      if (res.roomDetails && res.roomDetails.length > 0) {
        this.rooms.clear();

        res.roomDetails.forEach((room, index) => {
          const roomGroup = this.createRoomGroup();

          roomGroup.patchValue({
            roomType: room.roomType || '',
            adults: room.numberOfAdults ?? 1,
            children: room.numberOfChildren ?? 0,
            rate: room.roomRate || 0,
            manualRate: false
          });

          this.rooms.push(roomGroup);

          // Pass current room info to include it in available list
          if (room.roomType && room.roomId && room.roomNumber) {
            this.fetchAvailableRoomsByType(room.roomType, index, {
              id: room.roomId,
              roomNumber: room.roomNumber,
              basePrice: room.roomRate || 0,
              roomType: room.roomType,
              price: room.roomRate || 0,
              status: 'AVAILABLE',
              propertyId: 0,
              propertyCode: this.propertyCode || null
            });
          }
        });
      }
    }
  }

  fetchAvailableRoomsByType(roomType: string, index: number, currentRoom?: Room): void {
    if (!this.propertyCode) {
      return;
    }
    if (!this.originalCheckInDate || !this.originalCheckOutDate) {
      return;
    }

    const formattedCheckIn = this.formatDate(this.originalCheckInDate);
    const formattedCheckOut = this.formatDate(this.originalCheckOutDate);

    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        let list = rooms || [];

        // Add current assigned room if missing
        if (currentRoom) {
          const exists = list.some(r => Number(r.id) === Number(currentRoom.id));
          if (!exists) {
            list = [
              ...list,
              currentRoom
            ];
          }
        }

        this.availableRoomsByIndex.set(index, list);

        // Set the room number in the form control to display selection
        const roomGroup = this.rooms.at(index);
        if (roomGroup && currentRoom) {
          roomGroup.patchValue({
            roomNumber: Number(currentRoom.id)
          });
        }
      },
      error: (error) => {
        this.availableRoomsByIndex.set(index, []);
        this.showError(`Failed to load available rooms for ${roomType}`);
      }
    });
  }

  private formatDateToDisplay(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // Get last 2 digits of year
    return `${month}/${day}/${year}`;
  }

  loadAvailableRooms(): void {
    if (!this.propertyCode) {
      return;
    }
    const res = this.data.reservation;

    this.originalCheckInDate = new Date(res.checkInDate);
    this.originalCheckOutDate = new Date(res.checkOutDate);

    if (!this.originalCheckInDate || !this.originalCheckOutDate) {
      return;
    }

    // Format dates to YYYY-MM-DD
    const formattedCheckIn = this.formatDate(this.originalCheckInDate);
    const formattedCheckOut = this.formatDate(this.originalCheckOutDate);

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

  onRoomTypeChange(index: number): void {
    const room = this.rooms.at(index);
    const roomType = room.get('roomType')?.value;

    if (!roomType) return;

    // Clear room number and rate when type changes
    room.patchValue({
      roomNumber: '',
      rate: 0
    });

    this.fetchAvailableRoomsByType(roomType, index);
  }

  private subscribeToGroupReservationChange(): void {
    this.updateReservationForm.get('isGroupReservation')?.valueChanges.subscribe((isGroupReservation) => {
      if (!isGroupReservation) {
        // When unchecked, remove all rooms except the first one
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

  get rooms(): FormArray {
    return this.updateReservationForm.get('rooms') as FormArray;
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
    this.updateReservationForm.patchValue(
      { numberOfRooms: roomCount },
      { emitEvent: false }
    );
  }

  incrementRooms(): void {
    const current = this.updateReservationForm.get('numberOfRooms')?.value || 0;
    this.updateReservationForm.patchValue({ numberOfRooms: current + 1 });
  }

  decrementRooms(): void {
    const current = this.updateReservationForm.get('numberOfRooms')?.value || 0;
    if (current > 1) {
      this.updateReservationForm.patchValue({ numberOfRooms: current - 1 });
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

  getAvailableRoomsForIndex(index: number): any[] {
    const rooms = this.availableRoomsByIndex.get(index);
    return Array.isArray(rooms) ? rooms : [];
  }

  onRoomSelect(index: number): void {
    const roomsArray = this.updateReservationForm.get('rooms') as FormArray;
    const roomGroup = roomsArray.at(index);
    const selectedRoomId = roomGroup.get('roomNumber')?.value;

    // Get available rooms for this index
    const availableRooms = this.getAvailableRoomsForIndex(index);
    const selectedRoom = availableRooms.find(room => room.id === selectedRoomId);

    if (selectedRoom && !roomGroup.get('manualRate')?.value) {
      roomGroup.patchValue({ rate: selectedRoom.basePrice });
    }
  }

  onSubmit(): void {
    if (this.updateReservationForm.valid) {
      this.isLoading = true;

      const payload = this.transformFormData(this.updateReservationForm.value);

      this.reservationService.updateReservation(this.data.reservation.id!, payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccess('Reservation updated successfully!');
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.updateReservationForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  private transformFormData(formValue: any): any {
    let totalAdults = 0;
    let totalChildren = 0;
    const roomIds: number[] = [];
    const roomGuests: any[] = [];
    let totalAmount = 0;

    // Calculate total from room rates and guest counts
    formValue.rooms.forEach((room: any) => {
      const roomId = parseInt(room.roomNumber, 10);
      const roomRate = parseFloat(room.rate) || 0;
      const adults = room.adults || 0;
      const children = room.children || 0;

      totalAdults += adults;
      totalChildren += children;
      roomIds.push(roomId);

      roomGuests.push({
        roomId: roomId,
        numberOfAdults: adults,
        numberOfChildren: children
      });

      // Add room rate to total (assuming rate is per room per night)
      totalAmount += roomRate;
    });

    // Apply discount if present
    const discountPercent = parseFloat(formValue.discount) || 0;
    const discountAmount = totalAmount * (discountPercent / 100);
    const finalTotalAmount = totalAmount - discountAmount;

    const guestFullName = `${formValue.guestTitle}. ${formValue.guestName}`;
    const checkInDate = this.formatDate(formValue.checkIn);
    const checkOutDate = this.formatDate(formValue.checkOut);

    return {
      name: guestFullName,
      email: formValue.email,
      phone: formValue.mobile,
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
      reservationType: formValue.reservationType,
      bookingSource: formValue.bookingSource,
      totalAmount: Math.round(finalTotalAmount * 100) / 100, // Round to 2 decimal places
      discount: discountPercent,
      discountAmount: Math.round(discountAmount * 100) / 100,
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

  toggleDiscountField(): void {
    this.showDiscountField = !this.showDiscountField;
  }

  removeDiscount(): void {
    this.updateReservationForm.patchValue({ discount: 0 });
    this.showDiscountField = false;
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

  private handleError(error: any): void {
    console.error('Error updating reservation:', error);
    const errorMessage = error.error?.message || error.message || 'Failed to update reservation';
    this.showError(errorMessage);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
