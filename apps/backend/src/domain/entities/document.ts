export type DocumentStatus = "pending_signature" | "signed";

export type Document = {
	id: string;
	professionalId: string;
	patientId: string | null;
	filePath: string;
	fileName: string;
	signerEmail: string | null;
	deadlineAt: Date | null;
	status: DocumentStatus;
	signingToken: string | null;
	signedAt: Date | null;
	signedFilePath: string | null;
	createdAt: Date;
};
