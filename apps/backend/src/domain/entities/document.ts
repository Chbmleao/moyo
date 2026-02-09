export type DocumentStatus = 'pending_signature' | 'signed';

export type Document = {
  id: string;
  professionalId: string;
  filePath: string;
  fileName: string;
  signerEmail: string | null;
  deadlineAt: Date | null;
  status: DocumentStatus;
  createdAt: Date;
};
