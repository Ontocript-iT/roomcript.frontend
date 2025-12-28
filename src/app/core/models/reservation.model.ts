export interface RoomDetail {
  roomId: number;
  roomNumber: string;
  roomType: string;
  numberOfAdults: number | null;
  numberOfChildren: number | null;
  roomRate: number;
  roomTotal?: number | null;
  confirmationNumber?: string | null;
}

export interface Reservation {
  id: number;
  confirmationNumber?: string;
  guestId?: number;
  name: string;
  email: string;
  phone: string;
  roomDetails: RoomDetail[];
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paidAmount?: number | null;
  originalRate?: number | null;
  currentRate?: number | null;
  reservationType?: string | null;
  bookingSource?: string | null;
  businessSource?: string | null;
  releaseDateTime?: string | null;
  remindDaysBeforeRelease?: number | null;
  holdDays?: number | null;
  autoCancelEnabled?: boolean;
  discountAmount?: number | null;
  status: string;
  paymentStatus?: string | null;
  specialRequests?: string | null;
  numberOfGuests: number;
  numberOfChildren?: number | null;
  numberOfAdults?: number | null;
  isRateOverridden?: boolean | null;
  rateOverrideReason?: string | null;
  rateOverriddenByUsername?: string | null;
  rateType?: string | null;
  createdByUsername?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cancelledAt?: string | null;
  cancelledByUsername?: string | null;
  cancellationReason?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  roomCount: number;
  checkInStatus: boolean;
  checkOutStatus: boolean;
  groupReservationId?: string | null;
  propertyCode: string;
  roomGuests?: any;                // You may define a proper interface if needed
  groupReservation?: boolean;
  sendVoucher?: boolean;
}

export interface ReservationFilter {
  [key: string]: any;
  status?: string;
  startReservationDate?: string;
  endReservationDate?: string;
  startCheckInDate?: string;
  endCheckInDate?: string;
  bookingSource?: string;
  roomType?: string;
  reservationType?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface MaintenanceBlock {
  id: number;
  roomId: string;
  propertyCode: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  reason: string;
  createdAt: string;
  updatedAt: string;
}
