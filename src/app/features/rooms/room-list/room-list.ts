// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatTableModule } from '@angular/material/table';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatChipsModule } from '@angular/material/chips';
// import { Router } from '@angular/router';
// import { RoomService } from '../../../core/services/room.service';
// import { Room } from '../../../core/models/room.model';

// @Component({
//   selector: 'app-room-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatTableModule,
//     MatButtonModule,
//     MatIconModule,
//     MatChipsModule
//   ],
//   templateUrl: './room-list.html',
//   styleUrls: ['./room-list.scss']
// })
// export class RoomListComponent implements OnInit {
//   rooms: Room[] = [];
//   displayedColumns: string[] = ['roomNumber', 'roomType', 'price', 'status', 'actions'];

//   constructor(
//     private roomService: RoomService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.loadRooms();
//   }

//   loadRooms(): void {
//     this.roomService.getRooms().subscribe({
//       next: (data) => {
//         this.rooms = data;
//       },
//       error: (err) => {
//         console.error('Error loading rooms', err);
//       }
//     });
//   }

//   addRoom(): void {
//     this.router.navigate(['/rooms/new']);
//   }

//   editRoom(id: number): void {
//     this.router.navigate(['/rooms/edit', id]);
//   }

//   deleteRoom(id: number): void {
//     if (confirm('Are you sure you want to delete this room?')) {
//       this.roomService.deleteRoom(id).subscribe({
//         next: () => {
//           this.loadRooms();
//         },
//         error: (err) => {
//           console.error('Error deleting room', err);
//         }
//       });
//     }
//   }

//   getStatusColor(status: string): string {
//     switch (status) {
//       case 'AVAILABLE': return 'primary';
//       case 'OCCUPIED': return 'warn';
//       case 'MAINTENANCE': return 'accent';
//       default: return '';
//     }
//   }
// }
