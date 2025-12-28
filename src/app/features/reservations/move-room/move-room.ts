import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoomService } from '../../../core/services/room.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface AvailableRoomOption {
  roomId: number;
  roomNumber: string;
  roomType: string;
}

interface AvailableRooms {
  roomType: string;
  availableCount: number;
  totalCount?: number;
  reservedCount?: number;
  basePrice?: number;
}

@Component({
  selector: 'app-move-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './move-room.html',
  styleUrls: ['./move-room.scss']
})
export class MoveRoomComponent implements OnInit, OnDestroy {
  @Input() currentRoom: any;
  @Input() reservationId: number = 0;
  @Input() checkInDate: Date = new Date();
  @Input() checkOutDate: Date = new Date();
  @Input() propertyCode: string = '';
  @Output() roomMoved = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  moveRoomForm: FormGroup;
  availableRoomTypes: AvailableRooms[] = [];
  availableRooms: AvailableRoomOption[] = [];
  loadingRoomTypes = false;
  loadingRooms = false;
  submitting = false;
  errorMessage = '';
  isSuccess = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private reservationService: ReservationService
  ) {
    this.moveRoomForm = this.fb.group({
      roomType: ['', Validators.required],
      roomNumber: ['', Validators.required],
      adults: [0, [Validators.required, Validators.min(0)]],
      children: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    console.log('MoveRoomComponent initialized with:', {
      currentRoom: this.currentRoom,
      reservationId: this.reservationId,
      propertyCode: this.propertyCode,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate
    });

    // Pre-fill form with current room data
    if (this.currentRoom) {
      this.moveRoomForm.patchValue({
        roomType: this.currentRoom.roomType,
        adults: this.currentRoom.numberOfAdults || 0,
        children: this.currentRoom.numberOfChildren || 0
      });
    }

    this.loadAvailableRoomTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    if (!this.checkInDate || !this.checkOutDate) {
      console.error('Check-in or Check-out date is missing');
      return;
    }

    const formattedCheckIn = this.formatDate(this.checkInDate);
    const formattedCheckOut = this.formatDate(this.checkOutDate);

    this.loadingRoomTypes = true;

    // Use the exact method from RoomService
    this.roomService.getAvailableRoomsCount(
      this.propertyCode,
      formattedCheckIn,
      formattedCheckOut
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roomTypes: AvailableRooms[]) => {
          // Map to include all room types with their available counts
          this.availableRoomTypes = roomTypes.map(room => ({
            roomType: room.roomType,
            availableCount: room.availableCount || 0,
            totalCount: room.totalCount || 0,
            reservedCount: room.reservedCount || 0,
            basePrice: room.basePrice || 0
          }));

          console.log('✅ Loaded available room types:', this.availableRoomTypes);

          // Auto-load rooms for current room type
          if (this.currentRoom && this.currentRoom.roomType) {
            this.loadAvailableRoomsByType(this.currentRoom.roomType);
          }

          this.loadingRoomTypes = false;
        },
        error: (error) => {
          console.error('❌ Error loading room types:', error);
          this.availableRoomTypes = [];
          this.loadingRoomTypes = false;
          this.showError('Failed to load available room types', false);
        }
      });
  }

  onRoomTypeChange(): void {
    const roomType = this.moveRoomForm.get('roomType')?.value;
    if (!roomType) return;

    this.moveRoomForm.get('roomNumber')?.reset();
    this.loadAvailableRoomsByType(roomType);
  }

  loadAvailableRoomsByType(roomType: string): void {
    if (!this.propertyCode) {
      console.error('Property code is missing');
      return;
    }

    if (!this.checkInDate || !this.checkOutDate) {
      console.error('Check-in or Check-out date is missing');
      return;
    }

    const formattedCheckIn = this.formatDate(this.checkInDate);
    const formattedCheckOut = this.formatDate(this.checkOutDate);

    this.loadingRooms = true;

    // Use the exact method from RoomService
    this.roomService.getAvailableRoomsByType(
      this.propertyCode,
      roomType,
      formattedCheckIn,
      formattedCheckOut
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rooms: any[]) => {
          this.availableRooms = rooms.map(r => ({
            roomId: r.id || r.roomId,
            roomNumber: r.roomNumber,
            roomType: r.roomType
          }));

          // Filter out the current room from available rooms
          if (this.currentRoom && this.currentRoom.roomId) {
            this.availableRooms = this.availableRooms.filter(
              r => r.roomId !== this.currentRoom.roomId
            );
          }

          console.log('✅ Loaded available rooms for type', roomType, ':', this.availableRooms);
          this.loadingRooms = false;
        },
        error: (error) => {
          console.error('❌ Error loading rooms:', error);
          this.availableRooms = [];
          this.loadingRooms = false;
          this.showError('Failed to load available rooms', false);
        }
      });
  }

  onSubmit(): void {
    if (this.moveRoomForm.invalid) {
      console.log('Form is invalid:', this.moveRoomForm.errors);
      return;
    }

    this.submitting = true;
    this.clearError();

    const formValue = this.moveRoomForm.value;
    const selectedRoomId = formValue.roomNumber;

    const moveRoomData = {
      reservationId: this.reservationId,
      roomConfirmationNumber: this.currentRoom.confirmationNumber,
      roomId: selectedRoomId,
      roomType: formValue.roomType,
      numberOfAdults: formValue.adults,
      numberOfChildren: formValue.children
    };

    console.log('🔄 Moving room with data:', moveRoomData);

    this.reservationService.moveExistingRoom(moveRoomData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Room moved successfully:', response);
          this.showError('Room moved successfully!', true);

          setTimeout(() => {
            this.roomMoved.emit(response);
            this.moveRoomForm.reset();
          }, 1500);

          this.submitting = false;
        },
        error: (error) => {
          console.error('❌ Failed to move room:', error);
          let errorMessage = 'Failed to move room';
          if (error?.message) errorMessage = error.message;
          else if (error?.error?.error) errorMessage = error.error.error;

          this.showError(errorMessage, false);
          this.submitting = false;
        }
      });
  }

  onCancel(): void {
    this.moveRoomForm.reset();
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
