export interface Room {
  id: number;
  roomNumber: string;
  roomType: string;
  price: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  propertyId: number;
}
