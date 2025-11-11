export interface Room {
  id: number;
  roomNumber: string;
  roomType: string;
  price: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  propertyId: number;
}

export interface AvailableRooms{
  roomType: string;
  availableCount: number;
  totalCount: number;
  reservedCount: number;
  basePrice: number;
}
