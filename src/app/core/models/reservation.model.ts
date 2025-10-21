export interface Reservation {
  id: number;
  guestName: string;
  guestEmail: string;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}
