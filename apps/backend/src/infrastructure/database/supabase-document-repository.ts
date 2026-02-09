import { createClient } from '@supabase/supabase-js';
import type { Document } from '../../domain/entities/document.js';
import type {
  DocumentRepository,
  CreateDocumentInput,
} from '../../domain/repositories/document-repository.js';

type DocumentRow = {
  id: string;
  professional_id: string;
  file_path: string;
  file_name: string;
  signer_email: string | null;
  deadline_at: string | null;
  status: 'pending_signature' | 'signed';
  created_at: string;
};

function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    professionalId: row.professional_id,
    filePath: row.file_path,
    fileName: row.file_name,
    signerEmail: row.signer_email,
    deadlineAt: row.deadline_at ? new Date(row.deadline_at) : null,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export function createSupabaseDocumentRepository(): DocumentRepository {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(url, serviceRoleKey);

  return {
    async create(input: CreateDocumentInput): Promise<Document> {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id: input.id,
          professional_id: input.professionalId,
          file_path: input.filePath,
          file_name: input.fileName,
          signer_email: input.signerEmail,
          deadline_at: input.deadlineAt?.toISOString() ?? null,
          status: input.status,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToDocument(data as DocumentRow);
    },

    async listByProfessionalId(professionalId: string): Promise<Document[]> {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DocumentRow[]).map(rowToDocument);
    },

    async listBySignerEmail(email: string): Promise<Document[]> {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('signer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DocumentRow[]).map(rowToDocument);
    },

    async getById(id: string): Promise<Document | null> {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data ? rowToDocument(data as DocumentRow) : null;
    },
  };
}
