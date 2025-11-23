import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ReservationListComponent } from './features/reservations/reservation-list/reservation-list.component';
import { PropertyAddComponent } from './features/property-management/create-property/property-add';
import { UserAddComponent } from './features/user-management/user-add/user-add';
import { UserAssign } from './features/user-management/user-assign/user-assign';
import { PropertyList } from './features/property-management/property-list/property-list';
import { RoomCreate } from './features/rooms/room-create/room-create';
import {ReservationFormComponent} from './features/reservations/reservation-form/reservation-form.component';
import {CheckinCheckoutComponent} from './features/reservations/checkin-checkout/checkin-checkout';

import {GuestListComponent} from './features/guest-management/guest-list/guest-list';

import { StayView } from './features/stay-view/stay-view';




export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  // {
  //   path: 'rooms',
  //   component: RoomListComponent,
  //   canActivate: [authGuard]
  // },
  {
    path: 'reservations',
    component: ReservationListComponent,
    canActivate: [authGuard]
  },
    {
    path: 'addReservation',
    component: ReservationFormComponent,
    canActivate: [authGuard]
  },
      {
    path: 'checkin-checkout',
    component: CheckinCheckoutComponent,
    canActivate: [authGuard]
  },
  {
    path: 'users/addUser',
    component: UserAddComponent,
    canActivate: [authGuard]
  },
  {
    path: 'createProperty',
    component: PropertyAddComponent,
    canActivate: [authGuard]
  },
  {
    path: 'users/all',
    component: UserAssign,
    canActivate: [authGuard]
  },
  {
    path: 'propertyList',
    component: PropertyList,
    canActivate: [authGuard]
  }
  ,
  {
    path: 'roomCreate',
    component: RoomCreate,
    canActivate: [authGuard]
  },
    {
    path: 'stayView',
    component: StayView,
    canActivate: [authGuard]
  }
  ,
  {
    path: 'guest/list',
    component: GuestListComponent,
    canActivate: [authGuard]
  }


];
