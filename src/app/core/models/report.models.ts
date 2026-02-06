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

//revenue reports

export interface DailyStat {
  date: string;
  dailyRevenue: number;
  roomsSold: number;
  arr: number;
}

export interface RoomTypeStat {
  roomType: string;
  totalRevenue: number;
  roomNightsSold: number;
  arr: number;
}

export interface ArrReportResult {
  propertyCode: string;
  startDate: string;
  endDate: string;
  overallArr: number;
  totalRoomRevenue: number;
  totalRoomNightsSold: number;
  dailyStats: DailyStat[];
  roomTypeStats: RoomTypeStat[];
}

export interface ArrReportResponse {
  result: ArrReportResult;
  message: string;
  status: number;
}

// --- Unified Financial Report Interfaces ---

export interface UnifiedFinancialRequest {
  propertyCode: string;
  startDate: string;
  endDate: string;
  includeYearToDate: boolean;
  includeBudget: boolean;
  sections: string[];
}

export interface FlashReportData {
  arr: number;
  revPar: string | number;
  totalCollections: number;
  totalRevenue: number;
}

export interface TaxReportData {
  breakdownByType: { [key: string]: number };
  totalTaxCollected: number;
}

export interface UnifiedFinancialData {
  flashReport?: FlashReportData;
  revenueLedger?: any[];
  paymentSummary?: any[];
  taxReport?: TaxReportData;
}

export interface UnifiedFinancialResponse {
  status: number;
  filters: UnifiedFinancialRequest;
  data: UnifiedFinancialData;
}
