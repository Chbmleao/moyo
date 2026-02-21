import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "dotenv";
import { createSupabaseAuthRepository } from "./infrastructure/auth/supabase-auth-repository.js";
import { createSupabaseDocumentRepository } from "./infrastructure/database/supabase-document-repository.js";
import { createSupabaseStorageRepository } from "./infrastructure/storage/supabase-storage-repository.js";
import { makeGetCurrentUser } from "./application/use-cases/get-current-user.js";
import { makeCreateDocument } from "./application/use-cases/create-document.js";
import { makeListDocuments } from "./application/use-cases/list-documents.js";
import { makeGetDocument } from "./application/use-cases/get-document.js";
import { makeCreateSigningLink } from "./application/use-cases/create-signing-link.js";
import { makeGetDocumentByToken } from "./application/use-cases/get-document-by-token.js";
import { makeSignDocument } from "./application/use-cases/sign-document.js";
import { createAuthPreHandler } from "./interfaces/http/middleware/auth.js";
import { registerAuthRoutes } from "./interfaces/http/routes/auth-routes.js";
import { registerDocumentRoutes } from "./interfaces/http/routes/document-routes.js";
import { registerSigningRoutes } from "./interfaces/http/routes/signing-routes.js";

config();

const authRepository = createSupabaseAuthRepository();
const documentRepository = createSupabaseDocumentRepository();
const storageRepository = createSupabaseStorageRepository();

const getCurrentUser = makeGetCurrentUser(authRepository);
const createDocument = makeCreateDocument(documentRepository, storageRepository);
const listDocuments = makeListDocuments(documentRepository);
const getDocument = makeGetDocument(documentRepository, storageRepository);
const createSigningLink = makeCreateSigningLink(documentRepository);
const getDocumentByToken = makeGetDocumentByToken(documentRepository, storageRepository);
const signDocument = makeSignDocument(documentRepository);

const authPreHandler = createAuthPreHandler(getCurrentUser);

const app = Fastify({
	logger: true,
});

app.register(cors, {
	origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
});

app.register(multipart, {
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB — matches route-level MAX_FILE_SIZE
		files: 1,
	},
});

app.get("/health", async () => ({ status: "ok" }));

// Public signing routes (no auth required)
registerSigningRoutes(app, { getDocumentByToken, signDocument });

app.register(async protectedScope => {
	protectedScope.addHook("preHandler", authPreHandler);
	await protectedScope.register(registerAuthRoutes);
	registerDocumentRoutes(protectedScope, {
		createDocument,
		listDocuments,
		getDocument,
		createSigningLink,
	});
});

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

async function start() {
	try {
		await app.listen({ port, host });
		app.log.info(`Moyo backend listening on http://${host}:${port}`);
	} catch (error) {
		app.log.error(error);
		process.exit(1);
	}
}

void start();
