export interface RoomDetail {
  roomId: number;
  roomNumber: string;
  roomType: string;
  numberOfAdults: number | null;
  numberOfChildren: number | null;
  roomRate: number;
}

export interface Reservation {
  id: number;
  name: string;
  email: string;
  roomDetails: RoomDetail[];
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  propertyCode: string;
  address: string;
  phone:  string;
  numberOfGuests:number;
  roomCount: number;
  checkInStatus: boolean;
  checkOutStatus: boolean;
}
