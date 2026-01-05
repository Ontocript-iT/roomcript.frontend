export interface ReservationRoomDetails {
  roomNumber: string;
  checkInCheckOutStatus: 'CHECK_IN' | 'CHECK_OUT' | 'PENDING' | 'CONFIRMED';
  arrival: string;
  nights: number;
  departure: string;
  adult: number;
  message: string;
  roomType: string;
  guestName: string;
  child: number;
  status: number;
}

export interface FolioCharge {
  day: string;
  refNo: string;
  particulars: string;
  description: string;
  user: string;
  amount: number;
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
