export type UserRole = 'professional' | 'patient';

export type User = {
  id: string;
  email: string;
  role: UserRole;
};
