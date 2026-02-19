function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  if (!url && typeof window !== 'undefined') {
    throw new Error(
      'NEXT_PUBLIC_BACKEND_URL is not set. Add it to .env (e.g. http://localhost:3333) and ensure the backend is running.'
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

async function fetchWithAuth(
  path: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
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
  const res = await fetchWithAuth('/documents', token);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDocument(
  id: string,
  token: string
): Promise<DocumentWithViewUrl> {
  const res = await fetchWithAuth(`/documents/${id}`, token);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDocument(
  token: string,
  file: File,
  signerEmail?: string | null,
  deadline?: string | null
): Promise<DocumentItem> {
  const form = new FormData();
  form.append('file', file);
  if (signerEmail) form.append('signer_email', signerEmail);
  if (deadline) form.append('deadline', deadline);

  const url = `${getBaseUrl()}/documents`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}
