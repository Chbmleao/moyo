import type { Document } from '../../domain/entities/document.js';
import type { User } from '../../domain/entities/user.js';
import type { DocumentRepository } from '../../domain/repositories/document-repository.js';

export type ListDocuments = (user: User) => Promise<Document[]>;

export function makeListDocuments(documentRepository: DocumentRepository): ListDocuments {
  return async function listDocuments(user: User): Promise<Document[]> {
    if (user.role === 'professional') {
      return documentRepository.listByProfessionalId(user.id);
    }
    return documentRepository.listBySignerEmail(user.email);
  };
}
