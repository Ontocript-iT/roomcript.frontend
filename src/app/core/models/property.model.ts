export interface Property {
  id?: number;
  propertyName: string;
  propertyCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  totalRooms: number;
  floorCount: number;
  timeZone: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PropertyResponse {
  id?: number;
  propertyName: string;
  propertyCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  totalRooms: number;
  floorCount: number;
  timeZone: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}
