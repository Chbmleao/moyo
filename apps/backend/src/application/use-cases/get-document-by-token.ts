import type { Document } from '../../domain/entities/document.js';
import type { DocumentRepository } from '../../domain/repositories/document-repository.js';
import type { StorageRepository } from '../../domain/repositories/storage-repository.js';

const DOCUMENTS_BUCKET = 'documents';
const SIGNED_URL_EXPIRES_SECONDS = 3600;

export type GetDocumentByTokenResult = {
  document: {
    id: string;
    fileName: string;
    signerEmail: string | null;
    deadlineAt: Date | null;
    status: Document['status'];
    signedAt: Date | null;
  };
  viewUrl: string;
};

export type GetDocumentByToken = (
  token: string
) => Promise<GetDocumentByTokenResult>;

export function makeGetDocumentByToken(
  documentRepository: DocumentRepository,
  storageRepository: StorageRepository
): GetDocumentByToken {
  return async function getDocumentByToken(
    token: string
  ): Promise<GetDocumentByTokenResult> {
    const document = await documentRepository.getBySigningToken(token);

    if (!document) {
      throw Object.assign(new Error('Invalid or expired signing link'), { statusCode: 404 });
    }

    // Check if deadline has passed
    if (document.deadlineAt && document.deadlineAt.getTime() < Date.now()) {
      throw Object.assign(new Error('The signing deadline has passed'), { statusCode: 410 });
    }

    const viewUrl = await storageRepository.createSignedUrl(
      DOCUMENTS_BUCKET,
      document.filePath,
      SIGNED_URL_EXPIRES_SECONDS
    );

    return {
      document: {
        id: document.id,
        fileName: document.fileName,
        signerEmail: document.signerEmail,
        deadlineAt: document.deadlineAt,
        status: document.status,
        signedAt: document.signedAt,
      },
      viewUrl,
    };
  };
}
