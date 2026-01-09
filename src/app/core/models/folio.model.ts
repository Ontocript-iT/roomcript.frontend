export interface FolioCharge {
  day: string;
  refNo: string;
  particulars: string;
  description: string;
  user: string;
  amount: number;
  isVoided: boolean;
}

export interface FolioDetails {
  id: number;
  folioNumber: string;
  reservationId: number;
  reservationConfirmationNumber: string;
  guestId: number;
  guestName: string;
  folioType: 'GUEST' | 'MASTER' | 'COMPANY' | 'TRAVEL_AGENT';
  status: 'OPEN' | 'CLOSED' | 'SETTLED' | 'TRANSFERRED';
  totalCharges: number;
  totalPayments: number;
  totalAmount: number;
  balance: number;
  isMasterFolio: boolean;
  parentFolioId: number | null;
  charges: FolioCharge[];
  payments: FolioPayment[];
  remarks: string | null;
  settledAt: string | null;
  settledBy: string | null;
  createdAt: string;
  createdBy: string;
}

export interface FolioPayment {
  id?: number;
  paymentType: string;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
  reference?: string;
  receivedBy: string;
  createdAt?: string;
}

export interface FolioCharge {
  id?: number;
  chargeType: string;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  chargeDate: string;
  postedBy: string;
  createdAt?: string;
}

export interface ReservationRoomDetails {
  id: number;
  confirmationNumber: string;
  roomConfirmationNumber: string | null;
  reservationId: number | null;
  guestId: number;
  guestEmail: string | null;
  guestPhone: string | null;
  isOnHold: boolean | null;
  roomId: number | null;
  rooms: any | null;
  roomIds: number[];
  roomCount: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paidAmount: number;
  originalRate: number;
  currentRate: number;
  reservationType: string;
  bookingSource: string;
  advanceDeposit: number | null;
  remark: string | null;
  businessSource: string | null;
  releaseDateTime: string | null;
  remindDaysBeforeRelease: number | null;
  holdDays: number | null;
  autoCancelEnabled: boolean;
  discountAmount: number | null;
  status: string;
  paymentStatus: string;
  specialRequests: string;
  numberOfGuests: number;
  numberOfChildren: number;
  numberOfAdults: number;
  isRateOverridden: boolean;
  rateOverrideReason: string | null;
  rateOverriddenByUsername: string | null;
  rateType: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string | null;
  cancelledAt: string | null;
  cancelledByUsername: string | null;
  cancellationReason: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  roomDetails: RoomDetail[];
  groupReservationId: string;
  propertyCode: string;
  roomGuests: any | null;
  checkInStatus: boolean;
  checkOutStatus: boolean;
  sendVoucher: boolean;
  groupReservation: boolean;
}

export interface RoomDetail {
  roomId: number;
  roomNumber: string;
  roomType: string;
  roomRate: number;
  roomTotal: number;
  confirmationNumber: string;
  numberOfAdults: number;
  numberOfChildren: number;
  roomConfirmationNumber: string | null;
}
