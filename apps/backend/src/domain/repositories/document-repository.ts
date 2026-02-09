import type { Document } from '../entities/document.js';

export type CreateDocumentInput = {
  id: string;
  professionalId: string;
  filePath: string;
  fileName: string;
  signerEmail: string | null;
  deadlineAt: Date | null;
  status: Document['status'];
};

export type DocumentRepository = {
  create(input: CreateDocumentInput): Promise<Document>;
  listByProfessionalId(professionalId: string): Promise<Document[]>;
  listBySignerEmail(email: string): Promise<Document[]>;
  getById(id: string): Promise<Document | null>;
};
