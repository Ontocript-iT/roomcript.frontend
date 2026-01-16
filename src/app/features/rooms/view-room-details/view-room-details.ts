import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';

export interface ViewRoomDialogData {
  room: any; // Room object
}

@Component({
  selector: 'app-view-room-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  providers: [DatePipe],
  templateUrl: './view-room-details.html',
  styleUrl: './view-room-details.scss'
})
export class ViewRoomDetailsComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ViewRoomDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewRoomDialogData,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    console.log('Room data:', this.data.room);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'status-available',
      'OCCUPIED': 'status-occupied',
      'MAINTENANCE': 'status-maintenance',
      'CLEANING': 'status-cleaning',
      'OUT_OF_ORDER': 'status-out-of-order'
    };
    return statusMap[status] || 'status-available';
  }

}
