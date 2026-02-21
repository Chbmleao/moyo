import type { DocumentRepository } from '../../domain/repositories/document-repository.js';

export type SignDocumentResult = {
  message: string;
  signedAt: string;
};

export type SignDocument = (token: string) => Promise<SignDocumentResult>;

export function makeSignDocument(
  documentRepository: DocumentRepository
): SignDocument {
  return async function signDocument(token: string): Promise<SignDocumentResult> {
    const document = await documentRepository.getBySigningToken(token);

    if (!document) {
      throw Object.assign(new Error('Invalid or expired signing link'), { statusCode: 404 });
    }

    if (document.status === 'signed') {
      throw Object.assign(new Error('Document has already been signed'), { statusCode: 409 });
    }

    // Check if deadline has passed
    if (document.deadlineAt && document.deadlineAt.getTime() < Date.now()) {
      throw Object.assign(new Error('The signing deadline has passed'), { statusCode: 410 });
    }

    const updated = await documentRepository.signDocument(token);

    if (!updated) {
      throw Object.assign(new Error('Failed to sign document'), { statusCode: 500 });
    }

    return {
      message: 'Document signed successfully',
      signedAt: updated.signedAt!.toISOString(),
    };
  };
}
