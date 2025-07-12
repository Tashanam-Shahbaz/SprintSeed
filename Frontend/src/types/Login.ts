export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}