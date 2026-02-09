import { createClient } from '@supabase/supabase-js';
import type { StorageRepository } from '../../domain/repositories/storage-repository.js';

export function createSupabaseStorageRepository(): StorageRepository {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(url, serviceRoleKey);

  return {
    async uploadFile(
      bucket: string,
      path: string,
      body: Buffer,
      contentType: string
    ): Promise<string> {
      const { error } = await supabase.storage.from(bucket).upload(path, body, {
        contentType,
        upsert: true,
      });

      if (error) throw error;
      return path;
    },

    async createSignedUrl(
      bucket: string,
      path: string,
      expiresInSeconds = 3600
    ): Promise<string> {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to create signed URL');
      return data.signedUrl;
    },
  };
}
