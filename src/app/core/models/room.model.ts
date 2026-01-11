export interface Room {
  propertyCode: string | null;
  id: number;
  roomNumber: string;
  roomType: string;
  price: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  propertyId: number;
  basePrice: number;

  description?: string;
  floor?: number;
  capacity?: number;
  bedType?: string;
  smokingAllowed?: boolean;
  hasBalcony?: boolean;
  hasSeaView?: boolean;
  amenities?: string;
  remarks?: string | null;
  maxAdults?: number | null;
  maxChildren?: number | null;
  createdBy?: string | null;
  updatedAt?: string;
}

export interface AvailableRooms{
  roomType: string;
  availableCount: number;
  totalCount: number;
  reservedCount: number;
  basePrice: number;
}
