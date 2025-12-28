import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoomService } from '../../../core/services/room.service';
import { ReservationService } from '../../../core/services/reservation.service';

interface AvailableRoomOption {
  roomId: number;
  roomNumber: string;
  roomType: string;
}

@Component({
  selector: 'app-assign-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './assign-room.html',
  styleUrls: ['./assign-room.scss']
})
export class AssignRoomComponent implements OnInit {
  @Input() reservationId: number = 0;
  @Input() checkInDate: Date = new Date();
  @Input() checkOutDate: Date = new Date();
  @Input() propertyCode: string = '';
  @Output() roomAssigned = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  assignRoomForm: FormGroup;
  availableRoomTypes: any[] = [];
  availableRooms: AvailableRoomOption[] = [];
  loadingRooms = false;
  submitting = false;
  errorMessage = '';
  isSuccess = false;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private reservationService: ReservationService
  ) {
    this.assignRoomForm = this.fb.group({
      roomType: ['', Validators.required],
      roomNumber: ['', Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      adults: [0, [Validators.required, Validators.min(0)]],
      children: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    console.log('AssignRoomComponent initialized:', {
      reservationId: this.reservationId,
      propertyCode: this.propertyCode,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate
    });
    this.loadAvailableRoomTypes();
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadAvailableRoomTypes(): void {
    if (!this.propertyCode) {
      console.error('Property code is missing');
      return;
    }

    const formattedCheckIn = this.formatDate(this.checkInDate);
    const formattedCheckOut = this.formatDate(this.checkOutDate);

    this.roomService.getAvailableRoomsCount(
      this.propertyCode,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms) => {
        this.availableRoomTypes = rooms.map(room => ({
          value: room.roomType,
          label: room.roomType,
          availableCount: room.availableCount || 0
        }));
      },
      error: (error) => {
        console.error('Error loading room types:', error);
        this.showError('Failed to load available room types', false);
      }
    });
  }

  onRoomTypeChange(): void {
    const roomType = this.assignRoomForm.get('roomType')?.value;
    if (!roomType) return;

    this.assignRoomForm.get('roomNumber')?.reset();
    this.loadAvailableRoomsByType(roomType);
  }

  loadAvailableRoomsByType(roomType: string): void {
    const formattedCheckIn = this.formatDate(this.checkInDate);
    const formattedCheckOut = this.formatDate(this.checkOutDate);

    this.loadingRooms = true;

    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).subscribe({
      next: (rooms: any[]) => {
        this.availableRooms = rooms.map(r => ({
          roomId: r.id || r.roomId,
          roomNumber: r.roomNumber,
          roomType: r.roomType
        }));
        this.loadingRooms = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.availableRooms = [];
        this.loadingRooms = false;
        this.showError('Failed to load available rooms', false);
      }
    });
  }

  onSubmit(): void {
    if (this.assignRoomForm.invalid) return;

    this.submitting = true;
    this.clearError();

    const formValue = this.assignRoomForm.value;
    const selectedRoomId = formValue.roomNumber;

    const assignmentData = {
      reservationId: this.reservationId,
      roomType: formValue.roomType,
      roomIds: [selectedRoomId],
      numberOfAdults: formValue.adults,
      numberOfChildren: formValue.children
    };

    this.reservationService.assignRooms(assignmentData).subscribe({
      next: (response) => {
        console.log('Room assigned successfully:', response);
        this.showError('Room assigned successfully!', true);

        setTimeout(() => {
          this.roomAssigned.emit(response);
          this.assignRoomForm.reset();
        }, 1500);

        this.submitting = false;
      },
      error: (error) => {
        console.error('Failed to assign room:', error);
        let errorMessage = 'Failed to assign room';
        if (error?.message) errorMessage = error.message;
        else if (error?.error?.error) errorMessage = error.error.error;

        this.showError(errorMessage, false);
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.assignRoomForm.reset();
    this.cancelled.emit();
  }

  showError(message: string, isSuccess: boolean): void {
    this.errorMessage = message;
    this.isSuccess = isSuccess;

    if (isSuccess) {
      setTimeout(() => this.clearError(), 3000);
    }
  }

  clearError(): void {
    this.errorMessage = '';
    this.isSuccess = false;
  }
}
