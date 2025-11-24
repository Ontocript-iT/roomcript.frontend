import { Component, Output, EventEmitter } from '@angular/core';
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

  ],
  styleUrls: ['./filter-reservation.scss']
})
export class FilterReservation {
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

  initForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      useResDate: [false],
      resStart: [''],
      resEnd: [''],
      useArrival: [false],
      arrivalStart: [''],
      arrivalEnd: [''],
      bookingSource: [''],
      roomType: [''],
      reservationType: [''],
      guestEmail: [''],
      guestPhone: ['']
    });
  }

  onSubmit(): void {
    const formValue = this.filterForm.value;

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

    const filterParams: Record<string, any> = {  // ← Use Record type
      status: formValue.status || undefined,
      startReservationDate: formValue.useResDate && formValue.resStart
        ? toYYYYMMDD(formValue.resStart)
        : undefined,
      endReservationDate: formValue.useResDate && formValue.resEnd
        ? toYYYYMMDD(formValue.resEnd)
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

    // Remove undefined values
    Object.keys(filterParams).forEach(key => {
      if (filterParams[key] === undefined) {
        delete filterParams[key];
      }
    });

    console.log('Emitting filter params:', filterParams);
    this.filterChanged.emit(filterParams);
  }
}
