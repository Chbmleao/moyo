import type { User } from '../../domain/entities/user.js';
import type { AuthRepository } from '../../domain/repositories/auth-repository.js';

export type GetCurrentUser = (token: string) => Promise<User | null>;

export function makeGetCurrentUser(authRepository: AuthRepository): GetCurrentUser {
  return (token: string) => authRepository.getUserByToken(token);
}
