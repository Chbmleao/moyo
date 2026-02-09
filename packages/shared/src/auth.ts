export type UserRole = 'professional' | 'patient';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
