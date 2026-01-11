export interface Guest {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  [key: string]: any;
}

export interface InhouseGuest {
  guestId: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  status?: string;

  roomNumber?: string;
  roomType?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  reservationStatus?: string;
  confirmationNumber?: string;
  bookingSource?: string;
  numberOfAdults?: number;
  numberOfChildren?: number;

  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  specialRequests?: string;
}
