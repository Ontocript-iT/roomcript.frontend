import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';

// Services
import { RoomService, CreateRoomRequest } from '../../../core/services/room.service';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyResponse } from '../../../core/models/property.model';

@Component({
  selector: 'app-room-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  templateUrl: './room-create.html',
  styleUrls: ['./room-create.scss']
})
export class RoomCreate implements OnInit, OnDestroy {
  roomForm!: FormGroup;
  isLoading = false;

  // Property autocomplete properties
  properties: PropertyResponse[] = [];
  propertyControl = new FormControl();
  filteredProperties!: Observable<PropertyResponse[]>;
  private _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private roomService: RoomService,
    private propertyService: PropertyService // Add PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadProperties();
    this.setupPropertyAutocomplete();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initializeForm(): void {
    this.roomForm = this.fb.group({
      propertyCode: ['', [Validators.required]], // Hidden field for property code
      roomNumber: ['', [Validators.required]],
      roomType: ['', [Validators.required]],
      basePrice: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required]],
      floor: ['', [Validators.required, Validators.min(0)]],
      capacity: ['', [Validators.required, Validators.min(1)]],
      maxAdults: ['', [Validators.required, Validators.min(0)]],
      maxChildren: ['', [Validators.required, Validators.min(0)]],
      bedType: ['', [Validators.required]],
      smokingAllowed: [false],
      hasBalcony: [false],
      hasSeaView: [false],
      amenities: ['', [Validators.required]],
      remarks: ['']
    });
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties: PropertyResponse[]) => {
        this.properties = properties;
      },
      error: (error) => {
        this.showError('Failed to load properties');
      }
    });
  }

  setupPropertyAutocomplete(): void {
    this.filteredProperties = this.propertyControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.propertyName;
        return name ? this._filter(name as string) : this.properties.slice();
      }),
      takeUntil(this._onDestroy)
    );
  }

  private _filter(name: string): PropertyResponse[] {
    const filterValue = name.toLowerCase();
    return this.properties.filter(property =>
      property.propertyName.toLowerCase().includes(filterValue) ||
      property.propertyCode.toLowerCase().includes(filterValue)
    );
  }

  toggleCheckbox(controlName: string): void {
    const control = this.roomForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  onSubmit(): void {
    if (this.roomForm.valid) {
      this.isLoading = true;

      const propertyCode = this.roomForm.get('propertyCode')?.value;

      const roomData: CreateRoomRequest = this.roomForm.value;

      this.roomService.createRoom(roomData, propertyCode).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccess('Room created successfully!');

          this.roomForm.reset({
            propertyCode: '',
            smokingAllowed: false,
            hasBalcony: false,
            hasSeaView: false
          });
          setTimeout(() => {
            this.router.navigate(['/rooms/all']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.roomForm);
      this.showError('Please fill all required fields correctly');
    }
  }

  onCancel(): void {
    if (this.roomForm.dirty || this.propertyControl.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        this.router.navigate(['/rooms/create']);
      }
    } else {
      this.router.navigate(['/rooms/all']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
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

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private handleError(error: any): void {
    let errorMessage = 'An error occurred while creating the room';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 409) {
      errorMessage = 'Room number already exists';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid data provided';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    console.error('Error creating room:', error);
  }
}
