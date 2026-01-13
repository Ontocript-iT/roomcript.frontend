export interface NavSubItem {
  title: string;
  route: string;
  icon?: string;
  roles: string[];  // Roles that can access this sub-item
}

export interface NavItem {
  title: string;
  icon: string;
  route?: string;  // For items without submenu
  roles: string[];  // Roles that can access this main item
  subItems?: NavSubItem[];  // Optional submenu items
  expanded?: boolean;  // Track expansion state
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    roles: ['ADMIN','SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']
  },
    {
    title: 'User',
    icon: 'person_manage',
    roles: ['ADMIN','SUPER_ADMIN'],
     subItems: [
       {
         title: 'All Users',
         route: '/users/all',
         icon: 'person_assign',
         roles: ['SUPER_ADMIN', 'ADMIN']
       },
       {
          title: 'Add User',
          route: '/users/addUser',
          icon: 'person_add',
          roles: ['SUPER_ADMIN', 'ADMIN']
       },]
  },
  {
    title: 'Property',
    icon: 'dashboard',
    roles: ['SUPER_ADMIN'],
     subItems: [
      {
        title: 'Create Property',
        route: '/createProperty',
        icon: 'view_list',
        roles: ['SUPER_ADMIN']
      },
      {
        title: 'Property List',
        route: '/propertyList',
        icon: 'view_list',
        roles: ['SUPER_ADMIN']
      },]
  },
  {
    title: 'Rooms',
    icon: 'meeting_room',
    roles: ['SUPER_ADMIN','ADMIN'],
    subItems: [
      {
        title: 'All Rooms',
        route: '/rooms/all',
        icon: 'view_list',
        roles: ['SUPER_ADMIN','ADMIN']
      },
      {
        title: 'Add Room',
        route: '/rooms/create',
        icon: 'add',
        roles: ['SUPER_ADMIN']
      },
      {
        title: 'Room Types',
        route: '/rooms/types',
        icon: 'category',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Room Status',
        route: '/rooms/status',
        icon: 'info',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']
      },
      {
        title: 'Maintenance',
        route: '/rooms/maintenance',
        icon: 'build',
        roles: ['ADMIN', 'MANAGER', 'HOUSEKEEPING']
      }
    ]
  },
  {
    title: 'Reservations',
    icon: 'book_online',
    roles: ['ADMIN', 'MANAGER', 'FRONT_DESK'],
    subItems: [
      {
        title: 'All Reservations',
        route: '/reservations/all',
        icon: 'list',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'New Reservation',
        route: '/reservations/add',
        icon: 'add_circle',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'Check-In/Out',
        route: '/checkin-checkout',
        icon: 'login',
        roles: ['ADMIN', 'FRONT_DESK']
      },
    ]
  },
  {
    title: 'Guests',
    icon: 'people',
    roles: ['ADMIN', 'MANAGER', 'FRONT_DESK'],
    subItems: [
      {
        title: 'All Guests',
        route: '/guest/list',
        icon: 'list',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'Inhouse Guests',
        route: '/guest/inhouse',
        icon: 'home',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'Add Guest',
        route: '/guests/add',
        icon: 'person_add',
        roles: ['ADMIN', 'FRONT_DESK']
      }
    ]
  },
   {
    title: 'Housekeeping',
    icon: 'people',
    roles: ['ADMIN', 'MANAGER'],
    subItems: [
      {
        title: 'Create Housekeeping Task',
        route: 'housekeeping/create-task',
        icon: 'list',
        roles: ['ADMIN', 'MANAGER', 'FRONT_DESK']
      },
       {
        title: 'All Tasks',
        route: 'housekeeping/view-all-task',
        icon: 'list',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Lost and Found Items',
        route: 'housekeeping/view-all-found-items',
        icon: 'list',
        roles: ['ADMIN', 'MANAGER']
      }
    ]
  },
  {
    title: 'Reports',
    icon: 'assessment',
    roles: ['ADMIN', 'MANAGER'],
    subItems: [
      {
        title: 'Reservation Report',
        route: '/reports/reservations',
        icon: 'pie_chart',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Revenue Report',
        route: '/reports/revenue',
        icon: 'attach_money',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Guest Analytics',
        route: '/reports/analytics',
        icon: 'analytics',
        roles: ['ADMIN', 'MANAGER']
      }
    ]
  },
  {
    title: 'Settings',
    icon: 'settings',
    route: '/settings',
    roles: ['ADMIN']
  }
];
