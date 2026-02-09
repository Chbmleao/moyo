import type { Document } from '../../domain/entities/document.js';
import type { User } from '../../domain/entities/user.js';
import type { DocumentRepository } from '../../domain/repositories/document-repository.js';
import type { StorageRepository } from '../../domain/repositories/storage-repository.js';

const DOCUMENTS_BUCKET = 'documents';
const SIGNED_URL_EXPIRES_SECONDS = 3600;

export type GetDocumentResult = {
  document: Document;
  viewUrl: string;
};

export type GetDocument = (
  documentId: string,
  user: User
) => Promise<GetDocumentResult | null>;

export function makeGetDocument(
  documentRepository: DocumentRepository,
  storageRepository: StorageRepository
): GetDocument {
  return async function getDocument(
    documentId: string,
    user: User
  ): Promise<GetDocumentResult | null> {
    const document = await documentRepository.getById(documentId);
    if (!document) return null;

    const isOwner = document.professionalId === user.id;
    const isSigner = document.signerEmail !== null && document.signerEmail === user.email;
    if (!isOwner && !isSigner) return null;

    const viewUrl = await storageRepository.createSignedUrl(
      DOCUMENTS_BUCKET,
      document.filePath,
      SIGNED_URL_EXPIRES_SECONDS
    );

    return { document, viewUrl };
  };
}
