import type { User } from '../entities/user.js';

export type AuthRepository = {
  getUserByToken(token: string): Promise<User | null>;
};
