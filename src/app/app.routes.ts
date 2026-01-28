import { Routes } from '@angular/router';

import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ReservationListComponent } from './features/reservations/reservation-list/reservation-list.component';
import { PropertyAddComponent } from './features/property-management/create-property/property-add';
import { UserAddComponent } from './features/user-management/user-add/user-add';
import { UserAssign } from './features/user-management/user-assign/user-assign';
import { PropertyList } from './features/property-management/property-list/property-list';
import { RoomCreate } from './features/rooms/room-create/room-create';
import { ReservationFormComponent } from './features/reservations/reservation-form/reservation-form.component';
import { CheckinCheckoutComponent } from './features/reservations/checkin-checkout/checkin-checkout';

import { GuestListComponent } from './features/guest-management/guest-list/guest-list';
import { UserAccount } from './features/user-management/user-account/user-account';
import { RoomListComponent } from './features/rooms/room-list/room-list';
import { UpdateReservation } from './features/reservations/update-reservation/update-reservation';
import { CalendarView } from './features/reservations/calendar-view/calendar-view';
import { ReservationUpdates } from './features/Folios/reservation-updates/reservation-updates';
import { InhouseGuestsComponent } from './features/guest-management/inhouse-guests/inhouse-guests';
import { CreateTask } from './features/housekeeping/create-task/create-task';
import { ViewAllTask } from './features/housekeeping/view-all-task/view-all-task';
import { ViewAllFoundItems } from './features/lost-and-found/view-all-found-items/view-all-found-items';
import {MaintenanceRequests} from './features/maintenance/maintenance-requests/maintenance-requests';
import {ReservationMain} from './features/reports/reservation-reports/reservation-main/reservation-main';
import {GuestMain} from './features/reports/guest-reports/guest-main/guest-main';
import {HousekeepingMain} from './features/reports/housekeeping-reports/housekeeping-main/housekeeping-main';
import {AdminDashboard} from './features/dashboards/admin-dashboard/admin-dashboard';
import {SuperadminDashboard} from './features/dashboards/superadmin-dashboard/superadmin-dashboard';
import {HousekeepingDashboard} from './features/dashboards/housekeeping-dashboard/housekeeping-dashboard';
import {AuthService} from './core/services/auth.service';
import {inject} from '@angular/core';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
  },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    canActivate: [authGuard], 
    children: [
      {
        path: '',
        canMatch: [() => inject(AuthService).getUserRoles().includes('SUPER_ADMIN')],
        component: SuperadminDashboard
      },
      {
        path: '',
        canMatch: [() => inject(AuthService).getUserRoles().includes('HOUSEKEEPING')],
        component: HousekeepingDashboard
      },
      {
        path: '',
        component: AdminDashboard
      }
    ]
  },
  {
    path: 'reservations/all',
    component: ReservationListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'reservations/add',
    component: ReservationFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'reservations/edit/:id',
    component: UpdateReservation,
    canActivate: [authGuard],
  },
  {
    path: 'reservations/reservation-updates',
    component: ReservationUpdates,
    canActivate: [authGuard],
  },
  {
    path: 'checkin-checkout',
    component: CheckinCheckoutComponent,
    canActivate: [authGuard],
  },
  {
    path: 'users/addUser',
    component: UserAddComponent,
    canActivate: [authGuard],
  },
  {
    path: 'createProperty',
    component: PropertyAddComponent,
    canActivate: [authGuard],
  },
  {
    path: 'users/all',
    component: UserAssign,
    canActivate: [authGuard],
  },
  {
    path: 'propertyList',
    component: PropertyList,
    canActivate: [authGuard],
  },
  {
    path: 'rooms/all',
    component: RoomListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'rooms/create',
    component: RoomCreate,
    canActivate: [authGuard],
  },
  {
    path: 'stayView',
    component: CalendarView,
    canActivate: [authGuard],
  },
  {
    path: 'guest/list',
    component: GuestListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'guest/inhouse',
    component: InhouseGuestsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'user/account',
    component: UserAccount,
    canActivate: [authGuard],
  },
  {
    path: 'housekeeping/create-task',
    component: CreateTask,
    canActivate: [authGuard],
  },
  {
    path: 'housekeeping/view-all-task',
    component: ViewAllTask,
    canActivate: [authGuard],
  },
  {
    path: 'housekeeping/view-all-found-items',
    component: ViewAllFoundItems,
    canActivate: [authGuard],
  },
  {
    path: 'maintenance/all-requests',
    component: MaintenanceRequests,
    canActivate: [authGuard],
  },
  {
    path: 'reports/reservations',
    component: ReservationMain,
    canActivate: [authGuard],
  },
  {
    path: 'reports/guests',
    component: GuestMain,
    canActivate: [authGuard],
  },
  {
    path: 'reports/housekeeping',
    component: HousekeepingMain,
    canActivate: [authGuard],
  },
];
