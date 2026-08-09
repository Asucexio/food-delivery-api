// The 3 roles a user can have, matching the `role` enum we created in the database
export type UserRole = 'customer' | 'restaurant_owner' | 'driver';

 
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

 
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}