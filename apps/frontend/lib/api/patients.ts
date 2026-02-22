function getBaseUrl(): string {
	const url = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
	if (!url && typeof window !== "undefined") {
		throw new Error(
			"NEXT_PUBLIC_BACKEND_URL is not set. Add it to .env (e.g. http://localhost:3333) and ensure the backend is running.",
		);
	}
	return url;
}

export type PatientItem = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	linkedUserId: string | null;
	createdAt: string;
	updatedAt: string;
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

export async function listPatients(token: string): Promise<PatientItem[]> {
	const res = await fetchWithAuth("/patients", token);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function createPatient(
	token: string,
	data: { name: string; email?: string | null; avatarUrl?: string | null },
): Promise<PatientItem> {
	const res = await fetchWithAuth("/patients", token, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function updatePatient(
	token: string,
	id: string,
	data: { name?: string; email?: string | null; avatarUrl?: string | null },
): Promise<PatientItem> {
	const res = await fetchWithAuth(`/patients/${id}`, token, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function deletePatient(token: string, id: string): Promise<void> {
	const res = await fetchWithAuth(`/patients/${id}`, token, {
		method: "DELETE",
	});
	if (!res.ok) throw new Error(await res.text());
}
