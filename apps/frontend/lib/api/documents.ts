function getBaseUrl(): string {
	const url = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
	if (!url && typeof window !== "undefined") {
		throw new Error(
			"NEXT_PUBLIC_BACKEND_URL is not set. Add it to .env (e.g. http://localhost:3333) and ensure the backend is running.",
		);
	}
	return url;
}

export type DocumentItem = {
	id: string;
	fileName: string;
	signerEmail: string | null;
	deadlineAt: string | null;
	status: string;
	createdAt: string;
};

export type DocumentWithViewUrl = {
	document: DocumentItem;
	viewUrl: string;
};

async function fetchWithAuth(path: string, token: string, options?: RequestInit): Promise<Response> {
	const url = `${getBaseUrl()}${path}`;
	return fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			...options?.headers,
		},
	});
}

export async function listDocuments(token: string): Promise<DocumentItem[]> {
	const res = await fetchWithAuth("/documents", token);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getDocument(id: string, token: string): Promise<DocumentWithViewUrl> {
	const res = await fetchWithAuth(`/documents/${id}`, token);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function uploadDocument(
	token: string,
	file: File,
	signerEmail?: string | null,
	deadline?: string | null,
): Promise<DocumentItem> {
	const form = new FormData();
	form.append("file", file);
	if (signerEmail) form.append("signer_email", signerEmail);
	if (deadline) form.append("deadline", deadline);

	const url = `${getBaseUrl()}/documents`;
	const res = await fetch(url, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: form,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || res.statusText);
	}
	return res.json();
}

// ── Signing link (protected — professional) ──────────────────────────

export type SigningLinkResult = {
	signingToken: string;
	signingUrl: string;
};

export async function createSigningLink(documentId: string, token: string): Promise<SigningLinkResult> {
	const res = await fetchWithAuth(`/documents/${documentId}/signing-link`, token, {
		method: "POST",
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

// ── Public signing endpoints (no auth) ───────────────────────────────

export type SigningDocument = {
	document: {
		id: string;
		fileName: string;
		signerEmail: string | null;
		deadlineAt: string | null;
		status: string;
		signedAt: string | null;
	};
	viewUrl: string;
};

export async function getDocumentByToken(signingToken: string): Promise<SigningDocument> {
	const url = `${getBaseUrl()}/signing/${signingToken}`;
	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(body.error || res.statusText);
	}
	return res.json();
}

export type SignaturePayload = {
	signatureImage: string;
	page: number;
	x: number;
	y: number;
	width: number;
	height: number;
};

export async function signDocumentByToken(
	signingToken: string,
	signature: SignaturePayload,
): Promise<{ message: string; signedAt: string }> {
	const url = `${getBaseUrl()}/signing/${signingToken}/sign`;
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(signature),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(body.error || res.statusText);
	}
	return res.json();
}
