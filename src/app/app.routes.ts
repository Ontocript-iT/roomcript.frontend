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
import { UserAccount } from './features/user-management/user-account/user-account';
import {RoomListComponent} from './features/rooms/room-list/room-list';
import {UpdateReservation} from './features/reservations/update-reservation/update-reservation';
import {CalendarView} from './features/reservations/calendar-view/calendar-view';
import {FolioOperations} from './features/reservations/folio-operations/folio-operations';




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
    path: 'reservations/all',
    component: ReservationListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reservations/add',
    component: ReservationFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reservations/edit',
    component: UpdateReservation,
    canActivate: [authGuard]
  },
  {
    path: 'reservations/folio-operations',
    component: FolioOperations,
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
  },
  {
    path: 'rooms/all',
    component: RoomListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rooms/create',
    component: RoomCreate,
    canActivate: [authGuard]
  },
    {
    path: 'stayView',
    component: CalendarView,
    canActivate: [authGuard]
  }
  ,
  {
    path: 'guest/list',
    component: GuestListComponent,
    canActivate: [authGuard]
  }
    ,
  {
    path: 'user/account',
    component: UserAccount,
    canActivate: [authGuard]
  }


];
