import type { FastifyInstance } from "fastify";
import type { CreateDocument } from "../../../application/use-cases/create-document.js";
import type { ListDocuments } from "../../../application/use-cases/list-documents.js";
import type { GetDocument } from "../../../application/use-cases/get-document.js";
import type { CreateSigningLink } from "../../../application/use-cases/create-signing-link.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MIME = "application/pdf";

function isPdf(mimetype: string, filename: string): boolean {
	return mimetype === PDF_MIME || (typeof filename === "string" && filename.toLowerCase().endsWith(".pdf"));
}

interface MultipartPart {
	type: string;
	fieldname?: string;
	value?: unknown;
	mimetype?: string;
	filename?: string;
	toBuffer?: () => Promise<Buffer>;
}

export function registerDocumentRoutes(
	app: FastifyInstance,
	deps: {
		createDocument: CreateDocument;
		listDocuments: ListDocuments;
		getDocument: GetDocument;
		createSigningLink: CreateSigningLink;
	},
): void {
	app.post("/documents", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can upload documents" });
			return;
		}

		let fileBuffer: Buffer | null = null;
		let fileName = "";
		let signerEmail: string | null = null;
		let deadlineRaw: string | null = null;

		try {
			const parts = request.parts();
			for await (const part of parts as AsyncIterable<MultipartPart>) {
				if (part.type === "file") {
					const mt = part.mimetype ?? "";
					const fn = part.filename ?? "";
					if (!isPdf(mt, fn)) {
						await reply.status(400).send({ error: "Bad Request", message: "File must be a PDF" });
						return;
					}
					if (typeof part.toBuffer !== "function") {
						await reply.status(400).send({ error: "Bad Request", message: "Invalid file part" });
						return;
					}
					fileBuffer = await part.toBuffer();
					fileName = fn;
					if (fileBuffer.length > MAX_FILE_SIZE) {
						await reply.status(400).send({ error: "Bad Request", message: "File too large (max 10MB)" });
						return;
					}
				} else {
					const v = String(part.value ?? "").trim();
					if (part.fieldname === "signer_email") signerEmail = v || null;
					if (part.fieldname === "deadline") deadlineRaw = v || null;
				}
			}
		} catch (err) {
			request.log.error(err);
			await reply.status(400).send({ error: "Bad Request", message: "Invalid multipart body" });
			return;
		}

		if (!fileBuffer || !fileName) {
			await reply.status(400).send({ error: "Bad Request", message: "Missing file field" });
			return;
		}

		const deadlineAt = deadlineRaw ? new Date(deadlineRaw) : null;
		if (deadlineRaw && isNaN(deadlineAt!.getTime())) {
			await reply.status(400).send({ error: "Bad Request", message: "Invalid deadline format (use ISO date)" });
			return;
		}

		try {
			const document = await deps.createDocument({
				professionalId: request.user.id,
				fileBuffer,
				fileName,
				signerEmail,
				deadlineAt,
			});
			await reply.status(201).send({
				id: document.id,
				fileName: document.fileName,
				signerEmail: document.signerEmail,
				deadlineAt: document.deadlineAt?.toISOString() ?? null,
				status: document.status,
				createdAt: document.createdAt.toISOString(),
			});
		} catch (err) {
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	app.get("/documents", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		try {
			const documents = await deps.listDocuments(request.user);
			await reply.send(
				documents.map(doc => ({
					id: doc.id,
					fileName: doc.fileName,
					signerEmail: doc.signerEmail,
					deadlineAt: doc.deadlineAt?.toISOString() ?? null,
					status: doc.status,
					createdAt: doc.createdAt.toISOString(),
				})),
			);
		} catch (err) {
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	app.get<{ Params: { id: string } }>("/documents/:id", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}

		const { id } = request.params;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			await reply.status(400).send({ error: "Bad Request", message: "Invalid document ID format" });
			return;
		}

		try {
			const result = await deps.getDocument(id, request.user);
			if (!result) {
				await reply.status(404).send({ error: "Not Found", message: "Document not found or access denied" });
				return;
			}
			await reply.send({
				document: {
					id: result.document.id,
					fileName: result.document.fileName,
					signerEmail: result.document.signerEmail,
					deadlineAt: result.document.deadlineAt?.toISOString() ?? null,
					status: result.document.status,
					createdAt: result.document.createdAt.toISOString(),
				},
				viewUrl: result.viewUrl,
			});
		} catch (err) {
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	// POST /documents/:id/signing-link — generate a public signing link
	app.post<{ Params: { id: string } }>("/documents/:id/signing-link", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can create signing links" });
			return;
		}

		const { id } = request.params;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			await reply.status(400).send({ error: "Bad Request", message: "Invalid document ID format" });
			return;
		}

		try {
			const result = await deps.createSigningLink(id, request.user.id);
			await reply.send(result);
		} catch (err: unknown) {
			const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
			const message = err instanceof Error ? err.message : "Internal Server Error";
			request.log.error(err);
			await reply.status(statusCode).send({ error: message });
		}
	});
}
