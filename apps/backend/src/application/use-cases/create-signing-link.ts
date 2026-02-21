import type { DocumentRepository } from "../../domain/repositories/document-repository.js";

export type CreateSigningLinkResult = {
	signingToken: string;
	signingUrl: string;
};

export type CreateSigningLink = (documentId: string, professionalId: string) => Promise<CreateSigningLinkResult>;

export function makeCreateSigningLink(documentRepository: DocumentRepository): CreateSigningLink {
	return async function createSigningLink(
		documentId: string,
		professionalId: string,
	): Promise<CreateSigningLinkResult> {
		const document = await documentRepository.getById(documentId);

		if (!document) {
			throw Object.assign(new Error("Document not found"), { statusCode: 404 });
		}

		if (document.professionalId !== professionalId) {
			throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
		}

		if (document.status !== "pending_signature") {
			throw Object.assign(new Error("Document is already signed"), { statusCode: 409 });
		}

		// If token already exists, return it instead of generating a new one
		let token = document.signingToken;
		if (!token) {
			token = await documentRepository.generateSigningToken(documentId, professionalId);
		}

		const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
		const signingUrl = `${frontendUrl}/assinar/${token}`;

		return { signingToken: token, signingUrl };
	};
}
