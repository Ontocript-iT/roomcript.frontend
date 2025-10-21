import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ReservationListComponent } from './features/reservations/reservation-list/reservation-list.component';
import { RoomListComponent } from './features/rooms/room-list/room-list';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'rooms', 
    component: RoomListComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'reservations', 
    component: ReservationListComponent,
    canActivate: [authGuard]
  }
];
