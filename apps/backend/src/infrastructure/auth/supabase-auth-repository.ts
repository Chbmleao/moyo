import { createClient } from '@supabase/supabase-js';
import type { User } from '../../domain/entities/user.js';
import type { AuthRepository } from '../../domain/repositories/auth-repository.js';

export function createSupabaseAuthRepository(): AuthRepository {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }

  const supabase = createClient(url, anonKey);

  return {
    async getUserByToken(token: string): Promise<User | null> {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      const role = (user.user_metadata?.role as 'professional' | 'patient' | undefined) ?? 'patient';
      return {
        id: user.id,
        email: user.email ?? '',
        role: role === 'professional' ? 'professional' : 'patient',
      };
    },
  };
}
