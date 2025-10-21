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
    roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']
  },
  {
    title: 'Rooms',
    icon: 'meeting_room',
    roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK'],
    subItems: [
      {
        title: 'All Rooms',
        route: '/rooms/all',
        icon: 'view_list',
        roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'Add Room',
        route: '/rooms/add',
        icon: 'add',
        roles: ['ROLE_ADMIN', 'MANAGER']
      },
      {
        title: 'Room Types',
        route: '/rooms/types',
        icon: 'category',
        roles: ['ROLE_ADMIN', 'MANAGER']
      },
      {
        title: 'Room Status',
        route: '/rooms/status',
        icon: 'info',
        roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']
      },
      {
        title: 'Maintenance',
        route: '/rooms/maintenance',
        icon: 'build',
        roles: ['ROLE_ADMIN', 'MANAGER', 'HOUSEKEEPING']
      }
    ]
  },
  {
    title: 'Reservations',
    icon: 'book_online',
    roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK'],
    subItems: [
      {
        title: 'All Reservations',
        route: '/reservations/all',
        icon: 'list',
        roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'New Reservation',
        route: '/reservations/new',
        icon: 'add_circle',
        roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK']
      },
      {
        title: 'Check-In',
        route: '/reservations/check-in',
        icon: 'login',
        roles: ['ROLE_ADMIN', 'FRONT_DESK']
      },
      {
        title: 'Check-Out',
        route: '/reservations/check-out',
        icon: 'logout',
        roles: ['ROLE_ADMIN', 'FRONT_DESK']
      }
    ]
  },
  {
    title: 'Guests',
    icon: 'people',
    roles: ['ROLE_ADMIN', 'MANAGER', 'FRONT_DESK'],
    subItems: [
      {
        title: 'All Guests',
        route: '/guests/all',
        icon: 'list',
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
    title: 'Reports',
    icon: 'assessment',
    roles: ['ADMIN', 'MANAGER'],
    subItems: [
      {
        title: 'Occupancy Report',
        route: '/reports/occupancy',
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
