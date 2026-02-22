import type { Document } from "../entities/document.js";

export type CreateDocumentInput = {
	id: string;
	professionalId: string;
	patientId: string | null;
	filePath: string;
	fileName: string;
	signerEmail: string | null;
	deadlineAt: Date | null;
	status: Document["status"];
};

export type DocumentRepository = {
	create(input: CreateDocumentInput): Promise<Document>;
	listByProfessionalId(professionalId: string): Promise<Document[]>;
	listBySignerEmail(email: string): Promise<Document[]>;
	getById(id: string): Promise<Document | null>;
	generateSigningToken(documentId: string, professionalId: string): Promise<string>;
	getBySigningToken(token: string): Promise<Document | null>;
	signDocument(token: string, signedFilePath: string): Promise<Document | null>;
};
