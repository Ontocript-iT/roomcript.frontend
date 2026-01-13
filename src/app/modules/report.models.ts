export interface ReportResult {
  totalRevenue?: number;
  totalReservations?: number;
  occupancyPercentage?: number;
  averageRoomRate?: number;
  
  // Arrays for lists
  reservations?: any[];
  cancellations?: any[];
  groupReservations?: any[];
  longStays?: any[];
  arrivals?: any[];
  departures?: any[];
  
  // Specific Report Data
  roomTypeOccupancy?: { [key: string]: { roomType: string, totalRooms: number, occupiedRooms: number, availableRooms: number, occupancyPercentage: number } };
  bookingSources?: { bookingSource: string, totalReservations: number, percentage: number, totalRevenue: number }[];
  nationalities?: { country: string, totalGuests: number, percentage: number }[];
  roomTypeRevenues?: { roomType: string, totalRevenue: number, averageRate: number, totalRoomsSold: number }[];
  dailyOccupancy?: { date: string, occupiedRooms: number, occupancyPercentage: number, revenue: number }[];
}