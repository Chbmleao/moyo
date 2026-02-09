import type { Document } from '../../domain/entities/document.js';
import type { DocumentRepository } from '../../domain/repositories/document-repository.js';
import type { StorageRepository } from '../../domain/repositories/storage-repository.js';

export type CreateDocumentInput = {
  professionalId: string;
  fileBuffer: Buffer;
  fileName: string;
  signerEmail?: string | null;
  deadlineAt?: Date | null;
};

const DOCUMENTS_BUCKET = 'documents';
const PDF_CONTENT_TYPE = 'application/pdf';

export type CreateDocument = (input: CreateDocumentInput) => Promise<Document>;

export function makeCreateDocument(
  documentRepository: DocumentRepository,
  storageRepository: StorageRepository
): CreateDocument {
  return async function createDocument(input: CreateDocumentInput): Promise<Document> {
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    const filePath = `${id}.pdf`;

    await storageRepository.uploadFile(
      DOCUMENTS_BUCKET,
      filePath,
      input.fileBuffer,
      PDF_CONTENT_TYPE
    );

    const doc = await documentRepository.create({
      id,
      professionalId: input.professionalId,
      filePath,
      fileName: input.fileName,
      signerEmail: input.signerEmail ?? null,
      deadlineAt: input.deadlineAt ?? null,
      status: 'pending_signature',
    });

    return doc;
  };
}
