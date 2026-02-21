import { PDFDocument } from "pdf-lib";
import type { DocumentRepository } from "../../domain/repositories/document-repository.js";
import type { StorageRepository } from "../../domain/repositories/storage-repository.js";

const DOCUMENTS_BUCKET = "documents";

export type SignatureInput = {
	signatureImage: string; // base64 PNG (data URL or raw base64)
	page: number; // 0-indexed page number
	x: number; // x position as fraction 0..1 of page width
	y: number; // y position as fraction 0..1 of page height
	width: number; // signature width as fraction 0..1 of page width
	height: number; // signature height as fraction 0..1 of page height
};

export type SignDocumentResult = {
	message: string;
	signedAt: string;
};

export type SignDocument = (token: string, signature: SignatureInput) => Promise<SignDocumentResult>;

export function makeSignDocument(
	documentRepository: DocumentRepository,
	storageRepository: StorageRepository,
): SignDocument {
	return async function signDocument(token: string, signature: SignatureInput): Promise<SignDocumentResult> {
		const document = await documentRepository.getBySigningToken(token);

		if (!document) {
			throw Object.assign(new Error("Invalid or expired signing link"), { statusCode: 404 });
		}

		if (document.status === "signed") {
			throw Object.assign(new Error("Document has already been signed"), { statusCode: 409 });
		}

		// Check if deadline has passed
		if (document.deadlineAt && document.deadlineAt.getTime() < Date.now()) {
			throw Object.assign(new Error("The signing deadline has passed"), { statusCode: 410 });
		}

		// Download the original PDF
		const pdfBuffer = await storageRepository.downloadFile(DOCUMENTS_BUCKET, document.filePath);

		// Embed signature into the PDF
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const pages = pdfDoc.getPages();

		if (signature.page < 0 || signature.page >= pages.length) {
			throw Object.assign(new Error("Invalid page number"), { statusCode: 400 });
		}

		const targetPage = pages[signature.page];
		const { width: pageWidth, height: pageHeight } = targetPage.getSize();

		// Parse the base64 signature image
		const base64Data = signature.signatureImage.replace(/^data:image\/png;base64,/, "");
		const signatureBytes = Buffer.from(base64Data, "base64");
		const signatureImageEmbed = await pdfDoc.embedPng(signatureBytes);

		// Convert fractional coordinates to absolute PDF points
		const sigWidth = signature.width * pageWidth;
		const sigHeight = signature.height * pageHeight;
		const sigX = signature.x * pageWidth;
		// PDF y-axis is bottom-up, frontend y is top-down
		const sigY = pageHeight - signature.y * pageHeight - sigHeight;

		targetPage.drawImage(signatureImageEmbed, {
			x: sigX,
			y: sigY,
			width: sigWidth,
			height: sigHeight,
		});

		// Save the signed PDF to a separate path (preserve original)
		const signedPdfBytes = await pdfDoc.save();
		const signedFilePath = document.filePath.replace(/\.pdf$/i, "_signed.pdf");
		await storageRepository.uploadFile(
			DOCUMENTS_BUCKET,
			signedFilePath,
			Buffer.from(signedPdfBytes),
			"application/pdf",
		);

		// Update document status and store signed file path
		const updated = await documentRepository.signDocument(token, signedFilePath);

		if (!updated) {
			throw Object.assign(new Error("Failed to sign document"), { statusCode: 500 });
		}

		return {
			message: "Document signed successfully",
			signedAt: updated.signedAt!.toISOString(),
		};
	};
}
