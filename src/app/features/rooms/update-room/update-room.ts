import {Component, Inject, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoomService } from '../../../core/services/room.service';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyResponse } from '../../../core/models/property.model';
import { Room } from '../../../core/models/room.model';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-update-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './update-room.html',
  styleUrls: ['./update-room.scss']
})
export class UpdateRoom implements OnInit {
  roomForm!: FormGroup;
  properties: PropertyResponse[] = [];
  isLoading = false;
  isLoadingRoom = true;
  roomId!: number;
  selectedPropertyCode: string = '';

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private propertyService: PropertyService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { room: Room },
    private dialogRef: MatDialogRef<UpdateRoom>
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadProperties();
    this.patchRoomData();
  }

  initializeForm(): void {
    this.roomForm = this.fb.group({
      propertyCode: ['', Validators.required],
      roomNumber: ['', Validators.required],
      roomType: ['', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      floor: [1, Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      maxAdults: [1, Validators.required],
      maxChildren: [0, Validators.required],
      bedType: ['', Validators.required],
      smokingAllowed: [false],
      hasBalcony: [false],
      hasSeaView: [false],
      amenities: ['', Validators.required],
      remarks: ['']
    });
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.showError('Failed to load properties');
      }
    });
  }

  private patchRoomData(): void {
    const room = this.data.room;
    const propertyCode = room.propertyCode || localStorage.getItem('propertyCode') || '';
    this.selectedPropertyCode = propertyCode;

    this.roomForm.patchValue({
      propertyCode: propertyCode,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      basePrice: room.basePrice,
      description: room.description,
      floor: room.floor,
      capacity: room.capacity,
      maxAdults: room.maxAdults ?? 1,
      maxChildren: room.maxChildren ?? 0,
      bedType: room.bedType,
      smokingAllowed: room.smokingAllowed,
      hasBalcony: room.hasBalcony,
      hasSeaView: room.hasSeaView,
      amenities: room.amenities,
      remarks: room.remarks || ''
    });

    this.isLoadingRoom = false;
  }

  toggleCheckbox(controlName: string): void {
    const control = this.roomForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  onSubmit(): void {
    const roomId = this.data.room.id;
    console.log('🔍 Submit - roomId:', roomId);
    if (this.roomForm.valid) {
      this.isLoading = true;
      const roomData = this.roomForm.getRawValue();

      this.roomService.updateRoom(roomId, roomData).subscribe({
        next: (response) => {
          this.showSuccess('Room updated successfully!');
          this.isLoading = false;
          this.router.navigate(['/rooms/all']);
        },
        error: (error) => {
          console.error('Error updating room:', error);
          this.showError('Failed to update room. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
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
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
