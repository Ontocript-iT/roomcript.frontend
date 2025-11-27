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
