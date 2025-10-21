export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  propertyId?: number;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  username:string;
  name:string;
  roles:string[];

}
