import {Component, Output, EventEmitter, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {CommonModule} from '@angular/common';
import {of} from 'rxjs';
import {MatInputModule} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-filter-reservation',
  templateUrl: './filter-reservation.html',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatCheckbox,
    MatFormFieldModule,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatSelectModule,
    MatDatepickerInput,
    CommonModule,
    MatInputModule,
    MatButton,
    MatIconModule
  ],
  styleUrls: ['./filter-reservation.scss']
})
export class FilterReservation implements OnInit{
  @Output() filterChanged = new EventEmitter<any>();

  filterForm!: FormGroup;

  statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CHECKED_IN', label: 'Checked In' },
    { value: 'CHECKED_OUT', label: 'Checked Out' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No Show' }
  ];

  sourceOptions = [
    { value: 'Direct', label: 'Direct' },
    { value: 'Booking.com', label: 'Booking.com' },
    { value: 'Airbnb', label: 'Airbnb' },
    { value: 'Expedia', label: 'Expedia' },
    { value: 'Other', label: 'Other' }
  ];

  roomTypeOptions = [
    { value: 'Standard', label: 'Standard Room' },
    { value: 'Deluxe', label: 'Deluxe Room' },
    { value: 'Superior-Deluxe', label: 'Superior Deluxe Room' },
    { value: 'Suite', label: 'Suite Room' },
    { value: 'Double', label: 'Double Room' },
    { value: 'Twin', label: 'Twin Room' },
    { value: 'Quadruple', label: 'Quadruple Room' }
  ];

  reservationTypeOptions = [
    { value: 'CONFIRMED', label: 'Confirm Booking' },
    { value: 'UNCONFIRMED', label: 'Unconfirm Booking' },
    { value: 'FAILED', label: 'Online Failed Booking' },
    { value: 'HOLD-CONFIRMED', label: 'Hold Confirm Booking' },
    { value: 'HOLD-UNCONFIRMED', label: 'Hold Unconfirm Booking' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setupCheckboxListeners();
  }

  initForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      useResDate: [false],
      resStart: [{ value: '', disabled: true }],
      resEnd: [{ value: '', disabled: true }],
      useArrival: [false],
      arrivalStart: [{ value: '', disabled: true }],
      arrivalEnd: [{ value: '', disabled: true }],
      bookingSource: [''],
      roomType: [''],
      reservationType: [''],
      guestEmail: [''],
      guestPhone: ['']
    });
  }

  private setupCheckboxListeners(): void {
    // Listen to Reservation Date checkbox changes
    this.filterForm.get('useResDate')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.filterForm.get('resStart')?.enable();
        this.filterForm.get('resEnd')?.enable();
      } else {
        this.filterForm.get('resStart')?.disable();
        this.filterForm.get('resEnd')?.disable();
        // Clear values when disabled
        this.filterForm.patchValue({
          resStart: '',
          resEnd: ''
        }, { emitEvent: false });
      }
    });

    this.filterForm.get('useArrival')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.filterForm.get('arrivalStart')?.enable();
        this.filterForm.get('arrivalEnd')?.enable();
      } else {
        this.filterForm.get('arrivalStart')?.disable();
        this.filterForm.get('arrivalEnd')?.disable();

        this.filterForm.patchValue({
          arrivalStart: '',
          arrivalEnd: ''
        }, { emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    const formValue = this.filterForm.getRawValue();

    const toYYYYMMDD = (date: any): string | undefined => {
      if (!date) return undefined;
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      const d = new Date(date);
      if (isNaN(d.getTime())) return undefined;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toTimestamp = (date: any): string | undefined => {
      if (!date) return undefined;
      const d = new Date(date);
      if (isNaN(d.getTime())) return undefined;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00`;  // ← Added timestamp
    };

    const filterParams: Record<string, any> = {
      status: formValue.status || undefined,
      startReservationDate: formValue.useResDate && formValue.resStart
        ? toTimestamp(formValue.resStart)  // ← Changed to toTimestamp
        : undefined,
      endReservationDate: formValue.useResDate && formValue.resEnd
        ? toTimestamp(formValue.resEnd)    // ← Changed to toTimestamp
        : undefined,
      startCheckInDate: formValue.useArrival && formValue.arrivalStart
        ? toYYYYMMDD(formValue.arrivalStart)
        : undefined,
      endCheckInDate: formValue.useArrival && formValue.arrivalEnd
        ? toYYYYMMDD(formValue.arrivalEnd)
        : undefined,
      bookingSource: formValue.bookingSource || undefined,
      roomType: formValue.roomType || undefined,
      reservationType: formValue.reservationType || undefined,
      guestEmail: formValue.guestEmail || undefined,
      guestPhone: formValue.guestPhone || undefined
    };

    Object.keys(filterParams).forEach(key => {
      if (filterParams[key] === undefined) {
        delete filterParams[key];
      }
    });

    this.filterChanged.emit(filterParams);
  }

  onClear(): void {
    this.filterForm.reset({
      status: '',
      useResDate: false,
      resStart: '',
      resEnd: '',
      useArrival: false,
      arrivalStart: '',
      arrivalEnd: '',
      bookingSource: '',
      roomType: '',
      reservationType: '',
      guestEmail: '',
      guestPhone: ''
    });

    this.filterForm.get('resStart')?.disable();
    this.filterForm.get('resEnd')?.disable();
    this.filterForm.get('arrivalStart')?.disable();
    this.filterForm.get('arrivalEnd')?.disable();

    this.filterChanged.emit({});
  }
}
