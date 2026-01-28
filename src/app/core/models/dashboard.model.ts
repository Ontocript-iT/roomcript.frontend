export interface Property {
  id: number;
  propertyCode: string;
  propertyName: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  zipCode: string | null;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  totalRooms: number;
  timeZone: string;
  currency: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PropertyResponse {
  headers: any;
  body: Property[];
  statusCode: string;
  statusCodeValue: number;
}

// housekeeping

export interface TaskSummary {
  totalTasks: number;
  pendingTasks: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  checkoutCleanings: number;
  stayoverCleanings: number;
  taskCompletionRate: number;
}

export interface RoomDetail {
  roomNumber: string;
  roomType: string;
  currentStatus: string; // 'CLEANING' | 'AVAILABLE' | 'MAINTENANCE' etc.
  lastStatusChange: string | null;
  lastCleanedBy: string | null;
}

export interface RoomStatusSummary {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  roomDetails: RoomDetail[];
}

export interface HousekeepingData {
  propertyCode: string;
  propertyName: string;
  pendingTasksCount: number;
  todayTaskSummary: TaskSummary;
  roomStatusSummary: RoomStatusSummary;
  generatedAt: string;
}

export interface HousekeepingDashboardResponse {
  result: HousekeepingData;
  message: string;
  status: number;
}
